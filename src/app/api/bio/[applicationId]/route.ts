import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // RLS on applications ensures only the host of that podcast can read it
  const { data: application } = await supabase
    .from('applications')
    .select('id, bio_pdf_url, podcast_id')
    .eq('id', params.applicationId)
    .single()

  if (!application || !application.bio_pdf_url) {
    return new NextResponse('Not found', { status: 404 })
  }

  const adminSupabase = createAdminClient()
  const { data: signedUrlData } = await adminSupabase.storage
    .from('bio-uploads')
    .createSignedUrl(application.bio_pdf_url, 3600)

  if (!signedUrlData?.signedUrl) {
    return new NextResponse('Could not generate download link', { status: 500 })
  }

  return NextResponse.redirect(signedUrlData.signedUrl)
}

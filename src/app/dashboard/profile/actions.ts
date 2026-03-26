'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const fullName = (formData.get('full_name') as string | null)?.trim() ?? ''
  const bio = (formData.get('bio') as string | null)?.trim() ?? null
  const websiteUrl = (formData.get('website_url') as string | null)?.trim() || null
  const twitter = (formData.get('twitter') as string | null)?.trim() || null
  const linkedin = (formData.get('linkedin') as string | null)?.trim() || null
  const instagram = (formData.get('instagram') as string | null)?.trim() || null
  const facebook = (formData.get('facebook') as string | null)?.trim() || null

  if (!fullName) {
    redirect('/dashboard/profile?error=Name+is+required.')
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      bio: bio || null,
      website_url: websiteUrl,
      social_links: { twitter, linkedin, instagram, facebook },
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    redirect('/dashboard/profile?error=Could+not+save+profile.+Please+try+again.')
  }

  redirect('/dashboard/profile?message=Profile+updated.')
}

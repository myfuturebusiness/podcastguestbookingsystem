import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = body.event_type as string

  // Handle subscription cancelled / suspended / expired
  if (
    eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
    eventType === 'BILLING.SUBSCRIPTION.SUSPENDED' ||
    eventType === 'BILLING.SUBSCRIPTION.EXPIRED'
  ) {
    const resource = body.resource as Record<string, unknown> | undefined
    const customId = resource?.custom_id as string | undefined

    if (customId) {
      const adminSupabase = createAdminClient()
      await adminSupabase
        .from('profiles')
        .update({ role: 'guest', host_plan: null })
        .eq('id', customId)
        .eq('host_plan', 'monthly')
    }
  }

  return NextResponse.json({ received: true })
}

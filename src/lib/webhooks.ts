import { createAdminClient } from '@/lib/supabase/admin'

export type WebhookEvent =
  | 'waitlist.signup'
  | 'booking.confirmed'
  | 'application.submitted'

export async function fireWebhooks(event: WebhookEvent, payload: Record<string, unknown>) {
  const adminSupabase = createAdminClient()

  const { data: endpoints } = await adminSupabase
    .from('webhook_endpoints')
    .select('id, url, secret')
    .eq('is_active', true)
    .contains('events', [event])

  if (!endpoints || endpoints.length === 0) return

  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  })

  await Promise.allSettled(
    endpoints.map(async (ep) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (ep.secret) {
        headers['X-Webhook-Secret'] = ep.secret
      }

      try {
        const res = await fetch(ep.url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) {
          console.error(`Webhook ${ep.id} responded ${res.status}`)
        }
      } catch (err) {
        console.error(`Webhook ${ep.id} failed:`, err)
      }
    })
  )
}

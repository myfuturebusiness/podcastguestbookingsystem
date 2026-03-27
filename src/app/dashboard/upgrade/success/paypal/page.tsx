import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import {
  capturePayPalPlatformOrder,
  getPayPalSubscription,
} from '@/lib/paypal'
import FoundingMemberThankYou from '../FoundingMemberThankYou'
import MonthlyThankYou from '../MonthlyThankYou'

export default async function PayPalSuccessPage({
  searchParams,
}: {
  searchParams: { plan?: string; token?: string; subscription_id?: string; ba_token?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const plan = searchParams.plan
  if (!plan) redirect('/dashboard')

  const adminSupabase = createAdminClient()
  let activated = false

  try {
    if (plan === 'founding') {
      // token is the PayPal order ID for one-time payments
      const orderId = searchParams.token
      if (!orderId) redirect('/dashboard/upgrade?error=paypal_failed')

      const { success, customId } = await capturePayPalPlatformOrder(orderId)
      if (success && customId === user.id) {
        await adminSupabase
          .from('profiles')
          .update({
            role: 'host',
            host_plan: 'founding',
            host_subscribed_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .eq('role', 'guest')
        activated = true
      }
    } else if (plan === 'monthly') {
      // subscription_id is passed for subscription payments
      const subscriptionId = searchParams.subscription_id
      if (!subscriptionId) redirect('/dashboard/upgrade?error=paypal_failed')

      const { status, customId } = await getPayPalSubscription(subscriptionId)
      if ((status === 'ACTIVE' || status === 'APPROVED') && customId === user.id) {
        await adminSupabase
          .from('profiles')
          .update({
            role: 'host',
            host_plan: 'monthly',
            host_subscribed_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .eq('role', 'guest')
        activated = true
      }
    }
  } catch {
    redirect('/dashboard/upgrade?error=paypal_failed')
  }

  if (!activated) redirect('/dashboard/upgrade?error=paypal_failed')

  if (plan === 'founding') return <FoundingMemberThankYou />
  return <MonthlyThankYou />
}

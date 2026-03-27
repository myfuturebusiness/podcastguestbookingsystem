import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import FoundingMemberThankYou from './FoundingMemberThankYou'
import MonthlyThankYou from './MonthlyThankYou'

export default async function UpgradeSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const sessionId = searchParams.session_id
  if (!sessionId) redirect('/dashboard')

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.replace(/\s/g, ''))
  let plan: string | null = null
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const isPaid =
      session.payment_status === 'paid' ||
      session.status === 'complete'
    const isOwner = session.metadata?.supabase_user_id === user.id

    if (isPaid && isOwner) {
      plan = session.metadata?.plan ?? null

      const adminSupabase = createAdminClient()
      await adminSupabase
        .from('profiles')
        .update({
          role: 'host',
          host_plan: plan,
          host_subscribed_at: new Date().toISOString(),
          stripe_customer_id: typeof session.customer === 'string'
            ? session.customer
            : (session.customer?.id ?? null),
        })
        .eq('id', user.id)
        .eq('role', 'guest')
    }
  } catch {
    redirect('/dashboard')
  }

  if (plan === 'founding') return <FoundingMemberThankYou />
  return <MonthlyThankYou />
}

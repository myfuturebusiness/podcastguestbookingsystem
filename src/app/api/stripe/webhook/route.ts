import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.replace(/\s/g, ''))
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  // If no webhook secret configured, skip signature verification (dev only)
  let event: Stripe.Event
  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch {
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }
  } else {
    try {
      event = JSON.parse(body) as Stripe.Event
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
  }

  const adminSupabase = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const isPaid =
      session.payment_status === 'paid' ||
      session.status === 'complete'

    if (!isPaid) return NextResponse.json({ received: true })

    const userId = session.metadata?.supabase_user_id
    const plan = session.metadata?.plan

    if (!userId || !plan) return NextResponse.json({ received: true })

    await adminSupabase
      .from('profiles')
      .update({
        role: 'host',
        host_plan: plan,
        host_subscribed_at: new Date().toISOString(),
        stripe_customer_id: typeof session.customer === 'string'
          ? session.customer
          : null,
      })
      .eq('id', userId)
  }

  // Monthly subscription cancelled — downgrade back to guest, keep account intact
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id

    if (customerId) {
      await adminSupabase
        .from('profiles')
        .update({ role: 'guest', host_plan: null })
        .eq('stripe_customer_id', customerId)
        .eq('host_plan', 'monthly') // Never downgrade founding members
    }
  }

  return NextResponse.json({ received: true })
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'

const PRICE_IDS: Record<string, string> = {
  founding: process.env.STRIPE_PRICE_FOUNDING!,
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
}

const FOUNDING_MAX_SEATS = parseInt(process.env.STRIPE_FOUNDING_MAX_SEATS ?? '25', 10)

export async function createCheckoutSession(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, host_plan, stripe_customer_id, full_name, email')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'host') redirect('/dashboard')

  const plan = formData.get('plan') as string
  if (!['founding', 'monthly'].includes(plan)) return

  // Enforce founding member cap
  if (plan === 'founding') {
    const adminSupabase = createAdminClient()
    const { count } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('host_plan', 'founding')

    if ((count ?? 0) >= FOUNDING_MAX_SEATS) {
      redirect('/dashboard/upgrade?error=founding_sold_out')
    }
  }

  const priceId = PRICE_IDS[plan]
  if (!priceId) return

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.replace(/\s/g, ''))

  // Reuse or create Stripe customer
  let customerId = profile?.stripe_customer_id ?? undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email,
      name: profile?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await createAdminClient()
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: plan === 'founding' ? 'payment' : 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { supabase_user_id: user.id, plan },
    success_url: `${appUrl}/dashboard/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/upgrade?cancelled=1`,
  })

  redirect(session.url!)
}

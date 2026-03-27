'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getAppUrl } from '@/lib/app-url'
import { getPricingSettings } from '@/lib/platform-settings'
import {
  createPayPalSubscription,
  createPayPalPlatformOrder,
} from '@/lib/paypal'

export async function createPayPalCheckout(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'host') redirect('/dashboard')

  const plan = formData.get('plan') as string
  if (!['founding', 'monthly'].includes(plan)) return

  const pricing = await getPricingSettings()
  const appUrl = getAppUrl()

  // Enforce founding cap
  if (plan === 'founding') {
    const adminSupabase = createAdminClient()
    const { count } = await adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('host_plan', 'founding')

    if ((count ?? 0) >= pricing.founding_max_seats) {
      redirect('/dashboard/upgrade?error=founding_sold_out')
    }

    // One-time $297 order
    const { approvalUrl } = await createPayPalPlatformOrder({
      amountCents: 29700,
      returnUrl: `${appUrl}/dashboard/upgrade/success/paypal?plan=founding`,
      cancelUrl: `${appUrl}/dashboard/upgrade?cancelled=1`,
      customId: user.id,
    })

    redirect(approvalUrl)
  }

  // Monthly subscription
  if (!pricing.paypal_plan_monthly) {
    redirect('/dashboard/upgrade?error=paypal_unavailable')
  }

  const { approvalUrl } = await createPayPalSubscription({
    planId: pricing.paypal_plan_monthly,
    returnUrl: `${appUrl}/dashboard/upgrade/success/paypal?plan=monthly`,
    cancelUrl: `${appUrl}/dashboard/upgrade?cancelled=1`,
    customId: user.id,
  })

  redirect(approvalUrl)
}

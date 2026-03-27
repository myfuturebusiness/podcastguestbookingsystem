'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function savePricingSettings(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const updates: Array<{ key: string; value: string }> = [
    { key: 'stripe_price_founding', value: (formData.get('stripe_price_founding') as string).trim() },
    { key: 'stripe_price_monthly',  value: (formData.get('stripe_price_monthly')  as string).trim() },
    { key: 'founding_max_seats',    value: (formData.get('founding_max_seats')    as string).trim() },
    { key: 'price_founding_display',value: (formData.get('price_founding_display') as string).trim() },
    { key: 'price_monthly_display', value: (formData.get('price_monthly_display')  as string).trim() },
  ]

  const adminSupabase = createAdminClient()
  for (const row of updates) {
    if (!row.value) continue
    await adminSupabase
      .from('platform_settings')
      .upsert({ key: row.key, value: row.value, updated_at: new Date().toISOString() })
  }

  redirect('/admin?tab=pricing&saved=1')
}

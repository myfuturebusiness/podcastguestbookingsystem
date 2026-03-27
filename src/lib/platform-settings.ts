import { createAdminClient } from '@/lib/supabase/admin'

export interface PricingSettings {
  stripe_price_founding: string
  stripe_price_monthly: string
  founding_max_seats: number
  price_founding_display: string
  price_monthly_display: string
}

const DEFAULTS: PricingSettings = {
  stripe_price_founding: (process.env.STRIPE_PRICE_FOUNDING ?? '').trim(),
  stripe_price_monthly:  (process.env.STRIPE_PRICE_MONTHLY ?? '').trim(),
  founding_max_seats:    parseInt(process.env.STRIPE_FOUNDING_MAX_SEATS ?? '25', 10),
  price_founding_display: '$297 one-time',
  price_monthly_display:  '$47/month',
}

export async function getPricingSettings(): Promise<PricingSettings> {
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('platform_settings')
    .select('key, value')
    .in('key', Object.keys(DEFAULTS))

  if (!data || data.length === 0) return DEFAULTS

  const map = Object.fromEntries(data.map((r) => [r.key, r.value]))
  return {
    stripe_price_founding: map.stripe_price_founding ?? DEFAULTS.stripe_price_founding,
    stripe_price_monthly:  map.stripe_price_monthly  ?? DEFAULTS.stripe_price_monthly,
    founding_max_seats:    parseInt(map.founding_max_seats ?? String(DEFAULTS.founding_max_seats), 10),
    price_founding_display: map.price_founding_display ?? DEFAULTS.price_founding_display,
    price_monthly_display:  map.price_monthly_display  ?? DEFAULTS.price_monthly_display,
  }
}

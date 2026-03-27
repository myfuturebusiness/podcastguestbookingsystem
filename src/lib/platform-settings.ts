import { createAdminClient } from '@/lib/supabase/admin'

export interface PricingSettings {
  stripe_price_founding: string
  stripe_price_monthly: string
  founding_max_seats: number
  price_founding_display: string
  price_monthly_display: string
  paypal_plan_monthly: string
  paypal_product_id: string
}

const DEFAULTS: PricingSettings = {
  stripe_price_founding: (process.env.STRIPE_PRICE_FOUNDING ?? '').trim(),
  stripe_price_monthly:  (process.env.STRIPE_PRICE_MONTHLY ?? '').trim(),
  founding_max_seats:    parseInt(process.env.STRIPE_FOUNDING_MAX_SEATS ?? '25', 10),
  price_founding_display: '$297 one-time',
  price_monthly_display:  '$47/month',
  paypal_plan_monthly:   '',
  paypal_product_id:     '',
}

const ALL_KEYS = [
  'stripe_price_founding', 'stripe_price_monthly', 'founding_max_seats',
  'price_founding_display', 'price_monthly_display',
  'paypal_plan_monthly', 'paypal_product_id',
]

export async function getPricingSettings(): Promise<PricingSettings> {
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ALL_KEYS)

  if (!data || data.length === 0) return DEFAULTS

  const map = Object.fromEntries(data.map((r) => [r.key, r.value]))
  return {
    stripe_price_founding:  map.stripe_price_founding  ?? DEFAULTS.stripe_price_founding,
    stripe_price_monthly:   map.stripe_price_monthly   ?? DEFAULTS.stripe_price_monthly,
    founding_max_seats:     parseInt(map.founding_max_seats ?? String(DEFAULTS.founding_max_seats), 10),
    price_founding_display: map.price_founding_display ?? DEFAULTS.price_founding_display,
    price_monthly_display:  map.price_monthly_display  ?? DEFAULTS.price_monthly_display,
    paypal_plan_monthly:    map.paypal_plan_monthly     ?? DEFAULTS.paypal_plan_monthly,
    paypal_product_id:      map.paypal_product_id       ?? DEFAULTS.paypal_product_id,
  }
}

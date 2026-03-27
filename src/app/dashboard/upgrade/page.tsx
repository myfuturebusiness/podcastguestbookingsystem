import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import FormButton from '@/components/ui/FormButton'
import { createCheckoutSession } from './actions'
import { createPayPalCheckout } from './paypal-actions'
import { getPricingSettings } from '@/lib/platform-settings'

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: { error?: string; cancelled?: string; paypal_unavailable?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'host' || profile?.role === 'admin') redirect('/dashboard')

  // Load pricing from DB + live founding count in parallel
  const adminSupabase = createAdminClient()
  const [pricing, { count: foundingCount }] = await Promise.all([
    getPricingSettings(),
    adminSupabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('host_plan', 'founding'),
  ])

  const foundingTaken = foundingCount ?? 0
  const foundingRemaining = Math.max(0, pricing.founding_max_seats - foundingTaken)
  const foundingSoldOut = foundingRemaining === 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <Logo compact />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ← Back to dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Become a Host</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Choose the plan that works for you. Everything is included in both.
          </p>
        </div>

        {searchParams.error === 'founding_sold_out' && (
          <div className="mb-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-5 py-4 text-sm text-amber-700 dark:text-amber-400">
            The Founding Member offer has sold out. Please choose the monthly plan below.
          </div>
        )}

        {searchParams.cancelled === '1' && (
          <div className="mb-8 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
            Payment cancelled — no charge was made. You can try again any time.
          </div>
        )}

        {searchParams.error === 'paypal_failed' && (
          <div className="mb-8 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-5 py-4 text-sm text-red-700 dark:text-red-400">
            Your PayPal payment could not be confirmed. No charge was made. Please try again or use a card instead.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">

          {/* Founding Member */}
          <div className={`relative rounded-2xl flex flex-col ${foundingSoldOut ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-60' : 'bg-indigo-600 text-white shadow-xl'} p-8`}>
            {!foundingSoldOut && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center rounded-full bg-indigo-500 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-sm whitespace-nowrap">
                  ⚡ Founding Member
                </span>
              </div>
            )}
            {foundingSoldOut && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center rounded-full bg-gray-400 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-sm whitespace-nowrap">
                  Sold Out
                </span>
              </div>
            )}

            <p className={`text-sm font-semibold uppercase tracking-widest mb-3 mt-4 ${foundingSoldOut ? 'text-gray-500 dark:text-gray-400' : 'text-indigo-200'}`}>
              Lifetime Access
            </p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-black tracking-tight whitespace-nowrap">{pricing.price_founding_display}</span>
            </div>
            <p className={`text-sm mb-6 ${foundingSoldOut ? 'text-gray-500 dark:text-gray-400' : 'text-indigo-200'}`}>
              Pay once. Use forever.
            </p>

            {!foundingSoldOut && (
              <p className="text-xs font-semibold text-indigo-300 mb-6">
                {foundingRemaining} of {pricing.founding_max_seats} spots remaining
              </p>
            )}

            <ul className="flex flex-col gap-2.5 flex-1">
              {[
                'Everything in the platform, forever',
                'Up to 3 shows',
                'All features included',
                'Locked in before prices increase',
                'Priority onboarding support',
              ].map((f) => (
                <li key={f} className={`flex items-start gap-3 text-sm ${foundingSoldOut ? 'text-gray-500 dark:text-gray-400' : 'text-indigo-100'}`}>
                  <svg className={`w-5 h-5 shrink-0 mt-0.5 ${foundingSoldOut ? 'text-gray-400' : 'text-indigo-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3">
              <form action={createCheckoutSession}>
                <input type="hidden" name="plan" value="founding" />
                <FormButton
                  disabled={foundingSoldOut}
                  className="w-full rounded-xl bg-white text-indigo-700 font-bold text-sm py-3.5 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {foundingSoldOut ? 'Sold Out' : 'Pay with Card →'}
                </FormButton>
              </form>

              {!foundingSoldOut && (
                <form action={createPayPalCheckout}>
                  <input type="hidden" name="plan" value="founding" />
                  <FormButton className="w-full rounded-xl bg-[#0070BA] text-white font-bold text-sm py-3.5 hover:bg-[#005ea6] transition-colors flex items-center justify-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082h-2.19c-1.53 0-2.82 1.118-3.053 2.632l-1.12 7.106H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c1.929 0 3.476.346 4.589 1.084 1.014.682 1.595 1.666 1.908 2.923-.3-.045-.604-.07-.733-.09z"/>
                    </svg>
                    Pay with PayPal
                  </FormButton>
                </form>
              )}
              <p className={`text-center text-xs ${foundingSoldOut ? 'text-gray-400 dark:text-gray-500' : 'text-indigo-300/70'}`}>
                Secure payment via Stripe or PayPal
              </p>
            </div>
          </div>

          {/* Monthly */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-8 shadow-sm flex flex-col">
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 mt-4">
              Monthly
            </p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-black tracking-tight text-gray-900 dark:text-white">{pricing.price_monthly_display}</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Cancel anytime. No lock-in.
            </p>

            <ul className="flex flex-col gap-2.5 flex-1">
              {[
                'Everything in the platform',
                'Up to 3 shows',
                'All features included',
                'Cancel anytime',
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3">
              <form action={createCheckoutSession}>
                <input type="hidden" name="plan" value="monthly" />
                <FormButton className="w-full rounded-xl bg-indigo-600 text-white font-bold text-sm py-3.5 hover:bg-indigo-700 transition-colors flex items-center justify-center">
                  Pay with Card →
                </FormButton>
              </form>
              <form action={createPayPalCheckout}>
                <input type="hidden" name="plan" value="monthly" />
                <FormButton className="w-full rounded-xl bg-[#0070BA] text-white font-bold text-sm py-3.5 hover:bg-[#005ea6] transition-colors flex items-center justify-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082h-2.19c-1.53 0-2.82 1.118-3.053 2.632l-1.12 7.106H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c1.929 0 3.476.346 4.589 1.084 1.014.682 1.595 1.666 1.908 2.923-.3-.045-.604-.07-.733-.09z"/>
                  </svg>
                  Pay with PayPal
                </FormButton>
              </form>
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                Secure payment via Stripe or PayPal
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

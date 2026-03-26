import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import FormButton from '@/components/ui/FormButton'
import { createCheckoutSession } from './actions'

const FOUNDING_MAX_SEATS = parseInt(process.env.STRIPE_FOUNDING_MAX_SEATS ?? '25', 10)

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: { error?: string; cancelled?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'host') redirect('/dashboard')

  // Live founding member count
  const adminSupabase = createAdminClient()
  const { count: foundingCount } = await adminSupabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('host_plan', 'founding')

  const foundingTaken = foundingCount ?? 0
  const foundingRemaining = Math.max(0, FOUNDING_MAX_SEATS - foundingTaken)
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

        <div className="grid md:grid-cols-2 gap-6">

          {/* Founding Member */}
          <div className={`relative rounded-2xl flex flex-col ${foundingSoldOut ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-60' : 'bg-indigo-600 text-white shadow-xl'} p-8`}>
            {!foundingSoldOut && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center rounded-full bg-amber-400 px-4 py-1 text-xs font-bold uppercase tracking-widest text-amber-900 shadow-sm whitespace-nowrap">
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

            <div className="mt-4">
              <p className={`text-sm font-semibold uppercase tracking-widest mb-3 ${foundingSoldOut ? 'text-gray-500 dark:text-gray-400' : 'text-indigo-200'}`}>
                Lifetime Access
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black tracking-tight">$297</span>
                <span className={`mb-2 text-sm font-medium ${foundingSoldOut ? 'text-gray-400' : 'text-indigo-300'}`}>once</span>
              </div>
              <p className={`text-sm mb-6 ${foundingSoldOut ? 'text-gray-500 dark:text-gray-400' : 'text-indigo-200'}`}>
                Pay once. Use forever.
              </p>

              {!foundingSoldOut && (
                <p className="text-xs font-semibold text-amber-300 mb-6">
                  {foundingRemaining} of {FOUNDING_MAX_SEATS} spots remaining
                </p>
              )}

              <ul className="flex flex-col gap-2.5 mb-8">
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

              <form action={createCheckoutSession}>
                <input type="hidden" name="plan" value="founding" />
                <FormButton
                  disabled={foundingSoldOut}
                  className="w-full rounded-xl bg-white text-indigo-700 font-bold text-sm py-3.5 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {foundingSoldOut ? 'Sold Out' : 'Claim Founding Member Spot →'}
                </FormButton>
              </form>
            </div>
          </div>

          {/* Monthly */}
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-8 shadow-sm flex flex-col">
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 mt-4">
              Monthly
            </p>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-black tracking-tight text-gray-900 dark:text-white">$47</span>
              <span className="text-gray-400 mb-2 text-sm font-medium">/month</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Cancel anytime. No lock-in.
            </p>

            <ul className="flex flex-col gap-2.5 mb-8">
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

            <form action={createCheckoutSession} className="mt-auto">
              <input type="hidden" name="plan" value="monthly" />
              <FormButton className="w-full rounded-xl bg-indigo-600 text-white font-bold text-sm py-3.5 hover:bg-indigo-700 transition-colors">
                Get Started →
              </FormButton>
            </form>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
              Secure payment via Stripe
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}

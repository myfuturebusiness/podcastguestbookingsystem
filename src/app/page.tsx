import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'
import WaitlistForm from './WaitlistForm'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Icons ──────────────────────────────────────────────────────────────────

function IconMic() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5a3.75 3.75 0 00-3.75 3.75v6a3.75 3.75 0 007.5 0v-6A3.75 3.75 0 0012 1.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5a7.5 7.5 0 01-15 0M12 18.75v3M8.25 22.5h7.5" />
    </svg>
  )
}
function IconCalendar() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}
function IconEnvelope() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}
function IconCreditCard() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  )
}
function IconChat() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}
function IconX() {
  return (
    <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

const FOUNDING_MAX_SEATS = parseInt(process.env.STRIPE_FOUNDING_MAX_SEATS ?? '25', 10)

export default async function HomePage() {
  const adminSupabase = createAdminClient()
  const { count: foundingCount } = await adminSupabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('host_plan', 'founding')

  const foundingTaken = foundingCount ?? 0
  const foundingRemaining = Math.max(0, FOUNDING_MAX_SEATS - foundingTaken)
  const foundingSoldOut = foundingRemaining === 0
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo compact />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/auth/signin"
              className="hidden sm:inline-flex rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.25),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300 mb-8">
              Now in early access
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Stop Managing Guest Bookings <span className="text-indigo-300">Across Five Different Tools.</span>
            </h1>
            <p className="text-lg sm:text-xl text-indigo-100/80 leading-relaxed mb-10 max-w-2xl">
              Guest Booking System&#8482; is the all-in-one platform that handles applications, scheduling, payments, automated emails, and guest communication — so you can focus on creating great content, not chasing logistics.
            </p>
            <div className="relative">
              <WaitlistForm dark />
              <p className="mt-3 text-sm text-indigo-300/70">
                Free to get started. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-10">
            Built for anyone who books guests or clients
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {[
              { icon: '🎙️', title: 'Podcast Hosts', desc: 'Manage guest applications and approvals without the back-and-forth.' },
              { icon: '📻', title: 'Radio Stations', desc: 'Coordinate multiple shows and presenters from one place.' },
              { icon: '🎪', title: 'Event Managers', desc: 'Book speakers, performers, and panellists with structured workflows.' },
              { icon: '🎬', title: 'Show Coordinators', desc: 'Keep every booking, payment, and conversation in a single dashboard.' },
              { icon: '💼', title: 'Small Businesses', desc: 'A professional, branded booking experience for your clients.' },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center text-center p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm"
              >
                <span className="text-3xl mb-3">{item.icon}</span>
                <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{item.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The problem ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Sound familiar?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Most hosts are cobbling together email, calendars, spreadsheets, invoicing tools, and messaging apps just to book one guest. It&apos;s slow, unprofessional, and it costs you time you don&apos;t have.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Old way */}
            <div className="rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10 p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-red-500 mb-5">The old way</p>
              <ul className="flex flex-col gap-3">
                {[
                  'Email chains just to find a time that works',
                  'Calendar links that guests ignore or misread',
                  'Chasing payments via bank transfer or PayPal links',
                  'Manually sending confirmation emails — and forgetting to',
                  'No record of who applied, who was approved, or who cancelled',
                  'Guests messaging you on three different platforms at once',
                  'Starting from scratch every single time',
                ].map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <IconX />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* New way */}
            <div className="rounded-2xl border border-indigo-100 dark:border-indigo-800/40 bg-indigo-50/50 dark:bg-indigo-900/10 p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-500 mb-5">With Guest Booking System&#8482;</p>
              <ul className="flex flex-col gap-3">
                {[
                  'Guests apply through your own branded booking page',
                  'They pick a time from your live availability — no back-and-forth',
                  'Optional booking fees collected automatically via Stripe or PayPal — or keep it free',
                  'Confirmation emails sent the moment a slot is booked',
                  'Every application, booking, and message in one dashboard',
                  'Built-in chat so guests can reach you without leaving the platform',
                  'The whole process repeats automatically for every new guest',
                ].map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <IconCheck />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              One platform that handles the entire guest booking lifecycle from first application to completed interview.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <IconMic />,
                title: 'Branded Booking Pages',
                desc: 'Each show gets its own public booking page. Guests apply directly — your brand, your process, your rules.',
              },
              {
                icon: <IconCalendar />,
                title: 'Smart Scheduling',
                desc: 'Set your weekly availability once. Guests choose from your live open slots on a calendar. No double-bookings, ever.',
              },
              {
                icon: <IconCreditCard />,
                title: 'Built-in Payments',
                desc: 'Charging a fee is completely optional — keep your show free or set any price you like. If you do charge, fees are collected via Stripe or PayPal before the slot is confirmed.',
              },
              {
                icon: <IconEnvelope />,
                title: 'Automated Emails',
                desc: 'Every step of the journey triggers the right email automatically — application received, slot confirmed, approved, rescheduled, and more.',
              },
              {
                icon: <IconChat />,
                title: 'Built-in Messaging',
                desc: 'Hosts and guests can message each other directly inside the platform. No more hunting through email threads.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                ),
                title: 'Full Application Management',
                desc: 'Review guest applications with their bio, topic pitch, and social profiles. Approve, reject, or request a reschedule with one click.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 shadow-sm"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Up and running in minutes
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No technical setup. No integrations to configure. No developer required.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Create your show profile', desc: 'Add your show name, description, booking packages, and availability. Takes five minutes.' },
              { step: '02', title: 'Share your booking link', desc: 'Copy your unique booking page URL and share it anywhere — social media, your website, your email signature.' },
              { step: '03', title: 'Guests apply and book', desc: 'Guests fill in their details and pick a time that suits them. If you charge a fee, they pay it then — all on one page.' },
              { step: '04', title: 'You review and approve', desc: 'Log in to your dashboard, review the application, and approve it with one click. The guest is notified automatically.' },
            ].map((s) => (
              <div key={s.step} className="relative">
                <p className="text-5xl font-black text-indigo-200 dark:text-indigo-900 leading-none mb-3 select-none">{s.step}</p>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              One plan, two ways to pay. No hidden fees. No per-booking charges from us.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

            {/* Founding Member */}
            <div className={`relative rounded-2xl p-8 shadow-xl flex flex-col ${foundingSoldOut ? 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-60' : 'bg-indigo-600 text-white'}`}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest shadow-sm whitespace-nowrap ${foundingSoldOut ? 'bg-gray-400 text-white' : 'bg-indigo-800 text-indigo-200'}`}>
                  {!foundingSoldOut && (
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                  )}
                  {foundingSoldOut ? 'Sold Out' : `Founding Member — ${foundingRemaining} spots left`}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-200 mb-3">
                  Lifetime Access
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black tracking-tight">$297</span>
                  <span className="text-indigo-300 mb-2 text-sm font-medium">once</span>
                </div>
                <p className="text-indigo-200 text-sm mb-8">
                  Pay once. Use forever. Never pay again — even as we raise prices.
                </p>
                <ul className="flex flex-col gap-3 mb-10">
                  {[
                    'Everything in the platform, forever',
                    'Up to 3 shows',
                    'Branded booking pages',
                    'Smart scheduling & availability',
                    'Optional booking fees via Stripe or PayPal',
                    'Automated confirmation emails',
                    'Built-in guest messaging',
                    'Full application management',
                    'Priority onboarding support',
                    'Locked in before prices increase',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-indigo-100">
                      <svg className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={foundingSoldOut ? '#' : '/auth/signup?plan=founding'}
                  className={`mt-auto block w-full rounded-xl font-bold text-sm text-center py-3.5 transition-colors focus:outline-none focus:ring-2 focus:ring-white ${foundingSoldOut ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed' : 'bg-white text-indigo-700 hover:bg-indigo-50'}`}
                >
                  {foundingSoldOut ? 'Sold Out' : 'Claim Founding Member Spot →'}
                </Link>
                <p className={`text-center text-xs mt-3 ${foundingSoldOut ? 'text-gray-400' : 'text-indigo-300'}`}>
                  {foundingSoldOut ? 'All founding member spots have been claimed' : `Only ${foundingRemaining} of ${FOUNDING_MAX_SEATS} spots remaining`}
                </p>
              </div>
            </div>

            {/* Monthly */}
            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 shadow-sm flex flex-col">
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
                Monthly
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black tracking-tight text-gray-900 dark:text-white">$47</span>
                <span className="text-gray-400 mb-2 text-sm font-medium">/month</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                Cancel anytime. No lock-in.
              </p>
              <ul className="flex flex-col gap-3 mb-10">
                {[
                  'Everything in the platform',
                  'Up to 3 shows',
                  'Branded booking pages',
                  'Smart scheduling & availability',
                  'Optional booking fees via Stripe or PayPal',
                  'Automated confirmation emails',
                  'Built-in guest messaging',
                  'Full application management',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup?plan=monthly"
                className="mt-auto block w-full rounded-xl bg-indigo-600 text-white font-bold text-sm text-center py-3.5 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Get Started →
              </Link>
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
                No credit card required to sign up
              </p>
            </div>

          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-10">
            Already a host?{' '}
            <Link href="/auth/signin" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign in →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to simplify your guest bookings?
          </h2>
          <p className="text-indigo-200/80 text-lg mb-10 max-w-xl mx-auto">
            Join the waitlist and be among the first to get access. Early members get priority onboarding and locked-in founding rates.
          </p>
          <div className="flex justify-center">
            <WaitlistForm dark />
          </div>
          <p className="mt-6 text-sm text-indigo-300/60">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-indigo-300 hover:text-white underline underline-offset-2 transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <Logo compact />
          <div className="flex items-center gap-6">
            <Link href="/auth/signin" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Sign in</Link>
            <Link href="/auth/signup" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Sign up</Link>
          </div>
          <p>© {new Date().getFullYear()} My Future Business&#174;. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}

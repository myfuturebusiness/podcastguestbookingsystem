import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Stripe from 'stripe'

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

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim())
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

  if (plan === 'founding') {
    return <FoundingMemberThankYou />
  }

  return <MonthlyThankYou />
}

// ── Founding Member — celebratory, premium feel ─────────────────────────────

function FoundingMemberThankYou() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 text-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">

        {/* Badge */}
        <div className="inline-flex items-center rounded-full bg-amber-400/20 border border-amber-400/40 px-5 py-2 text-sm font-bold uppercase tracking-widest text-amber-300 mb-8">
          ⚡ Founding Member
        </div>

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight mb-4">
          You&apos;re in. Forever.
        </h1>
        <p className="text-indigo-200 text-lg leading-relaxed mb-3">
          Welcome to the Guest Booking System as a Founding Member.
          You&apos;ve secured lifetime access at today&apos;s price — it will never increase for you, no matter what we charge in the future.
        </p>
        <p className="text-indigo-300/70 text-sm mb-10">
          A receipt has been sent to your email. Your account is fully active.
        </p>

        {/* What's next */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8 text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-4">
            Your next steps
          </p>
          <ul className="flex flex-col gap-3">
            {[
              'Create your show profile — add your name, description, and availability',
              'Set your booking fee (optional — keep it free if you prefer)',
              'Share your booking link and start accepting guests',
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm text-indigo-100">
                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-400/30 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/dashboard/podcast/new"
          className="block w-full rounded-xl bg-amber-400 text-amber-900 font-bold text-sm py-4 hover:bg-amber-300 transition-colors mb-4"
        >
          Create your first show →
        </Link>
        <Link
          href="/dashboard"
          className="block text-sm text-indigo-400 hover:text-indigo-200 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}

// ── Monthly subscriber — clean, warm, practical ──────────────────────────────

function MonthlyThankYou() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-10 text-center">

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Guest Booking System!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Your Host account is active and ready to go.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Your subscription renews monthly. You can cancel any time from your account settings. A receipt has been sent to your email.
        </p>

        {/* What's next */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 mb-6 text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
            Get started in 3 steps
          </p>
          <ul className="flex flex-col gap-2.5">
            {[
              'Create your show profile',
              'Set your availability',
              'Share your booking link',
            ].map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/dashboard/podcast/new"
          className="block w-full rounded-xl bg-indigo-600 text-white font-bold text-sm py-3.5 hover:bg-indigo-700 transition-colors mb-3"
        >
          Create your first show →
        </Link>
        <Link
          href="/dashboard"
          className="block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}

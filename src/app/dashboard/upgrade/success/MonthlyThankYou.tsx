import Link from 'next/link'

export default function MonthlyThankYou() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-3">
          Welcome To The Guest Booking System!
        </h1>
        <p className="text-indigo-200 text-lg mb-3">
          Your Host account is active and ready to go.
        </p>
        <div className="flex flex-col gap-1.5 mb-10">
          <p className="text-sm text-indigo-300/70">Renews monthly &mdash; cancel any time from your account settings.</p>
          <p className="text-sm text-indigo-300/70">A receipt has been sent to your email.</p>
        </div>

        {/* What's next */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8 text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-4">
            Get started in 3 steps
          </p>
          <ul className="flex flex-col gap-3">
            {[
              'Create your show profile',
              'Set your availability',
              'Share your booking link',
            ].map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm text-indigo-100">
                <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-500/30 border border-indigo-400/50 text-indigo-300 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/dashboard/podcast/new"
          className="block w-full rounded-xl bg-indigo-500 text-white font-bold text-sm py-4 hover:bg-indigo-400 transition-colors mb-4"
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

import Link from 'next/link'

export default function MonthlyThankYou() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl border border-gray-700 shadow-xl p-10 text-center">

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-2 whitespace-nowrap">
          Welcome To The Guest Booking System!
        </h1>
        <p className="text-gray-400 mb-3">
          Your Host account is active and ready to go.
        </p>
        <div className="flex flex-col gap-1 mb-8">
          <p className="text-xs text-gray-500 whitespace-nowrap">Renews monthly &mdash; cancel any time from your account settings.</p>
          <p className="text-xs text-gray-500">A receipt has been sent to your email.</p>
        </div>

        {/* What's next */}
        <div className="bg-gray-800 rounded-xl p-5 mb-6 text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
            Get started in 3 steps
          </p>
          <ul className="flex flex-col gap-2.5">
            {[
              'Create your show profile',
              'Set your availability',
              'Share your booking link',
            ].map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm text-gray-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-900/60 text-indigo-400 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/dashboard/podcast/new"
          className="block w-full rounded-xl bg-indigo-600 text-white font-bold text-sm py-3.5 hover:bg-indigo-500 transition-colors mb-3"
        >
          Create your first show →
        </Link>
        <Link
          href="/dashboard"
          className="block text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}

import Link from 'next/link'

export default function MonthlyThankYou() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-10 text-center">

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 whitespace-nowrap">
          Welcome To The Guest Booking System!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Your Host account is active and ready to go.
        </p>
        <div className="flex flex-col gap-1.5 mb-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Renews monthly &mdash; cancel any time from your account settings.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">A receipt has been sent to your email.</p>
        </div>

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

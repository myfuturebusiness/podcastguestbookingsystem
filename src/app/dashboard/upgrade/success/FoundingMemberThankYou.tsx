import Link from 'next/link'

export default function FoundingMemberThankYou() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-gray-900 rounded-2xl border border-indigo-500/30 shadow-xl px-8 py-10 text-center">

        {/* Text logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Guest Booking System</span>
        </div>

        {/* Founding badge */}
        <div className="inline-flex items-center rounded-full bg-indigo-500/15 border border-indigo-500/40 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">
          ⚡ Founding Member
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-3 leading-tight">
          You&apos;re in. Forever.
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-2">
          Welcome as a Founding Member. You&apos;ve secured lifetime access at today&apos;s price — it will never increase for you.
        </p>
        <p className="text-xs text-gray-500 mb-8">
          A receipt has been sent to your email. Your account is fully active.
        </p>

        {/* Next steps */}
        <div className="bg-gray-800 rounded-xl p-5 mb-6 text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
            Your next steps
          </p>
          <ul className="flex flex-col gap-2.5">
            {[
              'Create your show profile — add your name, description, and availability',
              'Set your booking fee (optional — keep it free if you prefer)',
              'Share your booking link and start accepting guests',
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
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

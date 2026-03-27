import Image from 'next/image'
import Link from 'next/link'

export default function FoundingMemberThankYou() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-gray-900 rounded-2xl border border-amber-500/30 shadow-xl px-8 py-10 text-center">

        {/* Founding badge */}
        <div className="inline-flex items-center rounded-full bg-amber-400/15 border border-amber-400/40 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 mb-8">
          ⚡ Founding Member
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/gbs logo white.png"
            alt="Guest Booking System"
            width={120}
            height={60}
            className="object-contain"
          />
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
                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-400 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/dashboard/podcast/new"
          className="block w-full rounded-xl bg-amber-400 text-amber-900 font-bold text-sm py-3.5 hover:bg-amber-300 transition-colors mb-3"
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

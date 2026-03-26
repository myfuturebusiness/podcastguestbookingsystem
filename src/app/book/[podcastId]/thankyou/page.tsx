import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'

function formatSlot(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const date = s.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const startT = s.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const endT = e.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return `${date} · ${startT} – ${endT}`
}

const prepSteps = [
  {
    icon: '🔌',
    title: 'Use a hard-wired connection — NO WIFI',
    detail: 'A wired ethernet connection prevents choppy audio and dropped calls. Avoid WiFi where possible.',
  },
  {
    icon: '🔇',
    title: 'Minimise background noise',
    detail: 'Find a quiet room. Close windows and doors. Turn off fans, TVs, and other nearby devices.',
  },
  {
    icon: '🎙️',
    title: 'Check your setup before the call',
    detail: 'Test your audio, video, and lighting at least 10 minutes before we are scheduled to begin.',
  },
  {
    icon: '🎧',
    title: 'Wear headphones during the interview',
    detail: 'Headphones prevent your voice being picked up twice (echo/feedback), which degrades recording quality.',
  },
  {
    icon: '⏺️',
    title: 'Do not record the call yourself',
    detail: 'We handle the recording. Running your own recording software uses bandwidth and can cause audio problems.',
  },
]

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: { podcastId: string }
  searchParams: { app?: string }
}) {
  const { podcastId } = params

  const adminSupabase = createAdminClient()
  const application = searchParams.app
    ? (
        await adminSupabase
          .from('applications')
          .select('first_name, email, slot_id')
          .eq('id', searchParams.app)
          .single()
      ).data
    : null

  const supabase = createClient()
  const { data: podcast } = await supabase
    .from('podcasts')
    .select('title')
    .eq('id', podcastId)
    .single()

  let slotInfo: { start_time: string; end_time: string } | null = null
  if (application?.slot_id) {
    const { data: slot } = await supabase
      .from('availability_slots')
      .select('start_time, end_time')
      .eq('id', application.slot_id)
      .single()
    slotInfo = slot
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <Link href="/"><Logo compact /></Link>
        <ThemeToggle />
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Your Interview is Confirmed!
          </h1>
          {application && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              We&apos;re looking forward to speaking with you,{' '}
              <strong className="text-gray-700 dark:text-gray-300">{application.first_name}</strong>.
            </p>
          )}
        </div>

        {(podcast || slotInfo) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-400 dark:border-gray-700 p-6 mb-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
              Your Interview
            </p>
            {podcast && (
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {podcast.title}
              </p>
            )}
            {slotInfo && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatSlot(slotInfo.start_time, slotInfo.end_time)}
              </p>
            )}
            {application?.email && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                Confirmation and login details sent to{' '}
                <strong className="text-gray-500 dark:text-gray-400">{application.email}</strong>
              </p>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-400 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Recommendations for Your Interview
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            To help you achieve the best possible recording quality, please follow these steps:
          </p>
          <ul className="flex flex-col gap-5">
            {prepSteps.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="text-2xl flex-shrink-0 leading-snug">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6 text-center">
          <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-1">
            Your guest account is ready
          </p>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-4">
            Log in to view and manage your booking. Your login credentials have been sent to your email.
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            Sign in to your account →
          </Link>
        </div>
      </main>
    </div>
  )
}

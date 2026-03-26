import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'
import BookingForm from './BookingForm'

function formatSlot(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const date = s.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const startT = s.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const endT = e.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return `${date} · ${startT} – ${endT}`
}

export default async function PodcastPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { error?: string; message?: string }
}) {
  const supabase = createClient()

  const { data: podcast } = await supabase
    .from('podcasts')
    .select('id, title, description, show_type, booking_fee_cents, currency, host_id, is_active')
    .eq('id', params.id)
    .single()

  if (!podcast || !podcast.is_active) notFound()

  // Get current user (public page — may be unauthenticated)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check user role if signed in
  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role ?? null
  }

  // Fetch future slots for this podcast
  const now = new Date().toISOString()
  const { data: allSlots } = await supabase
    .from('availability_slots')
    .select('id, start_time, end_time')
    .eq('podcast_id', podcast.id)
    .gt('start_time', now)
    .order('start_time', { ascending: true })

  // Exclude already-booked slots (pending or confirmed)
  const { data: bookedRequests } = await supabase
    .from('booking_requests')
    .select('slot_id')
    .eq('podcast_id', podcast.id)
    .in('status', ['pending', 'confirmed'])

  const bookedSlotIds = new Set((bookedRequests ?? []).map((r) => r.slot_id))
  const availableSlots = (allSlots ?? []).filter((s) => !bookedSlotIds.has(s.id))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/"><Logo compact /></Link>
          <Link
            href="/podcasts"
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Browse Shows
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {searchParams.error && (
          <p className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {searchParams.error}
          </p>
        )}
        {searchParams.message && (
          <p className="mb-6 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {searchParams.message}
          </p>
        )}

        {/* Podcast header */}
        <div className="mb-8">
          {podcast.show_type && (
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
              {podcast.show_type}
            </p>
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{podcast.title}</h1>
          {podcast.description && (
            <p className="text-gray-500 dark:text-gray-400 mb-4">{podcast.description}</p>
          )}
          <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 text-sm font-medium text-indigo-700 dark:text-indigo-300">
            {podcast.booking_fee_cents === 0
              ? 'Free'
              : `Booking fee: ${(podcast.booking_fee_cents / 100).toFixed(2)} ${podcast.currency}`}
          </span>
        </div>

        {/* Available slots */}
        <section className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available slots{' '}
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
              ({availableSlots.length})
            </span>
          </h2>

          {availableSlots.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No available slots at this time. Check back later.
            </p>
          ) : !user ? (
            /* Unauthenticated: show slots but prompt sign in */
            <div>
              <ul className="flex flex-col gap-2 mb-6">
                {availableSlots.map((slot) => (
                  <li
                    key={slot.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {formatSlot(slot.start_time, slot.end_time)}
                  </li>
                ))}
              </ul>
              <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-4 py-4">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-3">
                  Sign in to book a slot.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/auth/signin"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="rounded-lg border border-indigo-300 dark:border-indigo-700 px-4 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </div>
          ) : userRole === 'host' ? (
            /* Hosts cannot book */
            <div>
              <ul className="flex flex-col gap-2 mb-4">
                {availableSlots.map((slot) => (
                  <li
                    key={slot.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {formatSlot(slot.start_time, slot.end_time)}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Host accounts cannot submit booking requests.
              </p>
            </div>
          ) : (
            /* Authenticated guest: show booking form */
            <BookingForm
              slots={availableSlots.map((s) => ({
                id: s.id,
                label: formatSlot(s.start_time, s.end_time),
              }))}
              podcastId={podcast.id}
            />
          )}
        </section>
      </main>
    </div>
  )
}

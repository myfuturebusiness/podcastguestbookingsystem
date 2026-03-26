import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'
import CopyLinkButton from '@/components/ui/CopyLinkButton'
import { approveBooking, rejectBooking, deleteApplication, markComplete, rescheduleBooking, hostRequestReschedule } from './actions'
import FormButton from '@/components/ui/FormButton'

async function signOut() {
  'use server'
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/auth/signin')
}

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

const CATEGORY_LABELS: Record<string, string> = {
  startup_entrepreneur: 'Start-up Entrepreneur',
  existing_business_owner: 'Existing Business Owner',
  book_author: 'Book Author',
}

const FORMAT_LABELS: Record<string, string> = {
  audio: 'Audio only',
  audio_video: 'Audio + Video',
}

function getStatusLabel(brStatus: string | null | undefined, appStatus: string): string {
  if (brStatus === 'completed') return 'Complete'
  if (brStatus === 'approved') return 'Approved'
  if (brStatus === 'rejected') return 'Cancelled'
  if (brStatus === 'pending') return 'Awaiting Approval'
  if (appStatus === 'confirmed') return 'Slot Selected'
  return 'Applied'
}

function getStatusStyle(brStatus: string | null | undefined, appStatus: string): string {
  if (brStatus === 'completed')
    return 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
  if (brStatus === 'approved')
    return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
  if (brStatus === 'rejected')
    return 'bg-gray-50 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
  if (brStatus === 'pending')
    return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
  if (appStatus === 'confirmed')
    return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
  return 'bg-gray-50 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
}

const GUEST_STATUS_STYLES: Record<string, string> = {
  pending:
    'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  approved:
    'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  rejected:
    'bg-gray-50 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  confirmed:
    'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  completed:
    'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
}

const GUEST_STATUS_LABELS: Record<string, string> = {
  pending: 'Confirmed',
  approved: 'Approved',
  rejected: 'Cancelled',
  confirmed: 'Confirmed',
  completed: 'Complete',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { message?: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name ?? user.email
  const role = profile?.role ?? 'unknown'

  const { data: podcasts } =
    role === 'host'
      ? await supabase
          .from('podcasts')
          .select('id, title, booking_fee_cents, currency')
          .eq('host_id', user.id)
          .order('created_at', { ascending: true })
      : { data: null }

  const podcastCount = podcasts?.length ?? 0
  const canAddMore = podcastCount < 3

  // Guest + Host-as-guest: fetch their own booking requests with podcast title and slot time
  const { data: bookingRequests } =
    role === 'guest' || role === 'host'
      ? await supabase
          .from('booking_requests')
          .select(
            'id, status, podcast_id, slot_start_time, slot_end_time, created_at, podcasts(title)'
          )
          .eq('guest_id', user.id)
          .order('created_at', { ascending: false })
      : { data: null }

  // Host: fetch all applications for their podcasts (primary data source)
  const podcastIds = podcasts?.map((p) => p.id) ?? []
  const { data: hostApplications } =
    role === 'host' && podcastIds.length > 0
      ? await supabase
          .from('applications')
          .select(
            'id, first_name, last_name, email, topic, category, status, bio_text, bio_pdf_url, interview_format, created_at, podcast_id, booking_request_id, payment_status, amount_cents'
          )
          .in('podcast_id', podcastIds)
          .order('created_at', { ascending: false })
      : { data: null }

  // Fetch booking requests linked to those applications
  const bookingRequestIds = (hostApplications ?? [])
    .map((a) => a.booking_request_id)
    .filter(Boolean) as string[]

  const { data: linkedBookingRequests } =
    bookingRequestIds.length > 0
      ? await supabase
          .from('booking_requests')
          .select('id, status, slot_start_time, slot_end_time')
          .in('id', bookingRequestIds)
      : { data: [] }

  type BookingRequestRow = {
    id: string
    status: string
    slot_start_time: string | null
    slot_end_time: string | null
  }
  const brMap: Record<string, BookingRequestRow> = Object.fromEntries(
    (linkedBookingRequests ?? []).map((br) => [br.id, br as unknown as BookingRequestRow])
  )

  // Unread message counts per booking_request
  const unreadMap: Record<string, number> = {}
  if (role === 'host' && bookingRequestIds.length > 0) {
    const { data: unreadMsgs } = await supabase
      .from('messages')
      .select('booking_request_id')
      .in('booking_request_id', bookingRequestIds)
      .eq('sender_role', 'guest')
      .eq('is_read', false)
    for (const m of unreadMsgs ?? []) {
      unreadMap[m.booking_request_id] = (unreadMap[m.booking_request_id] ?? 0) + 1
    }
  }
  if (role === 'guest' || role === 'host') {
    const guestBrIds = (bookingRequests ?? []).map((r) => r.id)
    if (guestBrIds.length > 0) {
      const { data: unreadMsgs } = await supabase
        .from('messages')
        .select('booking_request_id')
        .in('booking_request_id', guestBrIds)
        .eq('sender_role', 'host')
        .eq('is_read', false)
      for (const m of unreadMsgs ?? []) {
        unreadMap[m.booking_request_id] = (unreadMap[m.booking_request_id] ?? 0) + 1
      }
    }
  }

  // Split host applications into active and archived
  const activeApps = (hostApplications ?? []).filter((app) => {
    const br = app.booking_request_id ? brMap[app.booking_request_id] : null
    return !br || br.status === 'pending' || br.status === 'approved'
  })
  const archivedApps = (hostApplications ?? []).filter((app) => {
    const br = app.booking_request_id ? brMap[app.booking_request_id] : null
    return br?.status === 'completed' || br?.status === 'rejected'
  })

  // Group archived host apps by guest for sub-folder display
  const groupedArchivedApps = archivedApps.reduce<Record<string, typeof archivedApps>>(
    (acc, app) => {
      const key = `${app.first_name} ${app.last_name}|||${app.email}`
      if (!acc[key]) acc[key] = []
      acc[key].push(app)
      return acc
    },
    {}
  )

  // Split guest bookings into active and archived
  const activeBookings = (bookingRequests ?? []).filter(
    (req) => req.status !== 'completed' && req.status !== 'rejected'
  )
  const archivedBookings = (bookingRequests ?? []).filter(
    (req) => req.status === 'completed' || req.status === 'rejected'
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <Logo compact />
          <Link
            href="/podcasts"
            className="hidden sm:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Shows
          </Link>
          {role === 'host' && (
            <Link
              href="/dashboard/availability"
              className="hidden sm:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Availability
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/dashboard/profile"
            className="hidden sm:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Profile
          </Link>
          <form action={signOut}>
            <FormButton className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
              Sign out
            </FormButton>
          </form>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {searchParams.message && (
          <p className="mb-6 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {searchParams.message}
          </p>
        )}

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome, {displayName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          You are signed in as a{' '}
          <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:text-indigo-200 capitalize">
            {role}
          </span>
        </p>

        {/* HOST: podcast management */}
        {role === 'host' && (
          <div className="mt-8 flex flex-col gap-4">
            {podcastCount === 0 ? (
              <div className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  You haven&apos;t set up your show profile yet.
                </p>
                <Link
                  href="/dashboard/podcast/new"
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  Create show profile
                </Link>
              </div>
            ) : (
              <>
                {podcasts!.map((podcast) => (
                  <div
                    key={podcast.id}
                    className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
                      Your show
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {podcast.title}
                      </p>
                      <Link
                        href={`/dashboard/podcast/edit/${podcast.id}`}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Booking fee:{' '}
                      {podcast.booking_fee_cents === 0
                        ? 'Free'
                        : `${(podcast.booking_fee_cents / 100).toFixed(2)} ${podcast.currency}`}
                    </p>
                    <div className="mt-3">
                      <CopyLinkButton
                        url={`${process.env.NEXT_PUBLIC_APP_URL}/book/${podcast.id}`}
                      />
                    </div>
                  </div>
                ))}

                {canAddMore &&
                  (podcastCount === 1 ? (
                    <details className="group rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
                      <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 list-none flex items-center gap-2">
                        <span className="text-lg leading-none">+</span> Add another show
                      </summary>
                      <div className="px-6 pb-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          You can add up to {3 - podcastCount} more show
                          {3 - podcastCount > 1 ? 's' : ''}.
                        </p>
                        <Link
                          href="/dashboard/podcast/new"
                          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        >
                          Create show profile
                        </Link>
                      </div>
                    </details>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 px-6 py-4 flex items-center justify-between">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        You can add {3 - podcastCount} more show
                        {3 - podcastCount > 1 ? 's' : ''}.
                      </p>
                      <Link
                        href="/dashboard/podcast/new"
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      >
                        Add show
                      </Link>
                    </div>
                  ))}
              </>
            )}
          </div>
        )}

        {/* HOST: applications */}
        {role === 'host' && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Applications
            </h2>
            {!hostApplications || hostApplications.length === 0 ? (
              <div className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No applications yet. Share your booking link to start receiving guests.
                </p>
              </div>
            ) : (
              <>
                {/* Active applications */}
                {activeApps.length === 0 && archivedApps.length > 0 ? (
                  <div className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-5 mb-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No active applications. Past bookings are in the folder below.
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {activeApps.map((app) => {
                      const br = app.booking_request_id ? brMap[app.booking_request_id] : null
                      const slot = br?.slot_start_time ? { start_time: br.slot_start_time, end_time: br.slot_end_time ?? br.slot_start_time } : null
                      const statusLabel = getStatusLabel(br?.status, app.status)
                      const statusStyle = getStatusStyle(br?.status, app.status)
                      const isPending = br?.status === 'pending'
                      const isApproved = br?.status === 'approved'
                      const amountPaid =
                        app.payment_status === 'paid' && (app.amount_cents ?? 0) > 0
                          ? `$${((app.amount_cents ?? 0) / 100).toFixed(2)} paid`
                          : app.payment_status === 'paid'
                          ? 'Paid'
                          : app.payment_status === 'free'
                          ? 'Free'
                          : null

                      return (
                        <li
                          key={app.id}
                          className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 p-5"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {app.first_name} {app.last_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{app.email}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle}`}
                              >
                                {statusLabel}
                              </span>
                              {amountPaid && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {amountPaid}
                                </span>
                              )}
                            </div>
                          </div>

                          {slot && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-3 font-medium">
                              {formatSlot(slot.start_time, slot.end_time)}
                            </p>
                          )}

                          {app.category && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              <span className="font-medium">Category:</span>{' '}
                              {CATEGORY_LABELS[app.category] ?? app.category}
                            </p>
                          )}

                          {app.topic && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
                              <span className="font-medium text-gray-500 dark:text-gray-400">Topic: </span>
                              {app.topic}
                            </p>
                          )}

                          {app.bio_text && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed line-clamp-3">
                              {app.bio_text}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {FORMAT_LABELS[app.interview_format] ?? app.interview_format} ·{' '}
                              {new Date(app.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {app.bio_pdf_url && (
                                <a
                                  href={`/api/bio/${app.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  Bio PDF
                                </a>
                              )}
                              {isPending && br && (
                                <>
                                  <form action={approveBooking.bind(null, br.id)}>
                                    <FormButton className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors">
                                      Approve
                                    </FormButton>
                                  </form>
                                  <form action={rejectBooking.bind(null, br.id)}>
                                    <FormButton className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">
                                      Reject
                                    </FormButton>
                                  </form>
                                </>
                              )}
                              {isApproved && br && (
                                <form action={markComplete.bind(null, br.id)}>
                                  <FormButton className="rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors">
                                    Mark Complete
                                  </FormButton>
                                </form>
                              )}
                              {(isPending || isApproved) && br && (
                                <form action={hostRequestReschedule.bind(null, br.id)}>
                                  <FormButton className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors">
                                    Request Reschedule
                                  </FormButton>
                                </form>
                              )}
                              {app.booking_request_id && (
                                <Link
                                  href={`/dashboard/chat/${app.booking_request_id}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                >
                                  Message
                                  {(unreadMap[app.booking_request_id] ?? 0) > 0 && (
                                    <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                                      {unreadMap[app.booking_request_id]}
                                    </span>
                                  )}
                                </Link>
                              )}
                              <form action={deleteApplication.bind(null, app.id)}>
                                <FormButton className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">
                                  Delete
                                </FormButton>
                              </form>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {/* Past Bookings archive folder — one sub-folder per guest */}
                {archivedApps.length > 0 && (
                  <details className="mt-4 rounded-2xl border border-gray-300 dark:border-gray-700">
                    <summary className="cursor-pointer select-none list-none flex items-center gap-2 px-5 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                      <span className="text-base">📁</span>
                      Past Bookings
                      <span className="ml-auto inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {archivedApps.length}
                      </span>
                    </summary>
                    <div className="px-5 pb-5 flex flex-col gap-2">
                      {Object.entries(groupedArchivedApps).map(([key, apps]) => {
                        const guestName = key.split('|||')[0]
                        const guestEmail = key.split('|||')[1]
                        return (
                          <details
                            key={key}
                            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                          >
                            <summary className="cursor-pointer select-none list-none flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                              <span className="text-sm">👤</span>
                              <span className="flex-1">{guestName}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 font-normal hidden sm:block">
                                {guestEmail}
                              </span>
                              <span className="ml-2 inline-flex items-center rounded-full bg-gray-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                {apps.length}
                              </span>
                            </summary>
                            <ul className="flex flex-col gap-2 px-4 pb-4 pt-1">
                              {apps.map((app) => {
                                const br = app.booking_request_id ? brMap[app.booking_request_id] : null
                                const slot = br?.slot_start_time ? { start_time: br.slot_start_time, end_time: br.slot_end_time ?? br.slot_start_time } : null
                                const statusLabel = getStatusLabel(br?.status, app.status)
                                const statusStyle = getStatusStyle(br?.status, app.status)
                                const amountPaid =
                                  app.payment_status === 'paid' && (app.amount_cents ?? 0) > 0
                                    ? `$${((app.amount_cents ?? 0) / 100).toFixed(2)} paid`
                                    : app.payment_status === 'paid'
                                    ? 'Paid'
                                    : app.payment_status === 'free'
                                    ? 'Free'
                                    : null
                                return (
                                  <li
                                    key={app.id}
                                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
                                  >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div>
                                        {slot && (
                                          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                            {formatSlot(slot.start_time, slot.end_time)}
                                          </p>
                                        )}
                                        {app.topic && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            <span className="font-medium">Topic: </span>{app.topic}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex flex-col items-end gap-1 shrink-0">
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle}`}>
                                          {statusLabel}
                                        </span>
                                        {amountPaid && (
                                          <span className="text-xs text-gray-400 dark:text-gray-500">{amountPaid}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                      <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      <form action={deleteApplication.bind(null, app.id)}>
                                        <button
                                          type="submit"
                                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                        >
                                          Delete
                                        </button>
                                      </form>
                                    </div>
                                  </li>
                                )
                              })}
                            </ul>
                          </details>
                        )
                      })}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>
        )}

        {/* HOST: guest appearances on other shows */}
        {role === 'host' && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                My Guest Appearances
              </h2>
              <Link
                href="/podcasts"
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Browse shows →
              </Link>
            </div>

            {!bookingRequests || bookingRequests.length === 0 ? (
              <div className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  You haven&apos;t applied to appear on any other shows yet.
                </p>
                <Link
                  href="/podcasts"
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  Browse shows
                </Link>
              </div>
            ) : (
              <>
                {activeBookings.length === 0 && archivedBookings.length > 0 ? (
                  <div className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-5 mb-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No active bookings. Past appearances are in the folder below.
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {activeBookings.map((req) => {
                      const podcast = req.podcasts as unknown as { title: string } | null
                      const reqTyped = req as unknown as { slot_start_time?: string; slot_end_time?: string }
                      const slot = reqTyped.slot_start_time ? { start_time: reqTyped.slot_start_time, end_time: reqTyped.slot_end_time ?? reqTyped.slot_start_time } : null
                      const statusStyle = GUEST_STATUS_STYLES[req.status] ?? GUEST_STATUS_STYLES['confirmed']
                      const statusLabel = GUEST_STATUS_LABELS[req.status] ?? 'Confirmed'
                      return (
                        <li
                          key={req.id}
                          className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                                {podcast?.title ?? 'Unknown podcast'}
                              </p>
                              {slot ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatSlot(slot.start_time, slot.end_time)}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-400 dark:text-gray-500">
                                  Slot details unavailable
                                </p>
                              )}
                            </div>
                            <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                            <Link
                              href={`/dashboard/chat/${req.id}`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Message
                              {(unreadMap[req.id] ?? 0) > 0 && (
                                <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                                  {unreadMap[req.id]}
                                </span>
                              )}
                            </Link>
                            <form action={rescheduleBooking.bind(null, req.id)}>
                              <FormButton className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:underline focus:outline-none">
                                Change date
                              </FormButton>
                            </form>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {archivedBookings.length > 0 && (
                  <details className="mt-4 rounded-2xl border border-gray-300 dark:border-gray-700">
                    <summary className="cursor-pointer select-none list-none flex items-center gap-2 px-5 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                      <span className="text-base">📁</span>
                      Past Appearances
                      <span className="ml-auto inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {archivedBookings.length}
                      </span>
                    </summary>
                    <ul className="flex flex-col gap-3 px-5 pb-5">
                      {archivedBookings.map((req) => {
                        const podcast = req.podcasts as unknown as { title: string } | null
                        const reqTyped2 = req as unknown as { slot_start_time?: string; slot_end_time?: string }
                        const slot = reqTyped2.slot_start_time ? { start_time: reqTyped2.slot_start_time, end_time: reqTyped2.slot_end_time ?? reqTyped2.slot_start_time } : null
                        const statusStyle = GUEST_STATUS_STYLES[req.status] ?? GUEST_STATUS_STYLES['confirmed']
                        const statusLabel = GUEST_STATUS_LABELS[req.status] ?? 'Confirmed'
                        return (
                          <li
                            key={req.id}
                            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-5 py-4 opacity-80"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                                  {podcast?.title ?? 'Unknown podcast'}
                                </p>
                                {slot ? (
                                  <p className="text-sm text-gray-400 dark:text-gray-500">
                                    {formatSlot(slot.start_time, slot.end_time)}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-400 dark:text-gray-500">
                                    Slot details unavailable
                                  </p>
                                )}
                              </div>
                              <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle}`}>
                                {statusLabel}
                              </span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </details>
                )}
              </>
            )}
          </div>
        )}

        {/* GUEST: become a host CTA */}
        {role === 'guest' && (
          <div className="mt-8 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Want to host your own show?</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upgrade to a Host account and start accepting guest bookings.
              </p>
            </div>
            <Link
              href="/dashboard/upgrade"
              className="shrink-0 inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Become a Host →
            </Link>
          </div>
        )}

        {/* GUEST: booking requests */}
        {role === 'guest' && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                My Bookings
              </h2>
              <Link
                href="/podcasts"
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Browse shows →
              </Link>
            </div>

            {!bookingRequests || bookingRequests.length === 0 ? (
              <div className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  You haven&apos;t made any booking requests yet.
                </p>
                <Link
                  href="/podcasts"
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  Browse shows
                </Link>
              </div>
            ) : (
              <>
                {/* Active bookings */}
                {activeBookings.length === 0 && archivedBookings.length > 0 ? (
                  <div className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-5 mb-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No active bookings. Past bookings are in the folder below.
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {activeBookings.map((req) => {
                      const podcast = req.podcasts as unknown as { title: string } | null
                      const reqTyped = req as unknown as { slot_start_time?: string; slot_end_time?: string }
                      const slot = reqTyped.slot_start_time ? { start_time: reqTyped.slot_start_time, end_time: reqTyped.slot_end_time ?? reqTyped.slot_start_time } : null
                      const statusStyle =
                        GUEST_STATUS_STYLES[req.status] ?? GUEST_STATUS_STYLES['confirmed']
                      const statusLabel = GUEST_STATUS_LABELS[req.status] ?? 'Confirmed'
                      return (
                        <li
                          key={req.id}
                          className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-4"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                                {podcast?.title ?? 'Unknown podcast'}
                              </p>
                              {slot ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatSlot(slot.start_time, slot.end_time)}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-400 dark:text-gray-500">
                                  Slot details unavailable
                                </p>
                              )}
                            </div>
                            <span
                              className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle}`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                            <Link
                              href={`/dashboard/chat/${req.id}`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Message
                              {(unreadMap[req.id] ?? 0) > 0 && (
                                <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                                  {unreadMap[req.id]}
                                </span>
                              )}
                            </Link>
                            <form action={rescheduleBooking.bind(null, req.id)}>
                              <FormButton className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:underline focus:outline-none">
                                Change date
                              </FormButton>
                            </form>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {/* Past Bookings archive folder */}
                {archivedBookings.length > 0 && (
                  <details className="mt-4 rounded-2xl border border-gray-300 dark:border-gray-700">
                    <summary className="cursor-pointer select-none list-none flex items-center gap-2 px-5 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                      <span className="text-base">📁</span>
                      Past Bookings
                      <span className="ml-auto inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {archivedBookings.length}
                      </span>
                    </summary>
                    <ul className="flex flex-col gap-3 px-5 pb-5">
                      {archivedBookings.map((req) => {
                        const podcast = req.podcasts as unknown as { title: string } | null
                        const reqTyped2 = req as unknown as { slot_start_time?: string; slot_end_time?: string }
                        const slot = reqTyped2.slot_start_time ? { start_time: reqTyped2.slot_start_time, end_time: reqTyped2.slot_end_time ?? reqTyped2.slot_start_time } : null
                        const statusStyle =
                          GUEST_STATUS_STYLES[req.status] ?? GUEST_STATUS_STYLES['confirmed']
                        const statusLabel = GUEST_STATUS_LABELS[req.status] ?? 'Confirmed'
                        return (
                          <li
                            key={req.id}
                            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-5 py-4 opacity-80"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                                  {podcast?.title ?? 'Unknown podcast'}
                                </p>
                                {slot ? (
                                  <p className="text-sm text-gray-400 dark:text-gray-500">
                                    {formatSlot(slot.start_time, slot.end_time)}
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-400 dark:text-gray-500">
                                    Slot details unavailable
                                  </p>
                                )}
                              </div>
                              <span
                                className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle}`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </details>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-sm text-gray-500 dark:text-gray-400">
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Account details</p>
          <p>Email: {user.email}</p>
          <p>User ID: {user.id}</p>
        </div>
      </main>
    </div>
  )
}

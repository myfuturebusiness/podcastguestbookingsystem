import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'
import FormButton from '@/components/ui/FormButton'
import { addWebhook, deleteWebhook, toggleWebhook } from './webhook-actions'
import { setUserRole } from './user-actions'

async function signOut() {
  'use server'
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/auth/signin')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatCurrency(cents: number | null, currency = 'usd') {
  if (!cents) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

const STATUS_STYLES: Record<string, string> = {
  pending:
    'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  approved:
    'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  rejected:
    'bg-gray-100 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600',
  completed:
    'bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  confirmed:
    'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  cancelled:
    'bg-gray-100 dark:bg-gray-700/40 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600',
}

const ROLE_STYLES: Record<string, string> = {
  admin:
    'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  host: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  guest:
    'bg-gray-50 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600',
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { tab?: string }
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

  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminSupabase = createAdminClient()
  const tab = searchParams.tab ?? 'overview'

  // ── Stats (always loaded) ──────────────────────────────────────────────────
  const [
    { count: totalUsers },
    { count: totalPodcasts },
    { count: totalBookings },
    { data: revenueRows },
  ] = await Promise.all([
    adminSupabase.from('profiles').select('*', { count: 'exact', head: true }),
    adminSupabase.from('podcasts').select('*', { count: 'exact', head: true }),
    adminSupabase
      .from('booking_requests')
      .select('*', { count: 'exact', head: true }),
    adminSupabase
      .from('applications')
      .select('amount_cents')
      .eq('payment_status', 'paid'),
  ])

  const totalRevenueCents = (revenueRows ?? []).reduce(
    (sum, r) => sum + (r.amount_cents ?? 0),
    0,
  )

  // ── Tab-specific data ──────────────────────────────────────────────────────
  const [users, podcasts, bookings, emailLogs, webhooks] = await Promise.all([
    tab === 'users' || tab === 'overview'
      ? adminSupabase
          .from('profiles')
          .select('id, full_name, email, role, created_at')
          .order('created_at', { ascending: false })
          .limit(tab === 'overview' ? 5 : 200)
      : Promise.resolve({ data: [] }),

    tab === 'podcasts' || tab === 'overview'
      ? adminSupabase
          .from('podcasts')
          .select('id, title, is_active, booking_fee_cents, currency, created_at, host_id, profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(tab === 'overview' ? 5 : 200)
      : Promise.resolve({ data: [] }),

    tab === 'bookings'
      ? adminSupabase
          .from('booking_requests')
          .select(
            'id, status, slot_start_time, created_at, podcast_id, podcasts(title), applications(first_name, last_name, email, payment_status, amount_cents)',
          )
          .order('created_at', { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] }),

    tab === 'emails'
      ? adminSupabase
          .from('email_logs')
          .select('id, to_email, subject, status, created_at')
          .order('created_at', { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),

    tab === 'webhooks'
      ? adminSupabase
          .from('webhook_endpoints')
          .select('id, name, url, events, is_active, secret, created_at')
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const usersData = (users.data ?? []) as Array<{
    id: string
    full_name: string | null
    email: string | null
    role: string
    created_at: string
  }>

  const podcastsData = (podcasts.data as unknown) as Array<{
    id: string
    title: string
    is_active: boolean
    booking_fee_cents: number | null
    currency: string | null
    created_at: string
    host_id: string
    profiles: { full_name: string | null } | null
  }>

  const bookingsData = (bookings.data as unknown) as Array<{
    id: string
    status: string
    slot_start_time: string | null
    created_at: string
    podcast_id: string
    podcasts: { title: string } | null
    applications: Array<{
      first_name: string
      last_name: string
      email: string
      payment_status: string | null
      amount_cents: number | null
    }>
  }>

  const emailsData = (emailLogs.data ?? []) as Array<{
    id: string
    to_email: string
    subject: string
    status: string
    created_at: string
  }>

  const webhooksData = (webhooks.data ?? []) as Array<{
    id: string
    name: string
    url: string
    events: string[]
    is_active: boolean
    secret: string | null
    created_at: string
  }>

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: `Users (${totalUsers ?? 0})` },
    { key: 'podcasts', label: `Shows (${totalPodcasts ?? 0})` },
    { key: 'bookings', label: `Bookings (${totalBookings ?? 0})` },
    { key: 'emails', label: 'Email Logs' },
    { key: 'webhooks', label: 'Webhooks' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Nav */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo compact />
          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Dashboard
          </Link>
          <form action={signOut}>
            <FormButton className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Sign out
            </FormButton>
          </form>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gray-200 dark:border-gray-800">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/admin?tab=${t.key}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: totalUsers ?? 0 },
                { label: 'Shows', value: totalPodcasts ?? 0 },
                { label: 'Bookings', value: totalBookings ?? 0 },
                {
                  label: 'Total Revenue',
                  value: formatCurrency(totalRevenueCents),
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Recent Users */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Recent Users</h2>
                <Link
                  href="/admin?tab=users"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View all →
                </Link>
              </div>
              <UsersTable users={usersData} />
            </section>

            {/* Recent Podcasts */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Recent Shows</h2>
                <Link
                  href="/admin?tab=podcasts"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View all →
                </Link>
              </div>
              <PodcastsTable podcasts={podcastsData} />
            </section>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <section>
            <h2 className="text-lg font-semibold mb-4">All Users</h2>
            <UsersTable users={usersData} showActions />
          </section>
        )}

        {/* ── PODCASTS ── */}
        {tab === 'podcasts' && (
          <section>
            <h2 className="text-lg font-semibold mb-4">All Shows</h2>
            <PodcastsTable podcasts={podcastsData} />
          </section>
        )}

        {/* ── BOOKINGS ── */}
        {tab === 'bookings' && (
          <section>
            <h2 className="text-lg font-semibold mb-4">All Bookings</h2>
            {bookingsData.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No bookings yet.</p>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      {['Guest', 'Show', 'Slot', 'Status', 'Payment', 'Created'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {bookingsData.map((b) => {
                      const app = b.applications?.[0]
                      return (
                        <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-4 py-3">
                            {app ? (
                              <>
                                <p className="font-medium">
                                  {app.first_name} {app.last_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {app.email}
                                </p>
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {b.podcasts?.title ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                            {b.slot_start_time
                              ? formatDate(b.slot_start_time)
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[b.status] ?? STATUS_STYLES.cancelled}`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {app?.payment_status === 'paid' ? (
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                {formatCurrency(app.amount_cents)} paid
                              </span>
                            ) : app?.payment_status === 'free' ? (
                              <span className="text-gray-400">Free</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                            {formatDate(b.created_at)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── EMAIL LOGS ── */}
        {tab === 'emails' && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Email Logs</h2>
            {emailsData.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No email logs yet.</p>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      {['To', 'Subject', 'Status', 'Sent'].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {emailsData.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-3">{e.to_email}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {e.subject}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${
                              e.status === 'sent'
                                ? STATUS_STYLES.approved
                                : STATUS_STYLES.cancelled
                            }`}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {formatDate(e.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── WEBHOOKS ── */}
        {tab === 'webhooks' && (
          <div className="space-y-8">

            {/* Add new endpoint form */}
            <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-1">Add Webhook Endpoint</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Works with any service that accepts HTTP POST — Zapier, Integrately, Pabbly, Fluent CRM, Platformly, Make, or your own server.
              </p>
              <form action={addWebhook} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Endpoint Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Fluent CRM Waitlist, Zapier Bookings"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Webhook URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      name="url"
                      required
                      placeholder="https://hooks.zapier.com/..."
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Secret (optional — sent as <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">X-Webhook-Secret</code> header)
                  </label>
                  <input
                    type="text"
                    name="secret"
                    placeholder="Leave blank if not required"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Events to send <span className="text-red-500">*</span>
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { value: 'waitlist.signup', label: 'Waitlist signup' },
                      { value: 'booking.confirmed', label: 'Booking confirmed' },
                      { value: 'application.submitted', label: 'Application submitted' },
                    ].map((ev) => (
                      <label key={ev.value} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="events"
                          value={ev.value}
                          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{ev.label}</span>
                        <code className="text-[11px] text-gray-400 dark:text-gray-500">{ev.value}</code>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <FormButton className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm font-semibold transition-colors">
                    Add Endpoint
                  </FormButton>
                </div>
              </form>
            </section>

            {/* Existing endpoints */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Active Endpoints ({webhooksData.length})</h2>
              {webhooksData.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No webhook endpoints configured yet.</p>
              ) : (
                <div className="space-y-3">
                  {webhooksData.map((wh) => (
                    <div
                      key={wh.id}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">{wh.name}</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${wh.is_active ? STATUS_STYLES.approved : STATUS_STYLES.cancelled}`}>
                            {wh.is_active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1.5">{wh.url}</p>
                        <div className="flex flex-wrap gap-1">
                          {wh.events.map((ev) => (
                            <span key={ev} className="text-[11px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-full font-mono">
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Toggle active */}
                        <form action={toggleWebhook}>
                          <input type="hidden" name="id" value={wh.id} />
                          <input type="hidden" name="is_active" value={String(wh.is_active)} />
                          <FormButton className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            {wh.is_active ? 'Pause' : 'Resume'}
                          </FormButton>
                        </form>
                        {/* Delete */}
                        <form action={deleteWebhook}>
                          <input type="hidden" name="id" value={wh.id} />
                          <FormButton className="rounded-lg border border-red-200 dark:border-red-900/40 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            Delete
                          </FormButton>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Payload reference */}
            <section className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-base font-semibold mb-3">Payload Reference</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Every webhook is a JSON POST. The payload structure for each event:
              </p>
              <div className="space-y-4">
                {[
                  {
                    event: 'waitlist.signup',
                    sample: `{\n  "event": "waitlist.signup",\n  "timestamp": "2026-03-26T10:00:00.000Z",\n  "data": {\n    "email": "guest@example.com",\n    "source": "homepage"\n  }\n}`,
                  },
                  {
                    event: 'booking.confirmed',
                    sample: `{\n  "event": "booking.confirmed",\n  "timestamp": "2026-03-26T10:00:00.000Z",\n  "data": {\n    "booking_request_id": "uuid",\n    "guest_email": "guest@example.com",\n    "guest_name": "Jane Smith",\n    "podcast_id": "uuid",\n    "slot_start_time": "2026-04-01T09:00:00.000Z",\n    "topic": "Growing a SaaS business",\n    "is_reschedule": false\n  }\n}`,
                  },
                ].map((ex) => (
                  <div key={ex.event}>
                    <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mb-1">{ex.event}</p>
                    <pre className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-x-auto text-gray-700 dark:text-gray-300 leading-relaxed">
                      {ex.sample}
                    </pre>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function UsersTable({
  users,
  showActions = false,
}: {
  users: Array<{
    id: string
    full_name: string | null
    email: string | null
    role: string
    created_at: string
  }>
  showActions?: boolean
}) {
  if (users.length === 0)
    return <p className="text-sm text-gray-500 dark:text-gray-400">No users yet.</p>

  const headers = showActions
    ? ['Name / Email', 'Role', 'Joined', 'Actions']
    : ['Name', 'Role', 'Joined']

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
              <td className="px-4 py-3">
                <p className="font-medium">{u.full_name ?? '—'}</p>
                {showActions && u.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_STYLES[u.role] ?? ROLE_STYLES.guest}`}
                >
                  {u.role}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                {formatDate(u.created_at)}
              </td>
              {showActions && (
                <td className="px-4 py-3">
                  {u.role === 'admin' ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">protected</span>
                  ) : (
                    <form action={setUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="user_id" value={u.id} />
                      <input
                        type="hidden"
                        name="new_role"
                        value={u.role === 'host' ? 'guest' : 'host'}
                      />
                      <FormButton
                        className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                          u.role === 'host'
                            ? 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            : 'border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        {u.role === 'host' ? 'Demote to Guest' : 'Promote to Host'}
                      </FormButton>
                    </form>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PodcastsTable({
  podcasts,
}: {
  podcasts: Array<{
    id: string
    title: string
    is_active: boolean
    booking_fee_cents: number | null
    currency: string | null
    created_at: string
    host_id: string
    profiles: { full_name: string | null } | null
  }>
}) {
  if (podcasts.length === 0)
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">No shows yet.</p>
    )
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            {['Title', 'Host', 'Booking Fee', 'Status', 'Created'].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {podcasts.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
              <td className="px-4 py-3 font-medium">{p.title}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                {p.profiles?.full_name ?? '—'}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                {formatCurrency(p.booking_fee_cents, p.currency ?? 'usd')}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${
                    p.is_active ? STATUS_STYLES.approved : STATUS_STYLES.cancelled
                  }`}
                >
                  {p.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                {formatDate(p.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

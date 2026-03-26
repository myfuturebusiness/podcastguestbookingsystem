import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'
import { deleteRule, addBlock, deleteBlock, updateTimezone } from './actions'
import FormButton from '@/components/ui/FormButton'
import TimezoneSelect from '@/components/ui/TimezoneSelect'
import WeeklyScheduleForm from './WeeklyScheduleForm'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
]


function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, timezone')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'host') redirect('/dashboard')

  const { data: podcasts } = await supabase
    .from('podcasts')
    .select('id, title')
    .eq('host_id', user.id)
    .order('created_at', { ascending: true })

  if (!podcasts || podcasts.length === 0) redirect('/dashboard/podcast/new')

  const podcastIds = podcasts.map((p) => p.id)
  const podcastMap = Object.fromEntries(podcasts.map((p) => [p.id, p.title]))

  const [{ data: rules }, { data: blocks }] = await Promise.all([
    supabase
      .from('availability_rules')
      .select('id, podcast_id, day_of_week, start_time, end_time, slot_duration_minutes, advance_booking_days')
      .in('podcast_id', podcastIds)
      .order('day_of_week', { ascending: true }),
    supabase
      .from('availability_blocks')
      .select('id, podcast_id, block_start, block_end, reason')
      .in('podcast_id', podcastIds)
      .order('block_start', { ascending: true }),
  ])

  const hostTimezone = (profile as { timezone?: string })?.timezone ?? 'UTC'
  const today = new Date().toISOString().split('T')[0]

  async function signOut() {
    'use server'
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo compact />
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/podcasts" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            Shows
          </Link>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Availability</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <form action={signOut}>
            <FormButton className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
              Sign out
            </FormButton>
          </form>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Availability</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Set your recurring weekly schedule. Guests will only see slots that fall within your rules and are not blocked.
        </p>

        {searchParams.error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {decodeURIComponent(searchParams.error)}
          </div>
        )}
        {searchParams.message && (
          <div className="mb-6 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {decodeURIComponent(searchParams.message)}
          </div>
        )}

        {/* ── Your Timezone ── */}
        <section className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Your Timezone</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            All availability rules are based on this timezone. Guests see times in their own local timezone.
          </p>
          <form action={updateTimezone} className="flex flex-col gap-3">
            <TimezoneSelect name="timezone" defaultValue={hostTimezone} />
            <div>
              <FormButton className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
                Save timezone
              </FormButton>
            </div>
          </form>
        </section>

        {/* ── Weekly Rules ── */}
        <section className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Weekly Schedule</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Add recurring availability. Each rule generates bookable slots automatically.
          </p>

          {/* Existing rules */}
          {rules && rules.length > 0 && (
            <ul className="flex flex-col gap-2 mb-5">
              {rules.map((rule) => (
                <li key={rule.id} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-700/40">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {DAYS[rule.day_of_week]} · {formatTime(rule.start_time)} – {formatTime(rule.end_time)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {DURATIONS.find((d) => d.value === rule.slot_duration_minutes)?.label ?? `${rule.slot_duration_minutes} min`} slots
                      · book up to {rule.advance_booking_days} days ahead
                      {podcasts.length > 1 && ` · ${podcastMap[rule.podcast_id] ?? ''}`}
                    </p>
                  </div>
                  <form action={deleteRule}>
                    <input type="hidden" name="rule_id" value={rule.id} />
                    <FormButton className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      Remove
                    </FormButton>
                  </form>
                </li>
              ))}
            </ul>
          )}

          {/* Add rule form */}
          {podcasts.length > 1 ? (
            <div className="flex flex-col gap-4">
              {podcasts.map((p) => (
                <div key={p.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{p.title}</p>
                  <WeeklyScheduleForm podcastId={p.id} />
                </div>
              ))}
            </div>
          ) : (
            <WeeklyScheduleForm podcastId={podcasts[0]?.id ?? ''} />
          )}
        </section>

        {/* ── Blocked Dates ── */}
        <section className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Blocked Dates</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Block specific dates or date ranges — holidays, vacations, or anything that comes up. No guests can book on blocked dates.
          </p>

          {/* Existing blocks */}
          {blocks && blocks.length > 0 && (
            <ul className="flex flex-col gap-2 mb-5">
              {blocks.map((block) => (
                <li key={block.id} className="flex items-center justify-between rounded-xl border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/10 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {block.block_start === block.block_end
                        ? new Date(block.block_start + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                        : `${new Date(block.block_start + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(block.block_end + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </p>
                    {block.reason && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{block.reason}</p>
                    )}
                    {podcasts.length > 1 && (
                      <p className="text-xs text-indigo-500 dark:text-indigo-400">{podcastMap[block.podcast_id] ?? ''}</p>
                    )}
                  </div>
                  <form action={deleteBlock}>
                    <input type="hidden" name="block_id" value={block.id} />
                    <FormButton className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      Remove
                    </FormButton>
                  </form>
                </li>
              ))}
            </ul>
          )}

          {/* Add block form */}
          <form action={addBlock} className="flex flex-col gap-4">
            {podcasts.length > 1 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Show</label>
                <select name="podcast_id" required className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select a show</option>
                  {podcasts.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            ) : (
              <input type="hidden" name="podcast_id" value={podcasts[0]?.id ?? ''} />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From date</label>
                <input name="block_start" type="date" min={today} required className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To date</label>
                <input name="block_end" type="date" min={today} required className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason <span className="text-gray-400 font-normal">(optional)</span></label>
              <input name="reason" type="text" placeholder="e.g. Holiday, conference, personal" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <FormButton className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors">
              Block these dates
            </FormButton>
          </form>
        </section>
      </main>
    </div>
  )
}

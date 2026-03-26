import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'

export default async function PodcastsPage() {
  const supabase = createClient()

  const { data: podcasts } = await supabase
    .from('podcasts')
    .select('id, title, description, booking_fee_cents, currency')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/"><Logo compact /></Link>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Browse Shows</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Shows</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Browse available podcasts, shows, and events — and book your guest appearance.
        </p>

        {!podcasts || podcasts.length === 0 ? (
          <div className="rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No podcasts available yet. Check back soon.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {podcasts.map((podcast) => (
              <Link
                key={podcast.id}
                href={`/podcasts/${podcast.id}`}
                className="block rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {podcast.title}
                    </h2>
                    {podcast.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {podcast.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                      {podcast.booking_fee_cents === 0
                        ? 'Free'
                        : `${(podcast.booking_fee_cents / 100).toFixed(2)} ${podcast.currency}`}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  View slots →
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'
import NewPodcastForm from './NewPodcastForm'

export default async function NewPodcastPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'host') {
    redirect('/dashboard')
  }

  // Redirect to dashboard if a podcast already exists
  const { data: existing } = await supabase
    .from('podcasts')
    .select('id')
    .eq('host_id', user.id)
    .maybeSingle()

  if (existing) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <Logo compact />
        <ThemeToggle />
      </nav>

      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Create your show profile
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Tell guests about your show and set your booking fee.
        </p>

        <div className="rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <NewPodcastForm error={searchParams.error} />
        </div>
      </main>
    </div>
  )
}

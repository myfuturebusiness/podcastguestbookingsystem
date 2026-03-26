import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'
import { createCheckoutSession } from './actions'
import FormButton from '@/components/ui/FormButton'

export default async function PayPage({
  params,
  searchParams,
}: {
  params: { podcastId: string }
  searchParams: { app?: string; cancelled?: string }
}) {
  const { podcastId } = params
  const applicationId = searchParams.app

  if (!applicationId) redirect(`/book/${podcastId}`)

  const adminSupabase = createAdminClient()
  const { data: application } = await adminSupabase
    .from('applications')
    .select('id, first_name, last_name, email, payment_status, status, podcast_id, amount_cents, interview_format')
    .eq('id', applicationId)
    .eq('podcast_id', podcastId)
    .single()

  if (!application) redirect(`/book/${podcastId}`)
  if (application.status === 'confirmed') redirect(`/book/${podcastId}/thankyou?app=${applicationId}`)
  if (application.payment_status === 'paid' || application.payment_status === 'free') {
    redirect(`/book/${podcastId}/slots?app=${applicationId}`)
  }

  const supabase = createClient()
  const { data: podcast } = await supabase
    .from('podcasts')
    .select('id, title, currency, host_id, is_active')
    .eq('id', podcastId)
    .single()

  if (!podcast || !podcast.is_active) notFound()

  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', podcast.host_id)
    .single()

  const fee = ((application.amount_cents ?? 0) / 100).toFixed(2)
  const currency = podcast.currency.toUpperCase()
  const formatLabel = application.interview_format === 'audio_video' ? 'Audio + Video' : 'Audio only'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <Link href="/"><Logo compact /></Link>
        <ThemeToggle />
      </nav>

      <main className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
            Step 2 of 3
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Secure Your Interview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Hi {application.first_name}, you&apos;re one step away!
          </p>
        </div>

        {searchParams.cancelled && (
          <div className="mb-6 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
            Payment was cancelled. You can try again below.
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-400 dark:border-gray-700 p-6 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
            Interview on
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {podcast.title}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Hosted by {hostProfile?.full_name ?? 'the host'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{formatLabel}</p>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Appearance fee</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {fee} {currency}
            </span>
          </div>
        </div>

        <form action={createCheckoutSession}>
          <input type="hidden" name="application_id" value={applicationId} />
          <input type="hidden" name="podcast_id" value={podcastId} />
          <FormButton className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
            Pay {fee} {currency} →
          </FormButton>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          🔒 Secure payment powered by Stripe
        </p>
      </main>
    </div>
  )
}

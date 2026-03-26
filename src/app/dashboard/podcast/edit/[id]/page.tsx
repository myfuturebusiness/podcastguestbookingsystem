import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EditPodcastForm from './EditPodcastForm'

export default async function EditPodcastPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { error?: string }
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: podcast } = await supabase
    .from('podcasts')
    .select('title, description, show_type, interview_label, booking_fee_cents, booking_fee_video_cents, booking_fee_premium_cents, currency, tier_audio_description, tier_video_description, tier_premium_description, accept_stripe, accept_paypal')
    .eq('id', params.id)
    .eq('host_id', user.id)
    .maybeSingle()

  if (!podcast) redirect('/dashboard')

  // Check if credentials row exists (we don't expose the actual key values — just whether they're set)
  const { data: creds } = await supabase
    .from('podcast_payment_credentials')
    .select('stripe_publishable_key, stripe_secret_key, paypal_client_id, paypal_client_secret')
    .eq('podcast_id', params.id)
    .maybeSingle()

  const credentialsSet = {
    stripe_publishable_key: !!(creds?.stripe_publishable_key),
    stripe_secret_key: !!(creds?.stripe_secret_key),
    paypal_client_id: !!(creds?.paypal_client_id),
    paypal_client_secret: !!(creds?.paypal_client_secret),
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-8"
        >
          ← Back to dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Edit show profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Update your show details.</p>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-400 dark:border-gray-700 shadow p-8">
          <EditPodcastForm id={params.id} error={searchParams.error} podcast={podcast} credentialsSet={credentialsSet} />
        </div>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'
import ApplyButton from '@/components/ui/ApplyButton'

function formatPrice(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`
}

export default async function SalesPage({
  params,
}: {
  params: { podcastId: string }
}) {
  const supabase = createClient()

  const { data: podcast } = await supabase
    .from('podcasts')
    .select(
      'id, title, description, show_type, interview_label, booking_fee_cents, booking_fee_video_cents, booking_fee_premium_cents, currency, host_id, is_active, tier_audio_description, tier_video_description, tier_premium_description'
    )
    .eq('id', params.podcastId)
    .single()

  if (!podcast || !podcast.is_active) notFound()

  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', podcast.host_id)
    .single()

  const hostName = hostProfile?.full_name ?? 'the host'
  const isFree =
    podcast.booking_fee_cents === 0 &&
    podcast.booking_fee_video_cents === 0 &&
    podcast.booking_fee_premium_cents === 0
  const label = (podcast as { interview_label?: string }).interview_label || 'Interview'
  const showType = (podcast as { show_type?: string | null }).show_type

  // Build tier list — audio always shown, video/premium only if priced
  const tiers = [
    {
      key: 'audio',
      label: `Audio ${label}`,
      feeCents: podcast.booking_fee_cents,
      description:
        podcast.tier_audio_description ||
        'A 30–40 minute audio podcast interview. Includes social media promotion and a permanent post about your business on our website.',
      highlight: false,
    },
    ...(podcast.booking_fee_video_cents > 0
      ? [
          {
            key: 'audio_video',
            label: `Audio + Video ${label}`,
            feeCents: podcast.booking_fee_video_cents,
            description:
              podcast.tier_video_description ||
              'Everything in the audio package plus a full video recording you can share on your own channels.',
            highlight: true,
          },
        ]
      : []),
    ...(podcast.booking_fee_premium_cents > 0
      ? [
          {
            key: 'premium',
            label: 'Premium Offer',
            feeCents: podcast.booking_fee_premium_cents,
            description:
              podcast.tier_premium_description ||
              'Our complete package — full audio and video recording, video shorts, extended distribution and promotion across all platforms.',
            highlight: false,
          },
        ]
      : []),
  ]

  const gridCols =
    tiers.length === 1
      ? 'grid-cols-1 max-w-sm'
      : tiers.length === 2
      ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl'
      : 'grid-cols-1 sm:grid-cols-3 max-w-4xl'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <Logo compact />
        </Link>
        <ThemeToggle />
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          {(showType || label !== 'Interview') && (
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">
              {showType ? `${showType} ${label}` : label}
            </p>
          )}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {podcast.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Hosted by{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">{hostName}</span>
          </p>
          {podcast.description && (
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed max-w-2xl mx-auto">
              {podcast.description}
            </p>
          )}
        </div>

        {/* Pricing tiers */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isFree ? `Apply for a Free ${label}` : 'Choose Your Package'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isFree
              ? 'Fill in your application and choose a time that works for you.'
              : 'Select the package that best suits your goals. You will complete your application after choosing.'}
          </p>
        </div>

        <div className={`grid ${gridCols} gap-6 mx-auto`}>
          {tiers.map((tier) => (
            <div
              key={tier.key}
              className={`relative flex flex-col rounded-2xl border p-6 bg-white dark:bg-gray-800 ${
                tier.highlight
                  ? 'border-indigo-500 dark:border-indigo-400 shadow-lg'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {tier.label}
                </p>
                {isFree ? (
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Free</p>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(tier.feeCents, podcast.currency)}
                  </p>
                )}
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1 mb-6">
                {tier.description}
              </p>

              <ApplyButton
                href={`/book/${podcast.id}/apply?tier=${tier.key}`}
                className={`w-full rounded-lg px-5 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  tier.highlight
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100'
                }`}
              >
                {isFree ? `Apply for Free ${label} →` : 'Apply Now →'}
              </ApplyButton>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

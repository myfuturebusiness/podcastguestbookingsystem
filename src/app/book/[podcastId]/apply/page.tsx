import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'
import SubmitButton from '@/components/ui/SubmitButton'
import { submitApplication } from '../actions'
import CategorySelect from './CategorySelect'

function formatPrice(cents: number, currency: string) {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`
}

const TIER_LABELS: Record<string, string> = {
  audio: 'Audio Interview',
  audio_video: 'Audio + Video Interview',
  premium: 'Premium Offer',
}

const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  audio:
    'A 30–40 minute audio podcast interview. Includes social media promotion and a permanent post about your business on our website.',
  audio_video:
    'Everything in the audio package plus a full video recording you can share on your own channels.',
  premium:
    'Our complete package — full audio and video recording, video shorts, extended distribution and promotion across all platforms.',
}

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: { podcastId: string }
  searchParams: { tier?: string; error?: string }
}) {
  const tier = searchParams.tier ?? 'audio'
  if (!['audio', 'audio_video', 'premium'].includes(tier)) {
    redirect(`/book/${params.podcastId}`)
  }

  const supabase = createClient()
  const { data: podcast } = await supabase
    .from('podcasts')
    .select(
      'id, title, booking_fee_cents, booking_fee_video_cents, booking_fee_premium_cents, currency, is_active, tier_audio_description, tier_video_description, tier_premium_description, accept_stripe, accept_paypal'
    )
    .eq('id', params.podcastId)
    .single()

  if (!podcast || !podcast.is_active) notFound()

  const tierFee =
    tier === 'premium'
      ? podcast.booking_fee_premium_cents
      : tier === 'audio_video'
      ? podcast.booking_fee_video_cents
      : podcast.booking_fee_cents

  const customDescription =
    tier === 'premium'
      ? podcast.tier_premium_description
      : tier === 'audio_video'
      ? podcast.tier_video_description
      : podcast.tier_audio_description

  const tierDescription = customDescription ?? FALLBACK_DESCRIPTIONS[tier]
  const isFree = tierFee === 0

  // Respect host's chosen payment methods (also gated by platform env keys)
  const platformHasStripe = !!process.env.STRIPE_SECRET_KEY
  const platformHasPayPal = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
  const hasStripe = podcast.accept_stripe && platformHasStripe
  const hasPayPal = podcast.accept_paypal && platformHasPayPal
  const hasMultiplePaymentMethods = hasStripe && hasPayPal

  const categories = [
    'Business & Entrepreneurship',
    'Health & Wellness',
    'Technology & Innovation',
    'Finance & Investing',
    'Personal Development',
    'Marketing & Sales',
    'Leadership & Management',
    'Real Estate',
    'Science & Education',
    'Creative & Arts',
  ]

  const discoveryOptions = [
    'Google search',
    'Social media',
    'Referral from a friend or colleague',
    'Show directory',
    'Email',
    'Other',
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <Logo compact />
        </Link>
        <ThemeToggle />
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          href={`/book/${podcast.id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-8"
        >
          ← Back to packages
        </Link>

        {/* Selected tier banner */}
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-5 py-4 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">
                Selected package
              </p>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {TIER_LABELS[tier]}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                {tierDescription}
              </p>
            </div>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
              {formatPrice(tierFee, podcast.currency)}
            </p>
          </div>
        </div>

        {/* Error */}
        {searchParams.error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-6">
            {searchParams.error}
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Your Application
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Tell us about yourself so {podcast.title} can review your application.
        </p>

        <form action={submitApplication} className="flex flex-col gap-6">
          <input type="hidden" name="podcast_id" value={podcast.id} />
          <input type="hidden" name="interview_format" value={tier} />

          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First name <span className="text-red-500">*</span>
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                autoComplete="given-name"
                placeholder="Jane"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                autoComplete="family-name"
                placeholder="Smith"
                className={inputClass}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="jane@example.com"
              className={inputClass}
            />
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              id="website"
              name="website"
              type="url"
              autoComplete="url"
              placeholder="https://yourwebsite.com"
              className={inputClass}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your industry / category <span className="text-red-500">*</span>
            </label>
            <CategorySelect categories={categories} />
          </div>

          {/* Topic */}
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proposed interview topic <span className="text-red-500">*</span>
            </label>
            <input
              id="topic"
              name="topic"
              type="text"
              required
              placeholder="e.g. How I scaled my SaaS to 7 figures"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              What would you like to talk about on the show?
            </p>
          </div>

          {/* Bio text */}
          <div>
            <label htmlFor="bio_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Short bio
            </label>
            <textarea
              id="bio_text"
              name="bio_text"
              rows={4}
              placeholder="Tell the host a bit about your background, expertise, and what you do…"
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Bio file */}
          <div>
            <label htmlFor="bio_file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bio / media kit (PDF or TXT, max 5 MB)
            </label>
            <input
              id="bio_file"
              name="bio_file"
              type="file"
              accept=".pdf,.txt"
              className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 dark:file:border-gray-600 file:text-sm file:font-medium file:bg-white dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-50 dark:hover:file:bg-gray-600"
            />
          </div>

          {/* Social links */}
          <div>
            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Social media profiles <span className="text-gray-400 font-normal">(optional)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/yourhandle' },
                { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/you' },
                { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/you' },
                { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/you' },
              ].map((s) => (
                <div key={s.id}>
                  <label htmlFor={s.id} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {s.label}
                  </label>
                  <input
                    id={s.id}
                    name={s.id}
                    type="url"
                    placeholder={s.placeholder}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Discovery */}
          <div>
            <label htmlFor="discovery_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              How did you find us? <span className="text-red-500">*</span>
            </label>
            <select id="discovery_method" name="discovery_method" required className={inputClass}>
              <option value="">Select an option…</option>
              {discoveryOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Payment method selector — only shown for paid tiers with multiple options */}
          {!isFree && hasMultiplePaymentMethods && (
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                How would you like to pay?
              </p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/20">
                  <input
                    type="radio"
                    name="payment_method"
                    value="stripe"
                    defaultChecked
                    className="accent-indigo-600 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Credit / Debit Card</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Stripe — Visa, Mastercard, Amex</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/20">
                  <input
                    type="radio"
                    name="payment_method"
                    value="paypal"
                    className="accent-indigo-600 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">PayPal</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pay with your PayPal account or balance</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Hidden field when only one method is available */}
          {!isFree && !hasMultiplePaymentMethods && (
            <input
              type="hidden"
              name="payment_method"
              value={hasPayPal ? 'paypal' : 'stripe'}
            />
          )}

          {/* Fee summary */}
          <div className="rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Package:</span> {TIER_LABELS[tier]}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
              <span className="font-medium">Fee:</span>{' '}
              {isFree ? (
                <span className="text-green-600 dark:text-green-400 font-semibold">Free</span>
              ) : (
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  {formatPrice(tierFee, podcast.currency)}
                </span>
              )}
            </p>
          </div>

          <SubmitButton
            label={isFree ? 'Submit application →' : 'Submit & pay →'}
            loadingLabel="Submitting…"
          />
        </form>
      </main>
    </div>
  )
}

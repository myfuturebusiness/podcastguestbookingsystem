'use client'

import { useState } from 'react'
import { updatePodcast } from './actions'
import SubmitButton from '@/components/ui/SubmitButton'

interface Props {
  id: string
  error?: string | null
  podcast: {
    title: string
    description: string | null
    show_type: string | null
    interview_label: string
    booking_fee_cents: number
    booking_fee_video_cents: number
    booking_fee_premium_cents: number
    currency: string
    tier_audio_description: string | null
    tier_video_description: string | null
    tier_premium_description: string | null
    accept_stripe: boolean
    accept_paypal: boolean
  }
  credentialsSet: {
    stripe_publishable_key: boolean
    stripe_secret_key: boolean
    paypal_client_id: boolean
    paypal_client_secret: boolean
  }
}

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500'

const tierFields = [
  {
    priceId: 'booking_fee',
    descId: 'tier_audio_description',
    label: 'Audio Interview',
    descPlaceholder:
      'e.g. 30-min audio interview, distributed to 12K subscribers, permanent show-notes post on my site…',
  },
  {
    priceId: 'booking_fee_video',
    descId: 'tier_video_description',
    label: 'Audio + Video Interview',
    descPlaceholder:
      'e.g. Everything in Audio plus a professionally edited video recording you can repurpose on your channels…',
  },
  {
    priceId: 'booking_fee_premium',
    descId: 'tier_premium_description',
    label: 'Premium Offer',
    descPlaceholder:
      'e.g. Full audio + video, 3 short-form clips for social, email feature to my list, and a pre-interview coaching call…',
  },
]

export default function EditPodcastForm({ id, error, podcast, credentialsSet }: Props) {
  const action = updatePodcast.bind(null, id)
  const isFreeByDefault =
    podcast.booking_fee_cents === 0 &&
    podcast.booking_fee_video_cents === 0 &&
    podcast.booking_fee_premium_cents === 0
  const [isFree, setIsFree] = useState(isFreeByDefault)
  const [acceptStripe, setAcceptStripe] = useState(podcast.accept_stripe)
  const [acceptPaypal, setAcceptPaypal] = useState(podcast.accept_paypal)

  const defaultPrices: Record<string, string> = {
    booking_fee: (podcast.booking_fee_cents / 100).toFixed(2),
    booking_fee_video: (podcast.booking_fee_video_cents / 100).toFixed(2),
    booking_fee_premium: (podcast.booking_fee_premium_cents / 100).toFixed(2),
  }

  const defaultDescs: Record<string, string> = {
    tier_audio_description: podcast.tier_audio_description ?? '',
    tier_video_description: podcast.tier_video_description ?? '',
    tier_premium_description: podcast.tier_premium_description ?? '',
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="show_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Show type
          </label>
          <select id="show_type" name="show_type" defaultValue={podcast.show_type ?? ''} className={inputClass}>
            <option value="">None</option>
            <option value="Podcast">Podcast</option>
            <option value="Show">Show</option>
            <option value="Event">Event</option>
          </select>
        </div>
        <div>
          <label htmlFor="interview_label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Booking type
          </label>
          <select id="interview_label" name="interview_label" defaultValue={podcast.interview_label ?? 'Interview'} className={inputClass}>
            <option value="Interview">Interview</option>
            <option value="Appearance">Appearance</option>
            <option value="Feature">Feature</option>
            <option value="Session">Session</option>
            <option value="Presentation">Presentation</option>
            <option value="Masterclass">Masterclass</option>
            <option value="Showcase">Showcase</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={podcast.title}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={podcast.description ?? ''}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Pricing type */}
      <div>
        <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Interview pricing
        </p>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="pricing_type"
              value="paid"
              checked={!isFree}
              onChange={() => setIsFree(false)}
              className="accent-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Paid</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="pricing_type"
              value="free"
              checked={isFree}
              onChange={() => setIsFree(true)}
              className="accent-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Free</span>
          </label>
        </div>

        {isFree ? (
          <>
            <input type="hidden" name="booking_fee" value="0" />
            <input type="hidden" name="booking_fee_video" value="0" />
            <input type="hidden" name="booking_fee_premium" value="0" />
            <p className="text-sm text-gray-400 dark:text-gray-500 rounded-lg bg-gray-50 dark:bg-gray-700/50 px-4 py-3">
              Guests will not be charged to appear on this podcast.
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-5">
            {tierFields.map((tier) => (
              <div
                key={tier.priceId}
                className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3"
              >
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {tier.label}
                </p>

                <div>
                  <label
                    htmlFor={tier.priceId}
                    className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                  >
                    Price
                  </label>
                  <div className="relative max-w-xs">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500 text-sm">
                      $
                    </span>
                    <input
                      id={tier.priceId}
                      name={tier.priceId}
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      defaultValue={defaultPrices[tier.priceId]}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-7 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={tier.descId}
                    className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                  >
                    What&apos;s included — shown to guests on your booking page
                  </label>
                  <textarea
                    id={tier.descId}
                    name={tier.descId}
                    rows={3}
                    defaultValue={defaultDescs[tier.descId]}
                    placeholder={tier.descPlaceholder}
                    className={`${inputClass} resize-none text-xs`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tier descriptions for free podcast */}
      {isFree && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            What guests receive — shown on your booking page
          </p>
          {tierFields.slice(0, 1).map((tier) => (
            <div key={tier.descId}>
              <label
                htmlFor={`free_${tier.descId}`}
                className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
              >
                Interview description
              </label>
              <textarea
                id={`free_${tier.descId}`}
                name={tier.descId}
                rows={3}
                defaultValue={defaultDescs[tier.descId]}
                placeholder={tier.descPlaceholder}
                className={`${inputClass} resize-none text-xs`}
              />
              {/* Keep video/premium descriptions in hidden fields so they aren't lost */}
              <input type="hidden" name="tier_video_description" value={defaultDescs.tier_video_description} />
              <input type="hidden" name="tier_premium_description" value={defaultDescs.tier_premium_description} />
            </div>
          ))}
        </div>
      )}

      {/* Payment methods */}
      {!isFree && (
        <div>
          <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment methods you accept
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/20">
              <input
                type="checkbox"
                name="accept_stripe"
                value="1"
                checked={acceptStripe}
                onChange={(e) => setAcceptStripe(e.target.checked)}
                className="accent-indigo-600 shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Stripe — Credit / Debit Card</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Visa, Mastercard, Amex and more</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/20">
              <input
                type="checkbox"
                name="accept_paypal"
                value="1"
                checked={acceptPaypal}
                onChange={(e) => setAcceptPaypal(e.target.checked)}
                className="accent-indigo-600 shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">PayPal</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Guests pay via their PayPal account or balance</p>
              </div>
            </label>
          </div>
          {!acceptStripe && !acceptPaypal && (
            <p className="mt-2 text-xs text-red-500 dark:text-red-400">
              At least one payment method must be selected for paid interviews.
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Currency
        </label>
        <select id="currency" name="currency" required defaultValue={podcast.currency} className={inputClass}>
          <option value="USD">USD — US Dollar</option>
          <option value="GBP">GBP — British Pound</option>
          <option value="EUR">EUR — Euro</option>
          <option value="CAD">CAD — Canadian Dollar</option>
          <option value="AUD">AUD — Australian Dollar</option>
        </select>
      </div>

      {/* Payment credentials */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Payment credentials
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Your Stripe and PayPal keys are used to collect payments from guests. Leave a field blank to keep the existing value. These keys are stored securely and are never shared with other hosts.
        </p>

        <div className="flex flex-col gap-4">
          {/* Stripe */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Stripe</p>
            <div>
              <label htmlFor="stripe_publishable_key" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Publishable key
                {credentialsSet.stripe_publishable_key && (
                  <span className="ml-2 text-green-600 dark:text-green-400">✓ Set</span>
                )}
              </label>
              <input
                id="stripe_publishable_key"
                name="stripe_publishable_key"
                type="password"
                autoComplete="off"
                placeholder={credentialsSet.stripe_publishable_key ? 'Leave blank to keep existing' : 'pk_live_… or pk_test_…'}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="stripe_secret_key" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Secret key
                {credentialsSet.stripe_secret_key && (
                  <span className="ml-2 text-green-600 dark:text-green-400">✓ Set</span>
                )}
              </label>
              <input
                id="stripe_secret_key"
                name="stripe_secret_key"
                type="password"
                autoComplete="off"
                placeholder={credentialsSet.stripe_secret_key ? 'Leave blank to keep existing' : 'sk_live_… or sk_test_…'}
                className={inputClass}
              />
            </div>
          </div>

          {/* PayPal */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">PayPal</p>
            <div>
              <label htmlFor="paypal_client_id" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Client ID
                {credentialsSet.paypal_client_id && (
                  <span className="ml-2 text-green-600 dark:text-green-400">✓ Set</span>
                )}
              </label>
              <input
                id="paypal_client_id"
                name="paypal_client_id"
                type="password"
                autoComplete="off"
                placeholder={credentialsSet.paypal_client_id ? 'Leave blank to keep existing' : 'Your PayPal client ID'}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="paypal_client_secret" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Client secret
                {credentialsSet.paypal_client_secret && (
                  <span className="ml-2 text-green-600 dark:text-green-400">✓ Set</span>
                )}
              </label>
              <input
                id="paypal_client_secret"
                name="paypal_client_secret"
                type="password"
                autoComplete="off"
                placeholder={credentialsSet.paypal_client_secret ? 'Leave blank to keep existing' : 'Your PayPal client secret'}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      <SubmitButton label="Save changes" loadingLabel="Saving…" />
    </form>
  )
}

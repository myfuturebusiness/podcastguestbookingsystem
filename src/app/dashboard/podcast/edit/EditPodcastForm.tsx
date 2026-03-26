'use client'

import { updatePodcast } from './actions'
import SubmitButton from '@/components/ui/SubmitButton'

interface Props {
  error?: string | null
  podcast: {
    title: string
    description: string | null
    booking_fee_cents: number
    currency: string
  }
}

export default function EditPodcastForm({ error, podcast }: Props) {
  return (
    <form action={updatePodcast} className="flex flex-col gap-5">
      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Podcast name
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={podcast.title}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="booking_fee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Booking fee
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500 text-sm">$</span>
            <input
              id="booking_fee"
              name="booking_fee"
              type="number"
              required
              min="0"
              step="0.01"
              defaultValue={(podcast.booking_fee_cents / 100).toFixed(2)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-7 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Enter 0 for free bookings</p>
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            required
            defaultValue={podcast.currency}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="USD">USD — US Dollar</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="EUR">EUR — Euro</option>
            <option value="CAD">CAD — Canadian Dollar</option>
            <option value="AUD">AUD — Australian Dollar</option>
          </select>
        </div>
      </div>

      <SubmitButton label="Save changes" loadingLabel="Saving…" />
    </form>
  )
}

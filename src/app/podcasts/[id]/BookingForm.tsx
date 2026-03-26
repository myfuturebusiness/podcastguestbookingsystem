'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { bookSlot } from './actions'

interface Slot {
  id: string
  label: string
}

interface BookingFormProps {
  slots: Slot[]
  podcastId: string
}

function SubmitBtn({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Submitting…' : 'Request this slot'}
    </button>
  )
}

export default function BookingForm({ slots, podcastId }: BookingFormProps) {
  const [selectedSlot, setSelectedSlot] = useState<string>('')

  return (
    <form action={bookSlot}>
      <input type="hidden" name="podcast_id" value={podcastId} />
      <input type="hidden" name="slot_id" value={selectedSlot} />

      <fieldset className="mb-6">
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select a time slot
        </legend>
        <div className="flex flex-col gap-2">
          {slots.map((slot) => (
            <label
              key={slot.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                selectedSlot === slot.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <input
                type="radio"
                name="slot_radio"
                value={slot.id}
                checked={selectedSlot === slot.id}
                onChange={() => setSelectedSlot(slot.id)}
                className="accent-indigo-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{slot.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <SubmitBtn disabled={!selectedSlot} />
    </form>
  )
}

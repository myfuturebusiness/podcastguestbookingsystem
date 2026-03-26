'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { joinWaitlist } from './waitlist-action'

const initial: { success?: boolean; error?: string } = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-400 whitespace-nowrap"
    >
      {pending ? 'Joining…' : 'Get Early Access →'}
    </button>
  )
}

export default function WaitlistForm({ dark = false }: { dark?: boolean }) {
  const [state, action] = useFormState(joinWaitlist, initial)

  if (state.success) {
    return (
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <p className="font-semibold text-green-400">You&apos;re on the list — we&apos;ll be in touch soon.</p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
      <input
        type="email"
        name="email"
        required
        placeholder="Enter your work email"
        className={`flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
          dark
            ? 'bg-white/10 border border-white/20 text-white placeholder-white/50 backdrop-blur-sm'
            : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500'
        }`}
      />
      <SubmitButton />
      {state.error && (
        <p className="text-red-400 text-xs mt-1">{state.error}</p>
      )}
    </form>
  )
}

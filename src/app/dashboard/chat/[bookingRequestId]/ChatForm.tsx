'use client'

import { useRef, useTransition } from 'react'
import { sendMessage } from './actions'

export default function ChatForm({ bookingRequestId }: { bookingRequestId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const text = (formData.get('message_text') as string)?.trim()
    if (!text) return
    startTransition(async () => {
      await sendMessage(formData)
      formRef.current?.reset()
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex gap-3 items-end"
    >
      <input type="hidden" name="booking_request_id" value={bookingRequestId} />
      <textarea
        name="message_text"
        required
        rows={2}
        placeholder="Write a message…"
        maxLength={2000}
        disabled={isPending}
        className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.currentTarget.form?.requestSubmit()
          }
        }}
      />
      <button
        type="submit"
        disabled={isPending}
        className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Sending…' : 'Send'}
      </button>
    </form>
  )
}

'use client'

import { useFormStatus } from 'react-dom'
import Spinner from './Spinner'

export default function SubmitButton({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
    >
      {pending && <Spinner className="h-4 w-4" />}
      {pending ? loadingLabel : label}
    </button>
  )
}

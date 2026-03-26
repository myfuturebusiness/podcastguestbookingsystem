'use client'

import { useFormStatus } from 'react-dom'
import Spinner from './Spinner'

interface Props {
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export default function FormButton({ children, className = '', disabled = false }: Props) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`${className} inline-flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {pending && <Spinner className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}

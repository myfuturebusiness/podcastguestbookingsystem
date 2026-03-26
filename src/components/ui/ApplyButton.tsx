'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from './Spinner'

interface Props {
  href: string
  className: string
  children: React.ReactNode
}

export default function ApplyButton({ href, className, children }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleClick() {
    setLoading(true)
    router.push(href)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${className} inline-flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}

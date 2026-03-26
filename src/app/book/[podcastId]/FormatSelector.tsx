'use client'

import { useState } from 'react'

interface FormatSelectorProps {
  audioFeeCents: number
  videoFeeCents: number
  premiumFeeCents: number
  currency: string
}

function formatPrice(cents: number, currency: string) {
  if (cents === 0) return 'Free'
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`
}

type Format = 'audio' | 'audio_video' | 'premium'

export default function FormatSelector({
  audioFeeCents,
  videoFeeCents,
  premiumFeeCents,
  currency,
}: FormatSelectorProps) {
  const [format, setFormat] = useState<Format>('audio')

  const options: { value: Format; label: string; description: string; feeCents: number }[] = [
    {
      value: 'audio',
      label: 'Audio only',
      description: 'Standard audio podcast interview',
      feeCents: audioFeeCents,
    },
    {
      value: 'audio_video',
      label: 'Audio + Video',
      description: 'Full audio and video recording',
      feeCents: videoFeeCents,
    },
    ...(premiumFeeCents > 0
      ? [
          {
            value: 'premium' as Format,
            label: 'Premium Offer',
            description: 'Full recording plus promotion & distribution',
            feeCents: premiumFeeCents,
          },
        ]
      : []),
  ]

  const currentFee = options.find((o) => o.value === format)?.feeCents ?? 0
  const isFree = currentFee === 0

  return (
    <div>
      <div className="flex flex-col gap-3 mb-4">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/20"
          >
            <input
              type="radio"
              name="interview_format"
              value={opt.value}
              checked={format === opt.value}
              onChange={() => setFormat(opt.value)}
              className="accent-indigo-600 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{opt.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{opt.description}</p>
            </div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
              {formatPrice(opt.feeCents, currency)}
            </p>
          </label>
        ))}
      </div>

      {/* Dynamic fee summary */}
      <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-4 py-2.5">
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
          {isFree
            ? 'This interview is free'
            : `Interview fee: ${formatPrice(currentFee, currency)}`}
        </p>
      </div>
    </div>
  )
}

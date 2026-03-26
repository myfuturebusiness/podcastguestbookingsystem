'use client'

/**
 * Logo — Guest Booking System · Powered by My Future Business
 *
 * compact=false (default) — full size for homepage and auth pages
 * compact=true            — smaller for nav bars inside the app
 *
 * variant: 'A' (mic icon, default) | 'B' (GBS monogram) | 'C' (accent bar)
 */

type Variant = 'A' | 'B' | 'C'

interface Props {
  width?: number
  height?: number
  variant?: Variant
  compact?: boolean
}

function MicIcon({ compact }: { compact: boolean }) {
  return (
    <svg
      width={compact ? 24 : 38}
      height={compact ? 33 : 52}
      viewBox="0 0 26 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <rect x="6" y="0" width="14" height="22" rx="7" className="fill-indigo-600 dark:fill-indigo-400" />
      <rect x="10" y="4" width="6" height="11" rx="3" fill="white" opacity="0.25" />
      <path d="M1 16 Q1 30 13 30 Q25 30 25 16" className="stroke-indigo-600 dark:stroke-indigo-400" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="13" y1="30" x2="13" y2="35" className="stroke-indigo-600 dark:stroke-indigo-400" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="7" y1="35" x2="19" y2="35" className="stroke-indigo-600 dark:stroke-indigo-400" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function TextBlock({ compact }: { compact: boolean }) {
  return (
    <div className="flex flex-col leading-none gap-[4px] items-center">
      <span
        className={`${compact ? 'text-[15px]' : 'text-[22px]'} font-extrabold tracking-tight text-gray-900 dark:text-white whitespace-nowrap`}
      >
        Guest Booking System
      </span>
      <span
        className={`${compact ? 'text-[7px]' : 'text-[9px]'} font-semibold tracking-[0.14em] uppercase text-gray-400 dark:text-gray-500 whitespace-nowrap`}
      >
        Powered by My Future Business
      </span>
    </div>
  )
}

function ConceptA({ compact }: { compact: boolean }) {
  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-2.5'} select-none`}>
      <MicIcon compact={compact} />
      <TextBlock compact={compact} />
    </div>
  )
}

function ConceptB({ compact }: { compact: boolean }) {
  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-2.5'} select-none`}>
      <div className={`flex-shrink-0 ${compact ? 'w-8 h-8' : 'w-12 h-12'} rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shadow-sm`}>
        <span className={`${compact ? 'text-[10px]' : 'text-[13px]'} font-black text-white tracking-tight leading-none`}>GBS</span>
      </div>
      <TextBlock compact={compact} />
    </div>
  )
}

function ConceptC({ compact }: { compact: boolean }) {
  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'} select-none`}>
      <div className={`flex-shrink-0 w-1 ${compact ? 'h-7' : 'h-10'} rounded-full bg-gradient-to-b from-indigo-500 to-violet-600`} />
      <div className="flex flex-col leading-none gap-[4px] items-center">
        <span className={`${compact ? 'text-[15px]' : 'text-[22px]'} font-extrabold tracking-tight text-gray-900 dark:text-white whitespace-nowrap`}>
          Guest Booking System
        </span>
        <span className={`${compact ? 'text-[7px]' : 'text-[9px]'} font-semibold tracking-[0.14em] uppercase text-indigo-400 dark:text-indigo-500 whitespace-nowrap`}>
          Powered by My Future Business
        </span>
      </div>
    </div>
  )
}

export default function Logo({ variant = 'A', compact = false }: Props) {
  if (variant === 'B') return <ConceptB compact={compact} />
  if (variant === 'C') return <ConceptC compact={compact} />
  return <ConceptA compact={compact} />
}

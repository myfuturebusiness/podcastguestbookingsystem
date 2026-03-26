'use client'

import { useState, useEffect } from 'react'
import { confirmSlot } from './actions'
import FormButton from '@/components/ui/FormButton'

interface Slot {
  start_time: string
  end_time: string
}

interface Props {
  slots: Slot[]
  podcastId: string
  applicationId: string
  podcastTitle: string
  isReschedule?: boolean
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toLocalDateKey(isoString: string): string {
  const d = new Date(isoString)
  // Zero-pad: YYYY-MM-DD in local time
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateHeading(dateKey: string): string {
  // dateKey is YYYY-MM-DD
  const d = new Date(dateKey + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export default function SlotCalendar({ slots, podcastId, applicationId, podcastTitle, isReschedule }: Props) {
  const [guestTimezone, setGuestTimezone] = useState('UTC')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedStart, setSelectedStart] = useState<string>('')
  const [selectedEnd, setSelectedEnd] = useState<string>('')

  // Capture guest timezone on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) setGuestTimezone(tz)
    } catch {}
  }, [])

  // Group slots by local date
  const slotsByDate: Record<string, Slot[]> = {}
  for (const slot of slots) {
    const key = toLocalDateKey(slot.start_time)
    if (!slotsByDate[key]) slotsByDate[key] = []
    slotsByDate[key].push(slot)
  }

  const availableDates = new Set(Object.keys(slotsByDate))

  // Determine calendar month — default to the month of the first available slot
  const firstSlotDate = slots.length > 0 ? new Date(slots[0].start_time) : new Date()
  const [calYear, setCalYear] = useState(firstSlotDate.getFullYear())
  const [calMonth, setCalMonth] = useState(firstSlotDate.getMonth()) // 0-indexed

  // Build calendar grid for current month
  const firstOfMonth = new Date(calYear, calMonth, 1)
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const startDayOfWeek = firstOfMonth.getDay() // 0=Sun

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1) }
    else setCalMonth((m) => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1) }
    else setCalMonth((m) => m + 1)
  }

  function selectDate(dateKey: string) {
    setSelectedDate(dateKey)
    setSelectedStart('')
    setSelectedEnd('')
  }

  function selectSlot(slot: Slot) {
    setSelectedStart(slot.start_time)
    setSelectedEnd(slot.end_time)
  }

  const todayKey = toLocalDateKey(new Date().toISOString())
  const slotsForSelected = selectedDate ? (slotsByDate[selectedDate] ?? []) : []

  return (
    <div>
      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-400 dark:border-gray-700 p-5 mb-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{podcastTitle}</p>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ‹
          </button>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {MONTH_NAMES[calMonth]} {calYear}
          </p>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            ›
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* Empty cells before the 1st */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const m = String(calMonth + 1).padStart(2, '0')
            const d = String(day).padStart(2, '0')
            const dateKey = `${calYear}-${m}-${d}`
            const hasSlots = availableDates.has(dateKey)
            const isPast = dateKey < todayKey
            const isSelected = selectedDate === dateKey
            const isToday = dateKey === todayKey

            return (
              <div key={day} className="flex justify-center">
                <button
                  type="button"
                  disabled={!hasSlots || isPast}
                  onClick={() => hasSlots && !isPast && selectDate(dateKey)}
                  className={`relative w-9 h-9 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : hasSlots && !isPast
                      ? 'text-gray-900 dark:text-white hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer'
                      : 'text-gray-300 dark:text-gray-600 cursor-default'
                  } ${isToday && !isSelected ? 'ring-1 ring-indigo-400' : ''}`}
                >
                  {day}
                  {hasSlots && !isPast && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {availableDates.size === 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            No slots available yet. Check back soon.
          </p>
        )}
      </div>

      {/* Time slots for selected date */}
      {selectedDate && slotsForSelected.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-400 dark:border-gray-700 p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {formatDateHeading(selectedDate)}
          </p>

          <form action={confirmSlot}>
            <input type="hidden" name="podcast_id" value={podcastId} />
            <input type="hidden" name="application_id" value={applicationId} />
            <input type="hidden" name="guest_timezone" value={guestTimezone} />
            <input type="hidden" name="slot_start_time" value={selectedStart} />
            <input type="hidden" name="slot_end_time" value={selectedEnd} />
            {isReschedule && <input type="hidden" name="reschedule" value="1" />}

            <div className="flex flex-wrap gap-2 mb-5">
              {slotsForSelected.map((slot) => {
                const isChosen = selectedStart === slot.start_time
                return (
                  <button
                    key={slot.start_time}
                    type="button"
                    onClick={() => selectSlot(slot)}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isChosen
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400 dark:hover:border-indigo-500'
                    }`}
                  >
                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                  </button>
                )
              })}
            </div>

            <FormButton
              disabled={!selectedStart}
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedStart ? 'Confirm This Time →' : 'Select a time above'}
            </FormButton>
          </form>
        </div>
      )}
    </div>
  )
}

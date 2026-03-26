'use client'

import { useState } from 'react'
import { addRule } from './actions'
import FormButton from '@/components/ui/FormButton'

const DAYS = [
  { index: 0, short: 'Sun', full: 'Sunday' },
  { index: 1, short: 'Mon', full: 'Monday' },
  { index: 2, short: 'Tue', full: 'Tuesday' },
  { index: 3, short: 'Wed', full: 'Wednesday' },
  { index: 4, short: 'Thu', full: 'Thursday' },
  { index: 5, short: 'Fri', full: 'Friday' },
  { index: 6, short: 'Sat', full: 'Saturday' },
]

const DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
]

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500'

interface Props {
  podcastId: string
}

export default function WeeklyScheduleForm({ podcastId }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [customTimes, setCustomTimes] = useState(false)
  const [globalStart, setGlobalStart] = useState('09:00')
  const [globalEnd, setGlobalEnd] = useState('17:00')
  const [perDayTimes, setPerDayTimes] = useState<Record<number, { start: string; end: string }>>({})

  function toggleDay(index: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
        if (!perDayTimes[index]) {
          setPerDayTimes((p) => ({ ...p, [index]: { start: globalStart, end: globalEnd } }))
        }
      }
      return next
    })
  }

  function selectMonFri() {
    setSelected(new Set<number>([1, 2, 3, 4, 5]))
    setPerDayTimes((prev) => {
      const next = { ...prev }
      for (const d of [1, 2, 3, 4, 5]) {
        if (!next[d]) next[d] = { start: globalStart, end: globalEnd }
      }
      return next
    })
  }

  function updatePerDay(day: number, field: 'start' | 'end', value: string) {
    setPerDayTimes((prev) => ({
      ...prev,
      [day]: { ...(prev[day] ?? { start: globalStart, end: globalEnd }), [field]: value },
    }))
  }

  const sortedSelected = Array.from(selected).sort((a, b) => a - b)

  return (
    <form action={addRule} className="flex flex-col gap-5">
      <input type="hidden" name="podcast_id" value={podcastId} />

      {/* Hidden day_of_week inputs — one per selected day */}
      {sortedSelected.map((d) => (
        <input key={d} type="hidden" name="day_of_week" value={d} />
      ))}

      {/* Hidden time inputs */}
      {!customTimes ? (
        <>
          <input type="hidden" name="start_time" value={globalStart} />
          <input type="hidden" name="end_time" value={globalEnd} />
        </>
      ) : (
        sortedSelected.map((d) => {
          const t = perDayTimes[d] ?? { start: globalStart, end: globalEnd }
          return (
            <span key={d} className="hidden">
              <input type="hidden" name={`start_time_${d}`} value={t.start} />
              <input type="hidden" name={`end_time_${d}`} value={t.end} />
            </span>
          )
        })
      )}

      {/* ── Day selector ── */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Days</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {DAYS.map((d) => (
            <button
              key={d.index}
              type="button"
              onClick={() => toggleDay(d.index)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                selected.has(d.index)
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400 dark:hover:border-indigo-500'
              }`}
            >
              {d.short}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectMonFri}
            className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Mon – Fri
          </button>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Time pickers (shown only when days selected) ── */}
      {selected.size > 0 && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Times:</span>
            <button
              type="button"
              onClick={() => setCustomTimes(false)}
              className={`rounded-lg px-3 py-1 text-xs font-medium border transition-colors ${
                !customTimes
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-400'
              }`}
            >
              Same for all
            </button>
            <button
              type="button"
              onClick={() => setCustomTimes(true)}
              className={`rounded-lg px-3 py-1 text-xs font-medium border transition-colors ${
                customTimes
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-400'
              }`}
            >
              Per day
            </button>
          </div>

          {!customTimes ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                <input
                  type="time"
                  value={globalStart}
                  onChange={(e) => setGlobalStart(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                <input
                  type="time"
                  value={globalEnd}
                  onChange={(e) => setGlobalEnd(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedSelected.map((dayIndex) => {
                const day = DAYS[dayIndex]
                const times = perDayTimes[dayIndex] ?? { start: globalStart, end: globalEnd }
                return (
                  <div key={dayIndex} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{day.full}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                        <input
                          type="time"
                          value={times.start}
                          onChange={(e) => updatePerDay(dayIndex, 'start', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                        <input
                          type="time"
                          value={times.end}
                          onChange={(e) => updatePerDay(dayIndex, 'end', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Duration + advance ── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slot duration</label>
          <select name="slot_duration_minutes" required className={inputClass}>
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Book up to</label>
          <select name="advance_booking_days" required className={inputClass}>
            <option value="7">1 week ahead</option>
            <option value="14">2 weeks ahead</option>
            <option value="21">3 weeks ahead</option>
            <option value="30">1 month ahead</option>
            <option value="45">45 days ahead</option>
            <option value="60">2 months ahead</option>
          </select>
        </div>
      </div>

      <FormButton
        disabled={selected.size === 0}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selected.size === 0
          ? 'Select days above to continue'
          : `Add rule for ${selected.size} day${selected.size > 1 ? 's' : ''}`}
      </FormButton>
    </form>
  )
}

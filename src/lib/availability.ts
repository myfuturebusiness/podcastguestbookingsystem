export interface AvailabilityRule {
  id: string
  podcast_id: string
  day_of_week: number
  start_time: string   // "HH:MM:SS"
  end_time: string     // "HH:MM:SS"
  slot_duration_minutes: number
  advance_booking_days: number
}

export interface AvailabilityBlock {
  id: string
  podcast_id: string
  block_start: string  // "YYYY-MM-DD"
  block_end: string    // "YYYY-MM-DD"
  reason?: string | null
}

export interface GeneratedSlot {
  start_time: string   // ISO string
  end_time: string     // ISO string
}

// ── Timezone helpers ──────────────────────────────────────────────────────────

/**
 * Returns "YYYY-MM-DD" for a UTC Date in the given IANA timezone.
 */
function getLocalDateStr(utcDate: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: timezone }).format(utcDate)
  } catch {
    return utcDate.toISOString().slice(0, 10)
  }
}

/**
 * Returns the day-of-week (0=Sun … 6=Sat) for a UTC Date in the given timezone.
 */
function getDayOfWeekInTimezone(utcDate: Date, timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    }).formatToParts(utcDate)
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
    return map[parts.find((p) => p.type === 'weekday')?.value ?? ''] ?? utcDate.getUTCDay()
  } catch {
    return utcDate.getUTCDay()
  }
}

/**
 * Converts a local date+time string (e.g. "2024-03-15" + "09:00") in the given
 * IANA timezone to a UTC Date. Handles DST automatically.
 */
function localTimeToUtc(localDateStr: string, localTime: string, timezone: string): Date {
  // Start with a naive UTC guess (as if no timezone offset)
  const naiveUtc = new Date(`${localDateStr}T${localTime}:00Z`)
  try {
    // Find what local date+time that naive UTC corresponds to in the target tz
    const fmt = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    // sv-SE gives "YYYY-MM-DD HH:MM" — parse as UTC for offset calculation
    const localRepr = fmt.format(naiveUtc).replace(' ', 'T') + ':00Z'
    const localAsUtcMs = new Date(localRepr).getTime()
    const targetMs = naiveUtc.getTime()
    // Correction: add the difference between what we want and what we got
    return new Date(naiveUtc.getTime() + (targetMs - localAsUtcMs))
  } catch {
    return naiveUtc
  }
}

// ── Slot generation ───────────────────────────────────────────────────────────

/**
 * Generates all available slots for a podcast based on its rules and blocks.
 * All times are interpreted in the host's IANA timezone.
 * Filters out slots that are already booked.
 */
export function generateAvailableSlots(
  rules: AvailabilityRule[],
  blocks: AvailabilityBlock[],
  bookedStartTimes: Set<string>,
  hostTimezone: string = 'UTC'
): GeneratedSlot[] {
  if (rules.length === 0) return []

  const now = new Date()
  const bufferEnd = new Date(now.getTime() + 60 * 60 * 1000) // 1-hour buffer
  const maxAdvanceDays = Math.max(...rules.map((r) => r.advance_booking_days))

  // Build set of blocked dates in HOST timezone (YYYY-MM-DD local strings)
  const blockedDates = new Set<string>()
  for (const block of blocks) {
    // Iterate calendar days between block_start and block_end
    const [sy, sm, sd] = block.block_start.split('-').map(Number)
    const [ey, em, ed] = block.block_end.split('-').map(Number)
    const cur = new Date(sy, sm - 1, sd)
    const end = new Date(ey, em - 1, ed)
    while (cur <= end) {
      const y = cur.getFullYear()
      const m = String(cur.getMonth() + 1).padStart(2, '0')
      const d = String(cur.getDate()).padStart(2, '0')
      blockedDates.add(`${y}-${m}-${d}`)
      cur.setDate(cur.getDate() + 1)
    }
  }

  const slots: GeneratedSlot[] = []

  // Start iterating from today in the host's local timezone
  let localDateStr = getLocalDateStr(now, hostTimezone)

  for (let d = 0; d <= maxAdvanceDays + 1; d++) {
    // Compute a UTC reference point for this local date (noon local time)
    const localNoonUtc = localTimeToUtc(localDateStr, '12:00', hostTimezone)
    if (localNoonUtc.getTime() > now.getTime() + (maxAdvanceDays + 1) * 24 * 60 * 60 * 1000) break

    const dayOfWeek = getDayOfWeekInTimezone(localNoonUtc, hostTimezone)

    if (!blockedDates.has(localDateStr)) {
      const dayRules = rules.filter((r) => r.day_of_week === dayOfWeek)

      for (const rule of dayRules) {
        const startTime = rule.start_time.slice(0, 5) // "HH:MM"
        const endTime = rule.end_time.slice(0, 5)

        const windowStartUtc = localTimeToUtc(localDateStr, startTime, hostTimezone)
        const windowEndUtc = localTimeToUtc(localDateStr, endTime, hostTimezone)

        let slotStart = new Date(windowStartUtc)

        while (slotStart < windowEndUtc) {
          const slotEnd = new Date(slotStart.getTime() + rule.slot_duration_minutes * 60 * 1000)
          if (slotEnd > windowEndUtc) break

          // Only future slots beyond the 1-hour buffer
          if (slotStart > bufferEnd) {
            const isoStart = slotStart.toISOString()
            if (!bookedStartTimes.has(isoStart)) {
              slots.push({ start_time: isoStart, end_time: slotEnd.toISOString() })
            }
          }

          slotStart = slotEnd
        }
      }
    }

    // Advance to the next calendar day
    const [cy, cm, cday] = localDateStr.split('-').map(Number)
    const next = new Date(cy, cm - 1, cday + 1)
    const ny = next.getFullYear()
    const nm = String(next.getMonth() + 1).padStart(2, '0')
    const nd = String(next.getDate()).padStart(2, '0')
    localDateStr = `${ny}-${nm}-${nd}`
  }

  slots.sort((a, b) => a.start_time.localeCompare(b.start_time))
  return slots
}

/**
 * Formats a date/time in a specific timezone for display in emails.
 */
export function formatInTimezone(
  isoString: string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaults: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    ...options,
  }
  try {
    return new Intl.DateTimeFormat('en-US', {
      ...defaults,
      timeZone: timezone,
    }).format(new Date(isoString))
  } catch {
    // Fallback if timezone is invalid
    return new Intl.DateTimeFormat('en-US', defaults).format(new Date(isoString))
  }
}

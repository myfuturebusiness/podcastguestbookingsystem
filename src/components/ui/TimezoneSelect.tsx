'use client'

import { useState, useRef } from 'react'

// Full IANA timezone list with display labels
const ALL_TIMEZONES: { value: string; label: string }[] = [
  // Pacific
  { value: 'Pacific/Midway', label: 'Pacific/Midway (UTC-11:00)' },
  { value: 'Pacific/Niue', label: 'Pacific/Niue (UTC-11:00)' },
  { value: 'Pacific/Pago_Pago', label: 'Pacific/Pago_Pago — American Samoa (UTC-11:00)' },
  { value: 'Pacific/Honolulu', label: 'Pacific/Honolulu — Hawaii (UTC-10:00)' },
  { value: 'Pacific/Rarotonga', label: 'Pacific/Rarotonga — Cook Islands (UTC-10:00)' },
  { value: 'Pacific/Tahiti', label: 'Pacific/Tahiti — French Polynesia (UTC-10:00)' },
  { value: 'Pacific/Marquesas', label: 'Pacific/Marquesas (UTC-09:30)' },
  { value: 'America/Anchorage', label: 'America/Anchorage — Alaska (UTC-09:00)' },
  { value: 'America/Juneau', label: 'America/Juneau — Alaska (UTC-09:00)' },
  { value: 'Pacific/Gambier', label: 'Pacific/Gambier (UTC-09:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles — Pacific Time US (UTC-08:00)' },
  { value: 'America/Vancouver', label: 'America/Vancouver — Pacific Time Canada (UTC-08:00)' },
  { value: 'America/Tijuana', label: 'America/Tijuana — Baja California (UTC-08:00)' },
  { value: 'Pacific/Pitcairn', label: 'Pacific/Pitcairn (UTC-08:00)' },
  { value: 'America/Denver', label: 'America/Denver — Mountain Time US (UTC-07:00)' },
  { value: 'America/Phoenix', label: 'America/Phoenix — Arizona, no DST (UTC-07:00)' },
  { value: 'America/Edmonton', label: 'America/Edmonton — Mountain Time Canada (UTC-07:00)' },
  { value: 'America/Chihuahua', label: 'America/Chihuahua — Mexico (UTC-07:00)' },
  { value: 'America/Mazatlan', label: 'America/Mazatlan — Mexico (UTC-07:00)' },
  { value: 'America/Chicago', label: 'America/Chicago — Central Time US (UTC-06:00)' },
  { value: 'America/Winnipeg', label: 'America/Winnipeg — Central Time Canada (UTC-06:00)' },
  { value: 'America/Mexico_City', label: 'America/Mexico_City — Mexico City (UTC-06:00)' },
  { value: 'America/Costa_Rica', label: 'America/Costa_Rica (UTC-06:00)' },
  { value: 'America/Guatemala', label: 'America/Guatemala (UTC-06:00)' },
  { value: 'America/Tegucigalpa', label: 'America/Tegucigalpa — Honduras (UTC-06:00)' },
  { value: 'America/Regina', label: 'America/Regina — Saskatchewan (UTC-06:00)' },
  { value: 'America/New_York', label: 'America/New_York — Eastern Time US (UTC-05:00)' },
  { value: 'America/Toronto', label: 'America/Toronto — Eastern Time Canada (UTC-05:00)' },
  { value: 'America/Bogota', label: 'America/Bogota — Colombia (UTC-05:00)' },
  { value: 'America/Lima', label: 'America/Lima — Peru (UTC-05:00)' },
  { value: 'America/Panama', label: 'America/Panama (UTC-05:00)' },
  { value: 'America/Havana', label: 'America/Havana — Cuba (UTC-05:00)' },
  { value: 'America/Caracas', label: 'America/Caracas — Venezuela (UTC-04:00)' },
  { value: 'America/Halifax', label: 'America/Halifax — Atlantic Time Canada (UTC-04:00)' },
  { value: 'America/Santiago', label: 'America/Santiago — Chile (UTC-04:00)' },
  { value: 'America/La_Paz', label: 'America/La_Paz — Bolivia (UTC-04:00)' },
  { value: 'America/Manaus', label: 'America/Manaus — Amazon Time Brazil (UTC-04:00)' },
  { value: 'America/Guyana', label: 'America/Guyana (UTC-04:00)' },
  { value: 'America/Puerto_Rico', label: 'America/Puerto_Rico (UTC-04:00)' },
  { value: 'America/Barbados', label: 'America/Barbados (UTC-04:00)' },
  { value: 'America/St_Johns', label: 'America/St_Johns — Newfoundland (UTC-03:30)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo — Brazil (UTC-03:00)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'America/Argentina/Buenos_Aires (UTC-03:00)' },
  { value: 'America/Montevideo', label: 'America/Montevideo — Uruguay (UTC-03:00)' },
  { value: 'America/Cayenne', label: 'America/Cayenne — French Guiana (UTC-03:00)' },
  { value: 'America/Godthab', label: 'America/Godthab — Greenland (UTC-03:00)' },
  { value: 'Atlantic/South_Georgia', label: 'Atlantic/South_Georgia (UTC-02:00)' },
  { value: 'Atlantic/Azores', label: 'Atlantic/Azores — Portugal (UTC-01:00)' },
  { value: 'Atlantic/Cape_Verde', label: 'Atlantic/Cape_Verde (UTC-01:00)' },
  // UTC / Europe / Africa
  { value: 'UTC', label: 'UTC — Coordinated Universal Time (UTC+00:00)' },
  { value: 'Europe/London', label: 'Europe/London — United Kingdom (UTC+00:00)' },
  { value: 'Europe/Dublin', label: 'Europe/Dublin — Ireland (UTC+00:00)' },
  { value: 'Europe/Lisbon', label: 'Europe/Lisbon — Portugal (UTC+00:00)' },
  { value: 'Atlantic/Reykjavik', label: 'Atlantic/Reykjavik — Iceland (UTC+00:00)' },
  { value: 'Africa/Abidjan', label: 'Africa/Abidjan (UTC+00:00)' },
  { value: 'Africa/Accra', label: 'Africa/Accra — Ghana (UTC+00:00)' },
  { value: 'Africa/Casablanca', label: 'Africa/Casablanca — Morocco (UTC+00:00)' },
  { value: 'Europe/Paris', label: 'Europe/Paris — France (UTC+01:00)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin — Germany (UTC+01:00)' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid — Spain (UTC+01:00)' },
  { value: 'Europe/Rome', label: 'Europe/Rome — Italy (UTC+01:00)' },
  { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam — Netherlands (UTC+01:00)' },
  { value: 'Europe/Brussels', label: 'Europe/Brussels — Belgium (UTC+01:00)' },
  { value: 'Europe/Stockholm', label: 'Europe/Stockholm — Sweden (UTC+01:00)' },
  { value: 'Europe/Oslo', label: 'Europe/Oslo — Norway (UTC+01:00)' },
  { value: 'Europe/Copenhagen', label: 'Europe/Copenhagen — Denmark (UTC+01:00)' },
  { value: 'Europe/Warsaw', label: 'Europe/Warsaw — Poland (UTC+01:00)' },
  { value: 'Europe/Prague', label: 'Europe/Prague — Czech Republic (UTC+01:00)' },
  { value: 'Europe/Vienna', label: 'Europe/Vienna — Austria (UTC+01:00)' },
  { value: 'Europe/Zurich', label: 'Europe/Zurich — Switzerland (UTC+01:00)' },
  { value: 'Africa/Lagos', label: 'Africa/Lagos — Nigeria (UTC+01:00)' },
  { value: 'Africa/Tunis', label: 'Africa/Tunis — Tunisia (UTC+01:00)' },
  { value: 'Africa/Algiers', label: 'Africa/Algiers — Algeria (UTC+01:00)' },
  { value: 'Europe/Athens', label: 'Europe/Athens — Greece (UTC+02:00)' },
  { value: 'Europe/Helsinki', label: 'Europe/Helsinki — Finland (UTC+02:00)' },
  { value: 'Europe/Bucharest', label: 'Europe/Bucharest — Romania (UTC+02:00)' },
  { value: 'Europe/Sofia', label: 'Europe/Sofia — Bulgaria (UTC+02:00)' },
  { value: 'Europe/Kyiv', label: 'Europe/Kyiv — Ukraine (UTC+02:00)' },
  { value: 'Europe/Riga', label: 'Europe/Riga — Latvia (UTC+02:00)' },
  { value: 'Europe/Tallinn', label: 'Europe/Tallinn — Estonia (UTC+02:00)' },
  { value: 'Europe/Vilnius', label: 'Europe/Vilnius — Lithuania (UTC+02:00)' },
  { value: 'Asia/Jerusalem', label: 'Asia/Jerusalem — Israel (UTC+02:00)' },
  { value: 'Asia/Nicosia', label: 'Asia/Nicosia — Cyprus (UTC+02:00)' },
  { value: 'Africa/Cairo', label: 'Africa/Cairo — Egypt (UTC+02:00)' },
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg — South Africa (UTC+02:00)' },
  { value: 'Africa/Harare', label: 'Africa/Harare — Zimbabwe (UTC+02:00)' },
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi — Kenya (UTC+03:00)' },
  { value: 'Europe/Moscow', label: 'Europe/Moscow — Russia (UTC+03:00)' },
  { value: 'Europe/Istanbul', label: 'Europe/Istanbul — Turkey (UTC+03:00)' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh — Saudi Arabia (UTC+03:00)' },
  { value: 'Asia/Baghdad', label: 'Asia/Baghdad — Iraq (UTC+03:00)' },
  { value: 'Asia/Kuwait', label: 'Asia/Kuwait (UTC+03:00)' },
  { value: 'Asia/Qatar', label: 'Asia/Qatar (UTC+03:00)' },
  { value: 'Asia/Aden', label: 'Asia/Aden — Yemen (UTC+03:00)' },
  { value: 'Africa/Addis_Ababa', label: 'Africa/Addis_Ababa — Ethiopia (UTC+03:00)' },
  { value: 'Asia/Tehran', label: 'Asia/Tehran — Iran (UTC+03:30)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai — UAE (UTC+04:00)' },
  { value: 'Asia/Muscat', label: 'Asia/Muscat — Oman (UTC+04:00)' },
  { value: 'Asia/Baku', label: 'Asia/Baku — Azerbaijan (UTC+04:00)' },
  { value: 'Asia/Tbilisi', label: 'Asia/Tbilisi — Georgia (UTC+04:00)' },
  { value: 'Asia/Yerevan', label: 'Asia/Yerevan — Armenia (UTC+04:00)' },
  { value: 'Indian/Mauritius', label: 'Indian/Mauritius (UTC+04:00)' },
  { value: 'Indian/Reunion', label: 'Indian/Reunion (UTC+04:00)' },
  { value: 'Asia/Kabul', label: 'Asia/Kabul — Afghanistan (UTC+04:30)' },
  { value: 'Asia/Karachi', label: 'Asia/Karachi — Pakistan (UTC+05:00)' },
  { value: 'Asia/Tashkent', label: 'Asia/Tashkent — Uzbekistan (UTC+05:00)' },
  { value: 'Asia/Yekaterinburg', label: 'Asia/Yekaterinburg — Russia (UTC+05:00)' },
  { value: 'Indian/Maldives', label: 'Indian/Maldives (UTC+05:00)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata — India (UTC+05:30)' },
  { value: 'Asia/Colombo', label: 'Asia/Colombo — Sri Lanka (UTC+05:30)' },
  { value: 'Asia/Kathmandu', label: 'Asia/Kathmandu — Nepal (UTC+05:45)' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka — Bangladesh (UTC+06:00)' },
  { value: 'Asia/Almaty', label: 'Asia/Almaty — Kazakhstan (UTC+06:00)' },
  { value: 'Asia/Bishkek', label: 'Asia/Bishkek — Kyrgyzstan (UTC+06:00)' },
  { value: 'Indian/Chagos', label: 'Indian/Chagos (UTC+06:00)' },
  { value: 'Asia/Rangoon', label: 'Asia/Rangoon — Myanmar (UTC+06:30)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok — Thailand (UTC+07:00)' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh — Vietnam (UTC+07:00)' },
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta — Indonesia Western (UTC+07:00)' },
  { value: 'Asia/Phnom_Penh', label: 'Asia/Phnom_Penh — Cambodia (UTC+07:00)' },
  { value: 'Asia/Vientiane', label: 'Asia/Vientiane — Laos (UTC+07:00)' },
  { value: 'Asia/Krasnoyarsk', label: 'Asia/Krasnoyarsk — Russia (UTC+07:00)' },
  { value: 'Indian/Christmas', label: 'Indian/Christmas (UTC+07:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+08:00)' },
  { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala_Lumpur — Malaysia (UTC+08:00)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai — China (UTC+08:00)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (UTC+08:00)' },
  { value: 'Asia/Taipei', label: 'Asia/Taipei — Taiwan (UTC+08:00)' },
  { value: 'Asia/Manila', label: 'Asia/Manila — Philippines (UTC+08:00)' },
  { value: 'Asia/Makassar', label: 'Asia/Makassar — Indonesia Central (UTC+08:00)' },
  { value: 'Asia/Ulaanbaatar', label: 'Asia/Ulaanbaatar — Mongolia (UTC+08:00)' },
  { value: 'Asia/Perth', label: 'Asia/Perth — Western Australia (UTC+08:00)' },
  { value: 'Asia/Irkutsk', label: 'Asia/Irkutsk — Russia (UTC+08:00)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo — Japan (UTC+09:00)' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul — South Korea (UTC+09:00)' },
  { value: 'Asia/Yakutsk', label: 'Asia/Yakutsk — Russia (UTC+09:00)' },
  { value: 'Pacific/Palau', label: 'Pacific/Palau (UTC+09:00)' },
  { value: 'Asia/Jayapura', label: 'Asia/Jayapura — Indonesia Eastern (UTC+09:00)' },
  { value: 'Australia/Darwin', label: 'Australia/Darwin — Northern Territory (UTC+09:30)' },
  { value: 'Australia/Adelaide', label: 'Australia/Adelaide — South Australia (UTC+09:30)' },
  { value: 'Australia/Brisbane', label: 'Australia/Brisbane — Queensland (UTC+10:00)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney — New South Wales (UTC+10:00)' },
  { value: 'Australia/Melbourne', label: 'Australia/Melbourne — Victoria (UTC+10:00)' },
  { value: 'Australia/Hobart', label: 'Australia/Hobart — Tasmania (UTC+10:00)' },
  { value: 'Australia/Lord_Howe', label: 'Australia/Lord_Howe (UTC+10:30)' },
  { value: 'Pacific/Port_Moresby', label: 'Pacific/Port_Moresby — Papua New Guinea (UTC+10:00)' },
  { value: 'Pacific/Guam', label: 'Pacific/Guam (UTC+10:00)' },
  { value: 'Asia/Vladivostok', label: 'Asia/Vladivostok — Russia (UTC+10:00)' },
  { value: 'Pacific/Noumea', label: 'Pacific/Noumea — New Caledonia (UTC+11:00)' },
  { value: 'Pacific/Guadalcanal', label: 'Pacific/Guadalcanal — Solomon Islands (UTC+11:00)' },
  { value: 'Asia/Sakhalin', label: 'Asia/Sakhalin — Russia (UTC+11:00)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland — New Zealand (UTC+12:00)' },
  { value: 'Pacific/Fiji', label: 'Pacific/Fiji (UTC+12:00)' },
  { value: 'Asia/Kamchatka', label: 'Asia/Kamchatka — Russia (UTC+12:00)' },
  { value: 'Pacific/Tongatapu', label: 'Pacific/Tongatapu — Tonga (UTC+13:00)' },
  { value: 'Pacific/Apia', label: 'Pacific/Apia — Samoa (UTC+13:00)' },
]

interface Props {
  defaultValue: string
  name: string
}

export default function TimezoneSelect({ defaultValue, name }: Props) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = search.trim()
    ? ALL_TIMEZONES.filter((tz) =>
        tz.label.toLowerCase().includes(search.toLowerCase()) ||
        tz.value.toLowerCase().includes(search.toLowerCase())
      )
    : ALL_TIMEZONES

  const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by country, city, or timezone…"
        className={inputClass}
        autoComplete="off"
      />
      <select
        name={name}
        defaultValue={defaultValue}
        className={inputClass}
        size={1}
      >
        {filtered.length === 0 ? (
          <option disabled>No results — try a different search</option>
        ) : (
          filtered.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))
        )}
      </select>
      {search && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {' — '}
          <button
            type="button"
            onClick={() => { setSearch(''); inputRef.current?.focus() }}
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            clear
          </button>
        </p>
      )}
    </div>
  )
}

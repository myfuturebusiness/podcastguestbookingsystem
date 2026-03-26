'use client'

import { useState } from 'react'

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'

interface Props {
  categories: string[]
}

export default function CategorySelect({ categories }: Props) {
  const [value, setValue] = useState('')
  const isOther = value === 'Other'

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden input carries the final value for the server action */}
      {isOther && <input type="hidden" name="category" value="" />}

      <select
        id="category"
        name={isOther ? '_category_select' : 'category'}
        required={!isOther}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={inputClass}
      >
        <option value="">Select a category…</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
        <option value="Other">Other</option>
      </select>

      {isOther && (
        <input
          id="category_custom"
          name="category"
          type="text"
          required
          autoFocus
          placeholder="Enter your industry or category…"
          className={inputClass}
        />
      )}
    </div>
  )
}

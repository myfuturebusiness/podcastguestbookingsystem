'use client'

import { updateProfile } from './actions'
import SubmitButton from '@/components/ui/SubmitButton'

interface Props {
  profile: {
    full_name: string | null
    bio: string | null
    website_url: string | null
    social_links: {
      twitter?: string | null
      linkedin?: string | null
      instagram?: string | null
      facebook?: string | null
    } | null
  }
  email: string
  error?: string | null
  message?: string | null
}

export default function ProfileForm({ profile, email, error, message }: Props) {
  const social = profile.social_links ?? {}

  return (
    <form action={updateProfile} className="space-y-6 max-w-xl">
      {message && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-4 py-3 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-500 px-3 py-2 text-sm cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Email cannot be changed here.
        </p>
      </div>

      {/* Full name */}
      <div>
        <label
          htmlFor="full_name"
          className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
        >
          Full name <span className="text-red-500">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={profile.full_name ?? ''}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
        >
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile.bio ?? ''}
          placeholder="A short bio about yourself…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        />
      </div>

      {/* Website */}
      <div>
        <label
          htmlFor="website_url"
          className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
        >
          Website
        </label>
        <input
          id="website_url"
          name="website_url"
          type="url"
          defaultValue={profile.website_url ?? ''}
          placeholder="https://yourwebsite.com"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Social links */}
      <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1">
          Social links
        </legend>

        {[
          { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourname' },
          { id: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/yourhandle' },
          { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
          { id: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
        ].map(({ id, label, placeholder }) => (
          <div key={id}>
            <label
              htmlFor={id}
              className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400"
            >
              {label}
            </label>
            <input
              id={id}
              name={id}
              type="url"
              defaultValue={(social as Record<string, string | null | undefined>)[id] ?? ''}
              placeholder={placeholder}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}
      </fieldset>

      <div className="pt-2">
        <SubmitButton label="Save profile" loadingLabel="Saving…" />
      </div>
    </form>
  )
}

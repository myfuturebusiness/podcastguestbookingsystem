'use client'

import { useCallback, useRef } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { signUp } from './actions'
import SubmitButton from '@/components/ui/SubmitButton'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'

export default function SignUpForm({
  error,
  message,
}: {
  error?: string
  message?: string
}) {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!executeRecaptcha) return

      const form = e.currentTarget
      const token = await executeRecaptcha('signup')
      const formData = new FormData(form)
      formData.set('recaptcha_token', token)
      await signUp(formData)
    },
    [executeRecaptcha]
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-400 dark:border-gray-700 shadow p-8">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create your account</h1>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {message}
          </p>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              I am a…
            </label>
            <select
              id="role"
              name="role"
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a role</option>
              <option value="host">Host — I run a podcast</option>
              <option value="guest">Guest — I want to appear on podcasts</option>
            </select>
          </div>

          <SubmitButton label="Sign up" loadingLabel="Signing up…" />
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <a href="/auth/signin" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Sign in
          </a>
        </p>
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-600">
          Protected by reCAPTCHA —{' '}
          <a href="https://policies.google.com/privacy" className="underline hover:text-gray-500">Privacy</a>{' '}
          &{' '}
          <a href="https://policies.google.com/terms" className="underline hover:text-gray-500">Terms</a>
        </p>
      </div>
    </div>
  )
}

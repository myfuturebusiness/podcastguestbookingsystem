'use client'

import { forgotPassword } from './actions'
import SubmitButton from '@/components/ui/SubmitButton'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'

export default function ForgotPasswordForm({
  error,
  message,
}: {
  error?: string
  message?: string
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-400 dark:border-gray-700 shadow p-8">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Reset your password</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>

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

        <form action={forgotPassword} className="flex flex-col gap-4">
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

          <SubmitButton label="Send reset link" loadingLabel="Sending…" />
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <a href="/auth/signin" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  )
}

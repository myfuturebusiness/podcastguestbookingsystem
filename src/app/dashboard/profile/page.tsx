import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'
import ProfileForm from './ProfileForm'
import FormButton from '@/components/ui/FormButton'

async function signOut() {
  'use server'
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/auth/signin')
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { message?: string; error?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, bio, website_url, social_links, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/signin')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Nav */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <Logo compact />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ← Dashboard
          </Link>
          <form action={signOut}>
            <FormButton className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Sign out
            </FormButton>
          </form>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-1">Your Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          This information may be visible to hosts when you apply.
        </p>

        <ProfileForm
          profile={{
            full_name: profile.full_name,
            bio: profile.bio as string | null,
            website_url: profile.website_url as string | null,
            social_links: profile.social_links as {
              twitter?: string | null
              linkedin?: string | null
              instagram?: string | null
              facebook?: string | null
            } | null,
          }}
          email={user.email ?? ''}
          error={searchParams.error ?? null}
          message={searchParams.message ?? null}
        />
      </div>
    </div>
  )
}

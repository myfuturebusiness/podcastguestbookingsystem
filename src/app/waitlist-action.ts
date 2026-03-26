'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { fireWebhooks } from '@/lib/webhooks'

export async function joinWaitlist(
  _prev: { success?: boolean; error?: string },
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from('waitlist')
    .insert({ email, source: 'homepage' })

  if (error) {
    if (error.code === '23505') return { success: true } // already on list — treat as success
    return { error: 'Something went wrong. Please try again.' }
  }

  // Fire webhooks in background — don't block the response
  fireWebhooks('waitlist.signup', { email, source: 'homepage' }).catch(() => {})

  return { success: true }
}

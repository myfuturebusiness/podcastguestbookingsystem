'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function sendMessage(formData: FormData) {
  const bookingRequestId = formData.get('booking_request_id') as string
  const messageText = (formData.get('message_text') as string)?.trim()
  if (!messageText || !bookingRequestId) return

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const adminSupabase = createAdminClient()

  const { data: br } = await adminSupabase
    .from('booking_requests')
    .select('guest_id, podcasts(host_id)')
    .eq('id', bookingRequestId)
    .single()

  if (!br) return

  const podcastData = br.podcasts as unknown as { host_id: string }
  const isHost = podcastData?.host_id === user.id
  const isGuest = br.guest_id === user.id
  if (!isHost && !isGuest) return

  await adminSupabase.from('messages').insert({
    booking_request_id: bookingRequestId,
    sender_id: user.id,
    sender_role: isHost ? 'host' : 'guest',
    message_text: messageText.slice(0, 2000),
  })

  revalidatePath(`/dashboard/chat/${bookingRequestId}`)
}

export async function markMessagesRead(
  bookingRequestId: string,
  readerRole: 'host' | 'guest'
) {
  const adminSupabase = createAdminClient()
  const senderRole = readerRole === 'host' ? 'guest' : 'host'
  await adminSupabase
    .from('messages')
    .update({ is_read: true })
    .eq('booking_request_id', bookingRequestId)
    .eq('sender_role', senderRole)
    .eq('is_read', false)
}

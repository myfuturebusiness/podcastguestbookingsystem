import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'
import ChatMessages from './ChatMessages'
import ChatForm from './ChatForm'
import { markMessagesRead } from './actions'

function formatSlotShort(start: string) {
  return new Date(start).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function ChatPage({
  params,
}: {
  params: { bookingRequestId: string }
}) {
  const { bookingRequestId } = params

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const adminSupabase = createAdminClient()

  const { data: br } = await adminSupabase
    .from('booking_requests')
    .select('id, guest_id, status, slot_start_time, podcast_id, podcasts(title, host_id)')
    .eq('id', bookingRequestId)
    .single()

  if (!br) redirect('/dashboard')

  const podcastData = br.podcasts as unknown as { title: string; host_id: string }
  const isHost = podcastData.host_id === user.id
  const isGuest = br.guest_id === user.id
  if (!isHost && !isGuest) redirect('/dashboard')

  const myRole: 'host' | 'guest' = isHost ? 'host' : 'guest'

  // Fetch messages
  const { data: messages } = await adminSupabase
    .from('messages')
    .select('id, sender_id, sender_role, message_text, is_read, created_at')
    .eq('booking_request_id', bookingRequestId)
    .order('created_at', { ascending: true })

  // Fetch other party name
  let otherName = isHost ? 'Guest' : 'Host'
  if (isHost) {
    const { data: guestProfile } = await adminSupabase
      .from('profiles')
      .select('full_name')
      .eq('id', br.guest_id)
      .single()
    otherName = guestProfile?.full_name ?? 'Guest'
  } else {
    const { data: hostProfile } = await adminSupabase
      .from('profiles')
      .select('full_name')
      .eq('id', podcastData.host_id)
      .single()
    otherName = hostProfile?.full_name ?? 'Host'
  }

  // Mark incoming messages as read
  await markMessagesRead(bookingRequestId, myRole)

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Nav */}
      <nav className="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <Logo compact />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </nav>

      {/* Chat container */}
      <div className="flex-1 flex flex-col min-h-0 max-w-2xl w-full mx-auto px-0 sm:px-4 py-0 sm:py-6 gap-0">
        {/* Header */}
        <div className="shrink-0 bg-white dark:bg-gray-800 sm:rounded-t-2xl border-b border-gray-200 dark:border-gray-700 sm:border sm:border-b-0 px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-3 transition-colors"
          >
            ← Back to dashboard
          </Link>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                Chat with {otherName}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {podcastData.title}
                {br.slot_start_time && (
                  <> · {formatSlotShort(br.slot_start_time)}</>
                )}
              </p>
            </div>
            <span
              className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                br.status === 'approved'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                  : br.status === 'pending'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
              }`}
            >
              {br.status.charAt(0).toUpperCase() + br.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Messages + form */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 sm:rounded-b-2xl sm:border sm:border-t-0 border-gray-200 dark:border-gray-700 overflow-hidden">
          <ChatMessages
            messages={messages ?? []}
            myUserId={user.id}
            myRole={myRole}
            otherName={otherName}
          />
          <ChatForm bookingRequestId={bookingRequestId} />
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef } from 'react'

type Message = {
  id: string
  sender_id: string
  sender_role: string
  message_text: string
  is_read: boolean
  created_at: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChatMessages({
  messages,
  myUserId,
  myRole: _myRole, // eslint-disable-line @typescript-eslint/no-unused-vars
  otherName,
}: {
  messages: Message[]
  myUserId: string
  myRole: 'host' | 'guest'
  otherName: string
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          No messages yet. Start the conversation below.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
      {messages.map((msg) => {
        const isMe = msg.sender_id === myUserId
        return (
          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 px-1">
                {isMe ? 'You' : otherName}
              </span>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                }`}
              >
                {msg.message_text}
              </div>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 px-1">
                {formatTime(msg.created_at)}
              </span>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

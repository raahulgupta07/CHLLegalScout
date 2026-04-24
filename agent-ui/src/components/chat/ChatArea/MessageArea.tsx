'use client'

import { useStore } from '@/store'
import Messages from './Messages'
import ScrollToBottom from '@/components/chat/ChatArea/ScrollToBottom'
import { StickToBottom } from 'use-stick-to-bottom'
import { useState, useEffect } from 'react'

const SessionTag = () => {
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase())
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="flex justify-center pt-4 pb-2">
      <span className="inline-block bg-[#262622] text-[#feffd6] text-[10px] font-black uppercase tracking-[0.08em] px-4 py-1.5 font-brutalist">
        Legal Scout · {time}
      </span>
    </div>
  )
}

const MessageArea = () => {
  const { messages } = useStore()

  return (
    <StickToBottom
      className="relative mb-4 flex max-h-[calc(100vh-64px)] min-h-0 flex-grow flex-col"
      resize="smooth"
      initial="smooth"
    >
      <StickToBottom.Content className="flex min-h-full flex-col justify-center">
        <div className="mx-auto w-full max-w-full md:max-w-3xl lg:max-w-5xl space-y-9 px-4 pb-4">
          {messages.length > 0 && <SessionTag />}
          <Messages messages={messages} />
        </div>
      </StickToBottom.Content>
      <ScrollToBottom />
    </StickToBottom>
  )
}

export default MessageArea

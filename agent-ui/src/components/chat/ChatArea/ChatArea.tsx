'use client'

import ChatInput from './ChatInput'
import MessageArea from './MessageArea'
const ChatArea = () => {
  return (
    <main className="relative m-0 flex flex-grow flex-col bg-[#feffd6]">
      <MessageArea />
      <div className="sticky bottom-0 px-4 pb-0">
        <ChatInput />
        {/* Status bar — DASH style */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#383832] text-[#feffd6]/60 text-[9px] font-bold font-brutalist uppercase tracking-widest border-t-[2px] border-[#00fc40]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-[#00fc40]" />
            <span>System_Active</span>
          </div>
          <span>Powered by AI Agent</span>
          <span>Legal Scout · Myanmar</span>
        </div>
      </div>
    </main>
  )
}

export default ChatArea

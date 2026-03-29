'use client'
import Sidebar from '@/components/chat/Sidebar/Sidebar'
import { ChatArea } from '@/components/chat/ChatArea'
import { Suspense, useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Home() {
  const hasEnvToken = !!process.env.NEXT_PUBLIC_OS_SECURITY_KEY
  const envToken = process.env.NEXT_PUBLIC_OS_SECURITY_KEY || ''
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex h-screen bg-background/80">
        {/* Desktop Sidebar — always visible */}
        <div className="hidden md:block">
          <Sidebar hasEnvToken={hasEnvToken} envToken={envToken} />
        </div>

        {/* Mobile Sidebar — overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
            <div className="relative w-64 h-full bg-background">
              <Sidebar hasEnvToken={hasEnvToken} envToken={envToken} />
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header with menu toggle */}
          <div className="md:hidden flex items-center gap-3 px-3 py-2 border-b border-primary/10 bg-card shrink-0">
            <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-accent text-primary">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <span className="text-white font-bold text-[9px]">LS</span>
              </div>
              <span className="text-sm font-semibold text-primary">Legal Scout</span>
            </div>
          </div>

          <ChatArea />
        </div>
      </div>
    </Suspense>
  )
}

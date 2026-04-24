"use client"

import { Suspense, useState } from "react"
import DashboardSidebar from "./components/Sidebar"
import { Menu, X } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#f5f5e8]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Suspense fallback={<div className="w-64 bg-[#feffd6] border-r-[3px] border-[#383832]" />}>
          <DashboardSidebar />
        </Suspense>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 h-full">
            <Suspense fallback={<div className="w-64 h-full bg-[#feffd6]" />}>
              <DashboardSidebar />
            </Suspense>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-3 p-3 border-b-[3px] border-[#383832] bg-[#feffd6]">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 hover:bg-[#383832]/10">
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#383832]" /> : <Menu className="w-5 h-5 text-[#383832]" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#383832] flex items-center justify-center">
              <span className="text-[#feffd6] font-black text-[9px]">LS</span>
            </div>
            <span className="text-sm font-black text-[#383832] uppercase tracking-wider font-brutalist">Legal Scout</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

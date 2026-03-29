'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderOpen,
  Brain,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Mail,
  Shield,
  LogOut,
  Settings
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Documents', href: '/admin/documents', icon: <FileText className="w-5 h-5" /> },
  { name: 'Emails', href: '/admin/emails', icon: <Mail className="w-5 h-5" /> },
  { name: 'Templates', href: '/admin/templates', icon: <FolderOpen className="w-5 h-5" /> },
  { name: 'Companies', href: '/admin/companies', icon: <Users className="w-5 h-5" /> },
  { name: 'Knowledge', href: '/admin/knowledge', icon: <Brain className="w-5 h-5" /> },
  { name: 'Users', href: '/admin/users', icon: <Shield className="w-5 h-5" /> },
  { name: 'Settings', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [userRole, setUserRole] = useState("user")

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ls_user")
      if (raw) setUserRole(JSON.parse(raw).role || "user")
    } catch {}
  }, [])

  useEffect(() => {
    // Set active based on current path
    const currentPath = pathname || '/admin/dashboard'

    const path = currentPath.replace(/\/$/, '') // strip trailing slash
    if (path === '/admin/dashboard') setActiveTab('dashboard')
    else if (path === '/admin/documents') setActiveTab('documents')
    else if (path.startsWith('/admin/emails')) setActiveTab('emails')
    else if (path.startsWith('/admin/templates')) setActiveTab('templates')
    else if (path.startsWith('/admin/companies')) setActiveTab('companies')
    else if (path.startsWith('/admin/knowledge')) setActiveTab('knowledge')
    else if (path.startsWith('/admin/users')) setActiveTab('users')
    else if (path.startsWith('/admin/settings')) setActiveTab('settings')
  }, [pathname, searchParams])

  const isActive = (href: string) => {
    const tab = href.replace('/admin/', '')
    return activeTab === tab
  }

  return (
    <div className={`flex flex-col h-full bg-card border-r border-primary/10 ${collapsed ? 'w-20' : 'w-64'} transition-all duration-300`}>
      {/* Header - Logo */}
      <div className="flex items-center justify-between p-4 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">LS</span>
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-primary">Legal Scout</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-accent text-muted hover:text-primary transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Back to Chat */}
      <div className="p-3 border-b border-primary/10">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 transition-all shadow-lg"
        >
          <MessageCircle className="w-5 h-5" />
          {!collapsed && <span>Legal Scout</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
            Dashboard
          </div>
        )}
        {navItems.filter(item => {
          if (item.name === 'Users' || item.name === 'Settings') return userRole === 'admin'
          if (['Templates', 'Companies', 'Knowledge'].includes(item.name)) return userRole !== 'user'
          return true  // Dashboard, Documents visible to all
        }).map((item) => {
          const isItemActive = isActive(item.href)
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full ${
                isItemActive
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                  : 'text-muted hover:text-primary hover:bg-accent'
              }`}
            >
              {item.icon}
              {!collapsed && <span>{item.name}</span>}
            </button>
          )
        })}
      </nav>

      {/* Profile + Logout */}
      <div className="p-3 border-t border-primary/10">
        {!collapsed && (() => {
          let userName = "User"
          let userEmail = ""
          try {
            const raw = localStorage.getItem("ls_user")
            if (raw) { const u = JSON.parse(raw); userName = u.name || u.email?.split("@")[0] || "User"; userEmail = u.email || "" }
          } catch {}
          const badge = userRole === "admin" ? "bg-red-500/10 text-red-700" : userRole === "editor" ? "bg-blue-500/10 text-blue-700" : "bg-gray-100 text-gray-600"
          return (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{userName[0]?.toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-primary truncate">{userName}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase ${badge}`}>{userRole}</span>
              </div>
            </div>
          )
        })()}
        <button
          onClick={() => { localStorage.removeItem("ls_token"); localStorage.removeItem("ls_user"); window.location.href = "/login" }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-500/10 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}

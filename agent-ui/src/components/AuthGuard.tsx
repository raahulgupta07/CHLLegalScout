"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ShieldAlert } from "lucide-react"

interface UserInfo {
  id: number
  email: string
  name: string
  role: string  // "admin" | "editor" | "user"
}

function getUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem("ls_user")
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-50">
      <ShieldAlert className="w-12 h-12 text-red-500" />
      <h2 className="text-lg font-semibold text-gray-900">Access Denied</h2>
      <p className="text-sm text-gray-500 max-w-sm text-center">{message}</p>
      <a href="/" className="text-sm text-brand hover:underline">Go to Chat</a>
    </div>
  )
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(false)
  const [checking, setChecking] = useState(true)
  const [denied, setDenied] = useState("")
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem("ls_token")
    if (!token && pathname !== "/login" && pathname !== "/login/") {
      router.push("/login/")
      setChecking(false)
      return
    }
    if (!token) { setChecking(false); return }

    const user = getUser()
    const role = user?.role || "user"

    // Role-based access control
    // user: chat only (/ and /?agent=... pages)
    // editor: chat + admin dashboard (but NOT /admin/users)
    // admin: everything

    // Role access:
    // admin: everything
    // editor: everything except /admin/users
    // user: chat + dashboard + documents (NOT templates, companies, knowledge, users)
    const adminOnlyPages = ["/admin/users", "/admin/settings"]
    const editorPages = ["/admin/templates", "/admin/companies", "/admin/knowledge"]

    if (adminOnlyPages.some(p => pathname?.startsWith(p))) {
      if (role !== "admin") {
        setDenied("Only administrators can manage users.")
        setChecking(false)
        return
      }
    } else if (editorPages.some(p => pathname?.startsWith(p))) {
      if (role === "user") {
        setDenied("You need editor or admin access for this page. Contact your admin.")
        setChecking(false)
        return
      }
    }
    // Chat pages (/ and anything not /admin) — all roles allowed

    setIsAuth(true)
    setDenied("")
    setChecking(false)
  }, [pathname, router])

  if (pathname === "/login" || pathname === "/login/") return <>{children}</>
  if (checking) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  )
  if (denied) return <AccessDenied message={denied} />
  if (!isAuth) return null

  return <>{children}</>
}

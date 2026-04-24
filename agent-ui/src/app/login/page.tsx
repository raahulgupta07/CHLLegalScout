"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem("ls_remember_email")
    if (saved) {
      setEmail(saved)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "") + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || errData.error || `Login failed (${res.status})`)
      }
      const data = await res.json()
      if (data.success) {
        localStorage.setItem("ls_token", data.token)
        localStorage.setItem("ls_user", JSON.stringify(data.user))
        if (rememberMe) {
          localStorage.setItem("ls_remember_email", email)
        } else {
          localStorage.removeItem("ls_remember_email")
        }
        router.push("/")
      } else {
        setError(data.error || "AUTHENTICATION_FAILED")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "CONNECTION_ERROR")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="brutalist font-brutalist min-h-screen flex flex-col" style={{ background: "#feffd6" }}>

      {/* Top Header Bar */}
      <header
        className="w-full flex items-center justify-between px-6 py-3"
        style={{ borderBottom: "3px solid #383832" }}
      >
        <div
          className="px-3 py-1.5 font-black text-lg uppercase tracking-tighter"
          style={{ background: "#383832", color: "#feffd6" }}
        >
          LEGAL SCOUT
        </div>
        <div
          className="text-xs font-bold uppercase tracking-widest hidden md:block"
          style={{ color: "#383832" }}
        >
          SECURE_TERMINAL
        </div>
      </header>

      {/* Green accent line */}
      <div className="w-full h-1" style={{ background: "#007518" }} />

      {/* Main Content */}
      <main className="flex-1 flex items-center px-6 md:px-24 py-12">
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-start justify-between gap-12">

          {/* Left Side — Form */}
          <div className="w-full lg:w-1/2 max-w-xl">

            {/* Authentication Required Tag */}
            <div className="mb-4">
              <span className="tag-label">AUTHENTICATION_REQUIRED</span>
            </div>

            {/* ACCESS_PORTAL Title */}
            <h1
              className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-3"
              style={{ color: "#383832" }}
            >
              ACCESS_PORTAL
            </h1>

            {/* Green divider */}
            <div className="w-48 h-1 mb-3" style={{ background: "#007518" }} />

            {/* Subtitle */}
            <p
              className="text-sm font-bold uppercase tracking-wider mb-8"
              style={{ color: "#828179" }}
            >
              CITY HOLDINGS MYANMAR &mdash; LEGAL OPERATIONS
            </p>

            {/* Login Form Card */}
            <div className="ink-border stamp-shadow p-6 md:p-8" style={{ background: "#f6f4e9" }}>

              {/* Error */}
              {error && (
                <div
                  className="mb-5 p-3 font-bold text-sm uppercase tracking-wider"
                  style={{ background: "#be2d06", color: "white", border: "2px solid #383832" }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email / Operator ID */}
                <div>
                  <span className="tag-label mb-1">OPERATOR_ID</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter credentials"
                    className="w-full px-4 py-3 text-sm font-bold"
                    style={{
                      background: "white",
                      border: "2px solid #383832",
                      color: "#383832",
                      fontFamily: "var(--font-space-grotesk), sans-serif",
                    }}
                  />
                </div>

                {/* Password / Access Key */}
                <div>
                  <span className="tag-label mb-1">ACCESS_KEY</span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter access key"
                      className="w-full px-4 py-3 pr-20 text-sm font-bold"
                      style={{
                        background: "white",
                        border: "2px solid #383832",
                        color: "#383832",
                        fontFamily: "var(--font-space-grotesk), sans-serif",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-wider"
                      style={{ color: "#383832" }}
                    >
                      {showPassword ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: "#007518" }}
                  />
                  <label
                    htmlFor="remember"
                    className="text-xs font-bold uppercase tracking-wider cursor-pointer select-none"
                    style={{ color: "#65655e" }}
                  >
                    REMEMBER_OPERATOR
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-8 font-black text-sm uppercase tracking-wider stamp-press transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "#00fc40",
                    color: "#383832",
                    border: "2px solid #383832",
                    boxShadow: "4px 4px 0px 0px #383832",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <span
                        className="inline-block w-4 h-4 animate-spin"
                        style={{
                          border: "2px solid #383832",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                        }}
                      />
                      AUTHENTICATING...
                    </span>
                  ) : (
                    "INITIATE_AUTHENTICATION"
                  )}
                </button>
              </form>
            </div>

            {/* Status Bar */}
            <div
              className="mt-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest"
              style={{ color: "#828179", opacity: 0.5 }}
            >
              <span className="flex items-center gap-2">
                <span className="inline-block w-2 h-2" style={{ background: "#007518" }} />
                NODE_ACTIVE
              </span>
              <span>|</span>
              <span>AES-256</span>
              <span>|</span>
              <span>V1.0-STABLE</span>
            </div>
          </div>

          {/* Right Side — Decorative Text (desktop only) */}
          <div className="hidden lg:flex flex-col items-end justify-center lg:w-1/2 select-none" aria-hidden="true">
            <h2
              className="text-7xl xl:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-right"
              style={{ color: "#383832" }}
            >
              LEGAL
              <br />
              SCOUT
              <br />
              <span style={{ color: "#65655e" }}>MYANMAR</span>
            </h2>
            <div className="mt-6 flex items-center gap-4 text-right">
              <span
                className="text-xl font-black uppercase tracking-tighter"
                style={{ color: "#383832" }}
              >
                LEGAL AGENT
              </span>
              <span
                className="text-xl font-black uppercase tracking-tighter"
                style={{ color: "#007518" }}
              >
                V1.0
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="w-full flex items-center justify-between px-6 py-2"
        style={{ borderTop: "3px solid #383832", background: "#feffd6" }}
      >
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#828179", opacity: 0.4 }}
        >
          &copy; 2026 CITY HOLDINGS MYANMAR
        </span>
        <span
          className="text-xs font-bold uppercase tracking-widest hidden md:block"
          style={{ color: "#828179", opacity: 0.4 }}
        >
          SECURE_TERMINAL
        </span>
      </footer>
    </div>
  )
}

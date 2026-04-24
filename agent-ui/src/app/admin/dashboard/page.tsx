"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { FileText, Download, Eye, Clock, Trash2, History, BarChart3, FolderOpen, ArrowLeft, Plus, Upload, Sparkles, RefreshCw, Building, Edit2, X, Wifi, WifiOff, CheckCircle, AlertCircle, Loader2, Calendar, TrendingUp, Brain, Zap, FilePlus, UploadCloud, PlusCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import apiClient, { authFetch } from "@/lib/api-client"

function Toast({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`flex items-center gap-2 px-4 py-3 ink-border stamp-shadow font-brutalist ${
      type === 'success' ? 'bg-[#007518] text-white' : type === 'error' ? 'bg-[#be2d06] text-white' : 'bg-[#383832] text-[#feffd6]'
    }`}>
      {type === 'success' && <CheckCircle className="w-4 h-4" />}
      {type === 'error' && <AlertCircle className="w-4 h-4" />}
      {type === 'info' && <Loader2 className="w-4 h-4 animate-spin" />}
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80"><X className="w-4 h-4" /></button>
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  interface Document {
    id: string
    template_name: string
    company_name: string
    file_name: string
    download_url: string
    created_at: string
  }

  const [stats, setStats] = useState<any>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [templates, setTemplates] = useState<string[]>([])
  const [selectedTab, setSelectedTab] = useState<string>("dashboard")
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<any[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [toasts, setToasts] = useState<{id: number, message: string, type: string}[]>([])
  const toastIdRef = useRef(0)

  const showToast = (message: string, type: string = 'info') => {
    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const changeTab = (tab: string) => {
    setSelectedTab(tab)
    router.push(`/admin/dashboard?tab=${tab}`)
  }

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setSelectedTab(tab)
    fetchData()
  }, [searchParams])

  const fetchData = async () => {
    try {
      const res = await authFetch(apiClient.getDashboardData())
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setCompanies(data.companies || [])
      setTemplates(data.templates || [])
      setDocuments(data.documents || [])
      if (data.companies?.length || data.templates?.length) {
        setLastSyncTime(new Date())
      }
    } catch (e) {
      console.error("Dashboard load error:", e)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
    setLastSyncTime(new Date())
    showToast('Data refreshed', 'success')
  }

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="brutalist flex items-center justify-between px-4 py-3 border-b-[3px] border-[#383832] bg-[#feffd6] font-brutalist">
        <h1 className="text-lg font-black text-[#383832] uppercase tracking-wider">{selectedTab}</h1>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${isOnline ? 'text-[#007518]' : 'text-[#be2d06]'}`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? 'Connected' : 'Offline'}</span>
            </div>
            <span className="text-xs text-[#383832]/50 font-bold">
              {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
            </span>
            <button onClick={handleRefresh} className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-[#383832] hover:bg-[#383832]/10 uppercase tracking-wider cursor-pointer">
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {selectedTab === "dashboard" && (
            <div className="space-y-6">
              {/* Main Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#383832]"><FileText className="w-5 h-5 text-primary" /></div>
                    <div><p className="text-2xl font-black text-[#383832]">{documents.length}</p><p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">Total Documents</p></div>
                  </div>
                </div>
                <div className="border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#383832]"><FolderOpen className="w-5 h-5 text-[#feffd6]" /></div>
                    <div><p className="text-2xl font-black text-[#383832]">{templates.length}</p><p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">Templates</p></div>
                  </div>
                </div>
                <div className="border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#383832]"><Building className="w-5 h-5 text-[#feffd6]" /></div>
                    <div><p className="text-2xl font-black text-[#383832]">{companies.length}</p><p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">Companies</p></div>
                  </div>
                </div>
                <div className="border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOnline ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {isOnline ? <Wifi className="w-5 h-5 text-[#feffd6]" /> : <WifiOff className="w-5 h-5 text-red-500" />}
                    </div>
                    <div><p className="text-2xl font-black text-[#383832]">{isOnline ? 'Online' : 'Offline'}</p><p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">Status</p></div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/" className="flex items-center gap-3 border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#383832] transition-all group cursor-pointer">
                  <div className="p-2 bg-[#383832] group-hover:bg-[#007518] transition-colors">
                    <FilePlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#383832] uppercase tracking-wider">Create Document</p>
                    <p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">Generate via AI chat</p>
                  </div>
                </Link>
                <Link href="/admin/templates" className="flex items-center gap-3 border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#383832] transition-all group cursor-pointer">
                  <div className="p-2 bg-[#383832] group-hover:bg-[#007518] transition-colors">
                    <UploadCloud className="w-5 h-5 text-[#feffd6]" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#383832] uppercase tracking-wider">Upload Template</p>
                    <p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">Add Word templates</p>
                  </div>
                </Link>
                <Link href="/admin/companies" className="flex items-center gap-3 border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#383832] transition-all group cursor-pointer">
                  <div className="p-2 bg-[#383832] group-hover:bg-[#007518] transition-colors">
                    <PlusCircle className="w-5 h-5 text-[#feffd6]" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#383832] uppercase tracking-wider">Add Company</p>
                    <p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">Manage company data</p>
                  </div>
                </Link>
              </div>

              {/* Activity Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const now = new Date()
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                  const docsThisWeek = documents.filter((d: any) => d.created_at && new Date(d.created_at) > weekAgo).length
                  const docsThisMonth = documents.filter((d: any) => d.created_at && new Date(d.created_at) > thisMonth).length
                  return (
                    <>
                      <div className="border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#383832]"><Clock className="w-5 h-5 text-[#feffd6]" /></div>
                          <div><p className="text-2xl font-black text-[#383832]">{docsThisWeek}</p><p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">This Week</p></div>
                        </div>
                      </div>
                      <div className="border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#383832]"><Calendar className="w-5 h-5 text-[#feffd6]" /></div>
                          <div><p className="text-2xl font-black text-[#383832]">{docsThisMonth}</p><p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">This Month</p></div>
                        </div>
                      </div>
                      <div className="border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#383832]"><TrendingUp className="w-5 h-5 text-[#feffd6]" /></div>
                          <div><p className="text-2xl font-black text-[#383832]">{documents.length > 0 ? Math.round(documents.length / 7) : 0}</p><p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">Avg/Day</p></div>
                        </div>
                      </div>
                      <div className="border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#383832]"><Brain className="w-5 h-5 text-[#feffd6]" /></div>
                          <div><p className="text-2xl font-black text-[#383832]">{companies.length + templates.length}</p><p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">Knowledge Records</p></div>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Documents Over Time Chart */}
              <div className="border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist">
                <h3 className="text-sm font-black text-[#383832] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#feffd6]" />
                  Documents Generated (Last 14 Days)
                </h3>
                {(() => {
                  const now = new Date()
                  const days: { label: string; count: number }[] = []
                  for (let i = 13; i >= 0; i--) {
                    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
                    const dateStr = date.toISOString().split("T")[0]
                    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    const count = documents.filter((d: any) => d.created_at && d.created_at.startsWith(dateStr)).length
                    days.push({ label, count })
                  }
                  const maxCount = Math.max(...days.map(d => d.count), 1)
                  return (
                    <div className="flex items-end gap-1.5" style={{ height: "140px" }}>
                      {days.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                          <span className="text-[10px] text-muted font-medium">{day.count > 0 ? day.count : ""}</span>
                          <div
                            className="w-full bg-[#383832] transition-all hover:bg-[#007518]"
                            style={{
                              height: `${Math.max((day.count / maxCount) * 100, day.count > 0 ? 8 : 2)}%`,
                              minHeight: day.count > 0 ? "8px" : "2px",
                              opacity: day.count > 0 ? 1 : 0.2,
                            }}
                            title={`${day.label}: ${day.count} documents`}
                          />
                          <span className="text-[9px] text-muted whitespace-nowrap">{day.label}</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Last Activity & Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Most Used Template */}
                <div className="border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist">
                  <h3 className="text-sm font-black text-[#383832] uppercase tracking-wider mb-3">Most Used Template</h3>
                  {(() => {
                    const templateCounts: Record<string, number> = {}
                    documents.forEach((d: any) => {
                      const t = d.template_name || 'Unknown'
                      templateCounts[t] = (templateCounts[t] || 0) + 1
                    })
                    const mostUsed = Object.entries(templateCounts).sort((a, b) => b[1] - a[1])[0]
                    return mostUsed ? (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#383832]"><FileText className="w-5 h-5 text-[#feffd6]" /></div>
                        <div>
                          <p className="text-sm font-bold text-[#383832]">{mostUsed[0]}</p>
                          <p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">{mostUsed[1]} uses</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">No data yet</p>
                    )
                  })()}
                </div>

                {/* Most Active Company */}
                <div className="border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist">
                  <h3 className="text-sm font-black text-[#383832] uppercase tracking-wider mb-3">Most Active Company</h3>
                  {(() => {
                    const companyCounts: Record<string, number> = {}
                    documents.forEach((d: any) => {
                      const c = d.company_name ? d.company_name.split('\n')[0] : 'Unknown'
                      companyCounts[c] = (companyCounts[c] || 0) + 1
                    })
                    const mostActive = Object.entries(companyCounts).sort((a, b) => b[1] - a[1])[0]
                    return mostActive ? (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#383832]"><Building className="w-5 h-5 text-[#feffd6]" /></div>
                        <div>
                          <p className="text-sm font-bold text-[#383832]">{mostActive[0]}</p>
                          <p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">{mostActive[1]} documents</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">No data yet</p>
                    )
                  })()}
                </div>
              </div>

              {/* Training Status */}
              <div className="border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist">
                <h3 className="text-sm font-black text-[#383832] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#feffd6]" />
                  Training Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#383832]"><FolderOpen className="w-4 h-4 text-[#feffd6]" /></div>
                    <div>
                      <p className="text-sm font-bold text-[#383832]">Template Training</p>
                      <p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">Last trained: Not yet recorded</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#383832]"><Building className="w-4 h-4 text-[#feffd6]" /></div>
                    <div>
                      <p className="text-sm font-bold text-[#383832]">Company Sync</p>
                      <p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">Last synced: Not yet recorded</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Activity */}
              <div className="border-[2px] border-[#383832] bg-[#feffd6] p-4 stamp-shadow font-brutalist">
                <h3 className="text-sm font-black text-[#383832] uppercase tracking-wider mb-3">Last Activity</h3>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#383832]"><Clock className="w-5 h-5 text-[#feffd6]" /></div>
                  <div>
                    {documents.length > 0 && documents[0]?.created_at ? (
                      <>
                        <p className="text-sm font-bold text-[#383832]">
                          {documents[0]?.file_name?.substring(0, 40)}...
                        </p>
                        <p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">
                          {documents[0]?.company_name ? documents[0].company_name.split('\n')[0] : ''}
                          {documents[0]?.template_name ? ` - ${documents[0].template_name}` : ''}
                        </p>
                        <p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider mt-0.5">
                          {new Date(documents[0]?.created_at).toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === "companies" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black text-[#383832] uppercase tracking-wider">Companies ({companies.length})</h2>
              </div>
              <div className="grid gap-2">
                {companies.slice(0, 10).map((c: any, i: number) => (
                  <div key={i} className="p-3 border border-primary/10 bg-card rounded-lg">
                    <p className="text-sm font-bold text-[#383832]">{c.company_name}</p>
                    <p className="text-xs text-[#383832]/60 font-bold uppercase tracking-wider">{c.company_registration_number}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === "templates" && (
            <div>
              <h2 className="text-sm font-black text-[#383832] uppercase tracking-wider mb-4">Templates ({templates.length})</h2>
              <div className="grid gap-2">
                {templates.slice(0, 10).map((t: any, i: number) => (
                  <div key={i} className="p-3 border border-primary/10 bg-card rounded-lg">
                    <p className="text-sm font-bold text-[#383832]">{t.name || t}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === "documents" && (
            <div>
              <h2 className="text-sm font-black text-[#383832] uppercase tracking-wider mb-4">Generated Documents ({documents.length})</h2>
              <div className="border border-primary/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-card">
                      <tr className="text-left text-xs text-[#383832]/60 font-bold uppercase tracking-wider border-b border-primary/10">
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Document Name</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Company</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Template</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Created Date</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">User</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 font-medium text-center whitespace-nowrap">Preview</th>
                        <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/15">
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-muted text-sm">No documents generated yet</td>
                        </tr>
                      ) : (
                        documents.map((d: any, i: number) => (
                          <tr key={i} className="hover:bg-accent/50">
                            <td className="px-4 py-3">
                              <p className="text-sm font-bold text-[#383832] whitespace-nowrap">{d.file_name}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{d.company_name}</td>
                            <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{d.template_name}</td>
                            <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
                              {d.created_at ? new Date(d.created_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
                              {d.user_name || d.user || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-[#feffd6]">
                                Success
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button className="p-1.5 text-muted hover:text-primary hover:bg-accent rounded-lg" title="Preview">
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <a
                                href={d.download_url || `/documents/legal/output/${d.file_name}`}
                                download
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-black rounded-lg hover:bg-primary/80"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedTab === "generate" && (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-primary mb-2">Generate Document</h2>
              <p className="text-sm text-muted">Use the chat to generate documents</p>
              <Link href="/" className="inline-block mt-4 px-4 py-2 bg-primary text-black rounded-lg text-sm">Go to Chat</Link>
            </div>
          )}

          {selectedTab === "knowledge" && (
            <div className="text-center py-12">
              <h2 className="text-lg font-semibold text-primary mb-2">Knowledge Base</h2>
              <p className="text-sm text-muted">{companies.length} companies, {templates.length} templates indexed</p>
            </div>
          )}
        </div>

        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map(t => (
            <Toast key={t.id} message={t.message} type={t.type as any} onClose={() => removeToast(t.id)} />
          ))}
        </div>
      </div>
    )
  }

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <DashboardContent />
    </Suspense>
  )
}

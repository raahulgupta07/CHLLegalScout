"use client"

import { useEffect, useState } from "react"
import { Settings, Mail, Save, Send, CheckCircle, Loader2, Download, Eye, EyeOff, Trash2, Database, AlertTriangle, HardDrive, Activity, Brain, ExternalLink, BarChart3, Clock, User, FileText, Cloud, Upload } from "lucide-react"
import { authFetch } from "@/lib/api-client"
import { toast } from "sonner"

const API = process.env.NEXT_PUBLIC_API_URL || ""

const SMTP_PRESETS = [
  { name: "Gmail", host: "smtp.gmail.com", port: "587", notes: "Use App Password (not regular password). Enable 2FA first → Google Account → Security → App Passwords" },
  { name: "Outlook / Microsoft 365", host: "smtp.office365.com", port: "587", notes: "Use your Microsoft 365 email and password" },
  { name: "Yahoo", host: "smtp.mail.yahoo.com", port: "587", notes: "Generate App Password in Yahoo Account Settings" },
  { name: "Custom SMTP", host: "", port: "587", notes: "Enter your own SMTP server details" },
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [smtpHost, setSmtpHost] = useState("")
  const [smtpPort, setSmtpPort] = useState("587")
  const [smtpUser, setSmtpUser] = useState("")
  const [smtpPass, setSmtpPass] = useState("")
  const [smtpFrom, setSmtpFrom] = useState("")
  const [testEmail, setTestEmail] = useState("")
  const [lastUpdated, setLastUpdated] = useState("")
  const [healthLoading, setHealthLoading] = useState(false)
  const [healthData, setHealthData] = useState<any>(null)
  const [dbStats, setDbStats] = useState<any>(null)
  const [deleting, setDeleting] = useState("")
  const [restoring, setRestoring] = useState(false)
  const [restoreResult, setRestoreResult] = useState<any>(null)
  const [models, setModels] = useState<Record<string, string>>({})
  const [modelsLoading, setModelsLoading] = useState(true)
  const [modelsSaving, setModelsSaving] = useState(false)
  const [modelsEditing, setModelsEditing] = useState(false)
  const [apiKeyStatus, setApiKeyStatus] = useState<any>(null)
  const [testingModel, setTestingModel] = useState("")
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [s3, setS3] = useState({ enabled: false, bucket: "", region: "ap-southeast-1", access_key: "", secret_key: "", endpoint_url: "" })
  const [s3Saving, setS3Saving] = useState(false)
  const [s3Testing, setS3Testing] = useState(false)
  const [s3Syncing, setS3Syncing] = useState(false)
  const [s3Status, setS3Status] = useState("")
  const [validatingAll, setValidatingAll] = useState(false)
  const [modelTests, setModelTests] = useState<Record<string, { model: string; ok: boolean; msg: string; time: string }>>({})


  const [timezone, setTimezone] = useState("Asia/Yangon")
  const [tzDatetime, setTzDatetime] = useState("")
  const [tzSaving, setTzSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"models" | "email" | "system" | "activity">("models")
  const [activityData, setActivityData] = useState<any>(null)
  const [activityLoading, setActivityLoading] = useState(false)

  useEffect(() => { loadSettings(); loadModels(); loadTimezone(); loadS3() }, [])

  const loadS3 = async () => {
    try {
      const res = await authFetch(`${API}/api/admin/s3`)
      const data = await res.json()
      if (data.success && data.config) setS3(prev => ({ ...prev, ...data.config }))
    } catch {}
  }

  const loadTimezone = async () => {
    try {
      const res = await authFetch(`${API}/api/admin/timezone`)
      const data = await res.json()
      if (data.success) { setTimezone(data.timezone); setTzDatetime(data.current_datetime) }
    } catch {}
  }

  const saveTimezone = async () => {
    setTzSaving(true)
    try {
      const res = await authFetch(`${API}/api/admin/timezone`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      })
      const data = await res.json()
      if (data.success) { toast.success(`Timezone set to ${data.timezone}`); setTzDatetime(data.current_datetime) }
      else toast.error(data.error || "Invalid timezone")
    } catch { toast.error("Failed to save timezone") } finally { setTzSaving(false) }
  }

  const loadModels = async () => {
    try {
      const res = await authFetch(`${API}/api/admin/models`)
      const data = await res.json()
      if (data.success) setModels(data.models)
      // Also load API key status + model test results
      const kRes = await authFetch(`${API}/api/admin/api-keys`)
      const kData = await kRes.json()
      if (kData.success) setApiKeyStatus(kData.keys)
      const tRes = await authFetch(`${API}/api/admin/model-tests`)
      const tData = await tRes.json()
      if (tData.success) setModelTests(tData.tests || {})

    } catch {} finally { setModelsLoading(false) }
  }

  const saveModels = async () => {
    setModelsSaving(true)
    try {
      const res = await authFetch(`${API}/api/admin/models`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
      } else toast.error(data.error || "Save failed")
    } catch { toast.error("Failed to save models") } finally { setModelsSaving(false) }
  }

  const loadSettings = async () => {
    try {
      const res = await authFetch(`${API}/api/admin/settings`)
      const data = await res.json()
      if (data.success && data.settings) {
        const s = data.settings
        setSmtpHost(s.smtp_host?.value || "")
        setSmtpPort(s.smtp_port?.value || "587")
        setSmtpUser(s.smtp_user?.value || "")
        setSmtpPass(s.smtp_pass?.value || "")
        setSmtpFrom(s.smtp_from?.value || "")
        if (s.smtp_host?.updated_at) {
          setLastUpdated(new Date(s.smtp_host.updated_at).toLocaleString())
        }
      }
    } catch {} finally { setLoading(false) }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await authFetch(`${API}/api/admin/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_host: smtpHost, smtp_port: smtpPort,
          smtp_user: smtpUser, smtp_pass: smtpPass, smtp_from: smtpFrom,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Settings saved")
        setLastUpdated(new Date().toLocaleString())
      } else toast.error(data.error || "Save failed")
    } catch { toast.error("Failed to save") } finally { setSaving(false) }
  }

  const sendTestEmail = async () => {
    if (!testEmail) { toast.error("Enter a test email address"); return }
    setTesting(true)
    try {
      const res = await authFetch(`${API}/api/admin/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_email: testEmail }),
      })
      const data = await res.json()
      if (data.success) toast.success(data.message)
      else toast.error(data.error || "Test failed")
    } catch { toast.error("Failed to send test email") } finally { setTesting(false) }
  }

  const applyPreset = (preset: typeof SMTP_PRESETS[0]) => {
    setSmtpHost(preset.host)
    setSmtpPort(preset.port)
    toast.success(`Applied ${preset.name} preset`)
  }

  const handleBackup = async () => {
    try {
      const res = await authFetch(`${API}/api/admin/backup`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `legal_scout_backup_${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Backup downloaded")
    } catch { toast.error("Backup failed") }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>

  const tabs = [
    { id: "models" as const, label: "AI Models", icon: <Brain className="w-4 h-4" /> },
    { id: "email" as const, label: "Email", icon: <Mail className="w-4 h-4" /> },
    { id: "system" as const, label: "System", icon: <HardDrive className="w-4 h-4" /> },
    { id: "activity" as const, label: "Activity", icon: <BarChart3 className="w-4 h-4" /> },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary/10 bg-card">
        <h1 className="text-lg font-semibold text-primary">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-card px-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-brand text-brand"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="w-full">

          {/* ═══════════════ TAB: AI Models ═══════════════ */}
          {activeTab === "models" && (
          <>
          <div className="border border-gray-300 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-brand"/>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">AI Models</h2>
                  <p className="text-xs text-gray-500">LLM models used for each task — all via OpenRouter</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={async () => {
                  setValidatingAll(true)
                  const keys = Object.keys(models).filter(k => models[k])
                  const tests: Record<string,any> = {}
                  for(const k of keys){
                    try{const r=await authFetch(`${API}/api/admin/test-model`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:models[k],purpose:k==="embedding"?"embedding":"chat"})});const d=await r.json();tests[k]={model:models[k],ok:d.success,msg:d.message||d.error,time:new Date().toISOString()}}catch{tests[k]={model:models[k],ok:false,msg:"Failed",time:new Date().toISOString()}}
                  }
                  setModelTests(prev=>({...prev,...tests}))
                  const passed=Object.values(tests).filter((t:any)=>t.ok).length
                  toast[passed===keys.length?"success":"error"](`${passed}/${keys.length} models verified`)
                  setValidatingAll(false)
                }} disabled={validatingAll} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-green-300 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50">
                  {validatingAll?<Loader2 className="w-3 h-3 animate-spin"/>:<CheckCircle className="w-3 h-3"/>} Validate All
                </button>
                {!modelsEditing ? (
                  <button onClick={()=>setModelsEditing(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-100">
                    <Settings className="w-3 h-3"/> Edit
                  </button>
                ) : (
                  <>
                    <button onClick={async()=>{
                      setModelsSaving(true)
                      try{const r=await authFetch(`${API}/api/admin/models`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({models})});const d=await r.json();d.success?toast.success(d.message):toast.error(d.error)}catch{toast.error("Save failed")}finally{setModelsSaving(false);setModelsEditing(false)}
                    }} disabled={modelsSaving} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50">
                      {modelsSaving?<Loader2 className="w-3 h-3 animate-spin"/>:<Save className="w-3 h-3"/>} Save
                    </button>
                    <button onClick={()=>{setModelsEditing(false);loadModels()}} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
                  </>
                )}
              </div>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50"><tr className="text-xs font-medium text-gray-500">
                <th className="text-left px-4 py-2">Purpose</th>
                <th className="text-left px-4 py-2">Model</th>
                <th className="text-left px-4 py-2 w-20">Status</th>
                {modelsEditing && <th className="px-4 py-2 w-12"></th>}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  {key:"chat",label:"Chat Agent",desc:"Main conversation model"},
                  {key:"training",label:"Training & Analysis",desc:"Analyzes templates"},
                  {key:"classification",label:"Field Classification",desc:"Classifies fields"},
                  {key:"embedding",label:"Embeddings",desc:"Vector search"},
                ].map(({key,label})=>{
                  const test = modelTests[key]
                  return (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-sm text-gray-900">{label}</td>
                      <td className="px-4 py-2.5">{modelsEditing?(
                        <input value={models[key]||""} onChange={e=>setModels(p=>({...p,[key]:e.target.value}))} className="w-full px-2 py-1 text-sm border border-gray-300 rounded font-mono focus:outline-none focus:border-brand/50"/>
                      ):(<span className="text-sm font-mono text-gray-700">{models[key]||"—"}</span>)}</td>
                      <td className="px-4 py-2.5">{test&&<span title={test.msg} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${test.ok?"bg-green-50 text-green-600 border-green-200":"bg-red-50 text-red-600 border-red-200"}`}>{test.ok?"✓ Verified":"✗ Failed"}</span>}</td>
                      {modelsEditing&&<td className="px-4 py-2.5"><button onClick={async()=>{
                        if(!models[key])return;setTestingModel(key)
                        try{const r=await authFetch(`${API}/api/admin/test-model`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:models[key],purpose:key==="embedding"?"embedding":"chat"})});const d=await r.json();setModelTests(p=>({...p,[key]:{model:models[key],ok:d.success,msg:d.message||d.error,time:new Date().toISOString()}}))}catch{setModelTests(p=>({...p,[key]:{model:models[key],ok:false,msg:"Failed",time:new Date().toISOString()}}))}finally{setTestingModel("")}
                      }} disabled={testingModel===key} className="text-xs text-blue-600 hover:underline disabled:opacity-50">{testingModel===key?"...":"Test"}</button></td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {apiKeyStatus&&(<div className="px-4 py-3 border-t border-gray-200"><div className="flex gap-2">{Object.entries(apiKeyStatus).map(([name,info]:[string,any])=>(<div key={name} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border ${info.set?"bg-green-50 border-green-200 text-green-700":"bg-red-50 border-red-200 text-red-600"}`}><span className={`w-1.5 h-1.5 rounded-full ${info.set?"bg-green-500":"bg-red-400"}`}/>{name.replace("_API_KEY","").replace("_"," ")}:{info.hint}</div>))}</div></div>)}
          </div>

          {/* Timezone */}
          <div className="border border-gray-300 rounded-xl overflow-hidden mt-6">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand" />
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Timezone</h2>
                  <p className="text-xs text-gray-500">Used for document dates, activity logs, and agent responses</p>
                </div>
              </div>
              {tzDatetime && <span className="text-xs text-gray-500">{tzDatetime}</span>}
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <select value={timezone} onChange={e => setTimezone(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 font-mono w-64 focus:outline-none focus:border-brand/50 bg-white">
                  <optgroup label="Asia">
                    <option value="Asia/Yangon">Asia/Yangon (Myanmar)</option>
                    <option value="Asia/Singapore">Asia/Singapore</option>
                    <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (Malaysia)</option>
                    <option value="Asia/Bangkok">Asia/Bangkok (Thailand)</option>
                    <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (Vietnam)</option>
                    <option value="Asia/Jakarta">Asia/Jakarta (Indonesia)</option>
                    <option value="Asia/Manila">Asia/Manila (Philippines)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (India)</option>
                    <option value="Asia/Shanghai">Asia/Shanghai (China)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (Japan)</option>
                    <option value="Asia/Seoul">Asia/Seoul (Korea)</option>
                    <option value="Asia/Hong_Kong">Asia/Hong_Kong</option>
                    <option value="Asia/Taipei">Asia/Taipei (Taiwan)</option>
                    <option value="Asia/Dubai">Asia/Dubai (UAE)</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="UTC">UTC</option>
                    <option value="US/Eastern">US/Eastern</option>
                    <option value="US/Pacific">US/Pacific</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Australia/Sydney">Australia/Sydney</option>
                  </optgroup>
                </select>
                <button onClick={saveTimezone} disabled={tzSaving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50">
                  {tzSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
            </div>
          </div>
          </>
          )}

          {/* ═══════════════ TAB: Email ═══════════════ */}
          {activeTab === "email" && (
          <div className="border border-gray-300 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 bg-gray-50">
              <Mail className="w-5 h-5 text-brand" />
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Email Notifications (SMTP)</h2>
                <p className="text-xs text-gray-500">Configure email to receive notifications when documents are generated</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Provider Presets */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Quick Setup — Select Provider</label>
                <div className="flex flex-wrap gap-2">
                  {SMTP_PRESETS.map((preset) => (
                    <button key={preset.name} onClick={() => applyPreset(preset)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        smtpHost === preset.host
                          ? "bg-brand/10 border-brand/30 text-brand"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}>
                      {preset.name}
                    </button>
                  ))}
                </div>
                {SMTP_PRESETS.find(p => p.host === smtpHost)?.notes && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    💡 {SMTP_PRESETS.find(p => p.host === smtpHost)?.notes}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Host</label>
                  <input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
                  <input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="587"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand/50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email / Username</label>
                <input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="your-email@gmail.com" type="email"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand/50" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password / App Password</label>
                <div className="relative">
                  <input value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder="App password" type={showPassword ? "text" : "password"}
                    className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand/50" />
                  <button onClick={() => setShowPassword(!showPassword)} type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From Email (Display Name)</label>
                <input value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} placeholder="noreply@legalscout.com"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand/50" />
              </div>

              {lastUpdated && (
                <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-1.5">✓ Last saved: {lastUpdated}</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <button onClick={saveSettings} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? "Saving..." : "Save Settings"}
                </button>

                <div className="flex items-center gap-2">
                  <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@email.com" type="email"
                    className="px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 w-48 focus:outline-none focus:border-brand/50" />
                  <button onClick={sendTestEmail} disabled={testing || !smtpHost}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                    {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {testing ? "Sending..." : "Send Test"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          )}

          {/* ═══════════════ TAB: System ═══════════════ */}
          {activeTab === "system" && (
          <div className="space-y-6">
          <div className="border border-gray-300 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 bg-gray-50">
              <HardDrive className="w-5 h-5 text-brand" />
              <div>
                <h2 className="text-sm font-semibold text-gray-900">System Management</h2>
                <p className="text-xs text-gray-500">Backup, health check, and data management tools</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* System Health */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">System Health</label>
                <div className="flex items-center gap-3">
                  <button onClick={async () => {
                    setHealthLoading(true)
                    try {
                      const res = await fetch(`${API}/health`)
                      const data = await res.json()
                      setHealthData(data)
                      toast.success(`System ${data.status} — DB ${data.database?.status} (${data.database?.latency_ms}ms)`)
                    } catch { toast.error("Health check failed") } finally { setHealthLoading(false) }
                  }} disabled={healthLoading}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                    {healthLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                    Run Health Check
                  </button>
                  {healthData && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${healthData.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-gray-600">
                        {healthData.status} — DB {healthData.database?.latency_ms}ms — Uptime {Math.floor((healthData.uptime_seconds || 0) / 60)}m
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Database Stats */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Database</label>
                <div className="flex items-center gap-2">
                  <button onClick={async () => {
                    try {
                      const res = await authFetch(`${API}/api/dashboard/stats`)
                      const data = await res.json()
                      setDbStats(data)
                      toast.success("Stats loaded")
                    } catch { toast.error("Failed to load stats") }
                  }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Database className="w-3.5 h-3.5" /> Load Stats
                  </button>
                  {dbStats && (
                    <span className="text-xs text-gray-600">
                      {dbStats.templates || 0} templates, {dbStats.companies || 0} companies, {dbStats.documents || 0} documents, {dbStats.embeddings || 0} embeddings
                    </span>
                  )}
                </div>
              </div>

              {/* Backup & Restore */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Backup & Restore</label>
                <div className="flex flex-wrap items-start gap-3">
                  <button onClick={handleBackup}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Download className="w-3.5 h-3.5" /> Create & Download Backup
                  </button>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer">
                      {restoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                      {restoring ? "Restoring..." : "Restore from Backup"}
                      <input type="file" accept=".json" className="hidden" disabled={restoring} onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (!confirm(`Restore data from "${file.name}"? Existing data will NOT be deleted — backup data will be added.`)) {
                          e.target.value = ""
                          return
                        }
                        setRestoring(true)
                        setRestoreResult(null)
                        try {
                          const formData = new FormData()
                          formData.append("file", file)
                          const res = await authFetch(`${API}/api/admin/restore`, { method: "POST", body: formData })
                          const data = await res.json()
                          if (data.success) {
                            toast.success(data.message)
                            setRestoreResult(data.details)
                          } else {
                            toast.error(data.error || "Restore failed")
                          }
                        } catch { toast.error("Failed to restore") } finally {
                          setRestoring(false)
                          e.target.value = ""
                        }
                      }} />
                    </label>
                    {restoreResult && (
                      <div className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 space-y-0.5">
                        <p className="font-medium">Restored:</p>
                        {Object.entries(restoreResult).map(([table, count]) => (
                          <p key={table}>{table}: {count as number} records</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-red-200">
                <label className="block text-xs font-medium text-red-600 mb-2">Danger Zone</label>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700">These actions are irreversible. Create a backup first.</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={async () => {
                      if (!confirm("Delete ALL generated documents? This cannot be undone.")) return
                      setDeleting("documents")
                      try {
                        const res = await authFetch(`${API}/api/admin/reset/documents`, { method: "POST" })
                        const data = await res.json()
                        toast.success(data.message || "Documents deleted")
                      } catch { toast.error("Failed to delete documents") } finally { setDeleting("") }
                    }} disabled={!!deleting}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
                      {deleting === "documents" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete All Documents
                    </button>

                    <button onClick={async () => {
                      if (!confirm("Delete ALL companies? This cannot be undone.")) return
                      setDeleting("companies")
                      try {
                        const res = await authFetch(`${API}/api/admin/reset/companies`, { method: "POST" })
                        const data = await res.json()
                        toast.success(data.message || "Companies deleted")
                      } catch { toast.error("Failed to delete companies") } finally { setDeleting("") }
                    }} disabled={!!deleting}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
                      {deleting === "companies" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete All Companies
                    </button>

                    <button onClick={async () => {
                      if (!confirm("Delete all chat sessions, AI memory, and learnings? This cannot be undone.")) return
                      setDeleting("chat")
                      try {
                        const res = await authFetch(`${API}/api/admin/reset/chat`, { method: "POST" })
                        const data = await res.json()
                        toast.success(data.message || "Chat & memory cleared")
                      } catch { toast.error("Failed to clear chat") } finally { setDeleting("") }
                    }} disabled={!!deleting}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
                      {deleting === "chat" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Reset Chat & Memory
                    </button>

                    <button onClick={async () => {
                      if (!confirm("DELETE ALL DATA? Companies, documents, knowledge base, chat, memory — everything. This CANNOT be undone!")) return
                      if (!confirm("Are you REALLY sure? Type the button again to confirm.")) return
                      setDeleting("all")
                      try {
                        const res = await authFetch(`${API}/api/admin/reset/all`, { method: "POST" })
                        const data = await res.json()
                        toast.success(data.message || "All data deleted")
                      } catch { toast.error("Failed to reset") } finally { setDeleting("") }
                    }} disabled={!!deleting}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                      {deleting === "all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      Delete ALL Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Storage (S3) */}
          <div className="border border-gray-300 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-brand" />
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Cloud Storage (S3)</h2>
                  <p className="text-xs text-gray-500">Store templates, documents, and backups in S3-compatible storage</p>
                </div>
              </div>
              {s3.enabled && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Enabled</span>}
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-600">Enable S3</label>
                <button onClick={() => setS3(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`w-10 h-5 rounded-full transition-colors ${s3.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${s3.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {s3.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bucket Name</label>
                      <input value={s3.bucket} onChange={e => setS3(prev => ({ ...prev, bucket: e.target.value }))}
                        placeholder="my-legalscout-bucket"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-brand/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Region</label>
                      <input value={s3.region} onChange={e => setS3(prev => ({ ...prev, region: e.target.value }))}
                        placeholder="ap-southeast-1"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-brand/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Access Key</label>
                      <input value={s3.access_key} onChange={e => setS3(prev => ({ ...prev, access_key: e.target.value }))}
                        placeholder="AKIA..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-brand/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Secret Key</label>
                      <input value={s3.secret_key} onChange={e => setS3(prev => ({ ...prev, secret_key: e.target.value }))}
                        type="password" placeholder="****"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-brand/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Endpoint URL (optional — for MinIO, R2, B2)</label>
                    <input value={s3.endpoint_url} onChange={e => setS3(prev => ({ ...prev, endpoint_url: e.target.value }))}
                      placeholder="https://minio.example.com"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-brand/50" />
                  </div>

                  {s3Status && <p className={`text-xs ${s3Status.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{s3Status}</p>}

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    <button onClick={async () => {
                      setS3Saving(true)
                      try {
                        const res = await authFetch(`${API}/api/admin/s3`, {
                          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s3) })
                        const data = await res.json()
                        if (data.success) toast.success(data.message)
                        else toast.error(data.error)
                      } catch { toast.error("Save failed") } finally { setS3Saving(false) }
                    }} disabled={s3Saving}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50">
                      {s3Saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                    </button>

                    <button onClick={async () => {
                      setS3Testing(true); setS3Status("")
                      try {
                        // Save first, then test
                        await authFetch(`${API}/api/admin/s3`, {
                          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s3) })
                        const res = await authFetch(`${API}/api/admin/s3/test`, { method: "POST" })
                        const data = await res.json()
                        setS3Status(data.success ? `✓ ${data.message}` : `✗ ${data.error}`)
                      } catch { setS3Status("✗ Connection failed") } finally { setS3Testing(false) }
                    }} disabled={s3Testing}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                      {s3Testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />} Test Connection
                    </button>

                    <button onClick={async () => {
                      if (!confirm("Upload all local files to S3?")) return
                      setS3Syncing(true)
                      try {
                        const res = await authFetch(`${API}/api/admin/s3/sync`, { method: "POST" })
                        const data = await res.json()
                        if (data.success) toast.success(`Synced ${data.synced} files`)
                        else toast.error(data.error)
                      } catch { toast.error("Sync failed") } finally { setS3Syncing(false) }
                    }} disabled={s3Syncing}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                      {s3Syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Sync All to S3
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          </div>
          )}

          {/* ═══════════════ TAB: Activity ═══════════════ */}
          {activeTab === "activity" && (
          <div className="space-y-6">
            {/* Load button */}
            {!activityData && (
              <div className="flex items-center justify-center py-12">
                <button onClick={async () => {
                  setActivityLoading(true)
                  try {
                    const res = await authFetch(`${API}/api/admin/activity?days=30`)
                    const data = await res.json()
                    if (data.success) setActivityData(data)
                  } catch {} finally { setActivityLoading(false) }
                }} disabled={activityLoading}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50">
                  {activityLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                  {activityLoading ? "Loading..." : "Load Activity (Last 30 Days)"}
                </button>
              </div>
            )}

            {activityData && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-700">{activityData.summary?.total_events || 0}</p>
                    <p className="text-xs text-blue-500 mt-1">Total Events</p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                    <p className="text-2xl font-bold text-green-700">{Object.keys(activityData.summary?.by_user || {}).length}</p>
                    <p className="text-xs text-green-500 mt-1">Active Users</p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-center">
                    <p className="text-2xl font-bold text-purple-700">{activityData.summary?.by_action?.login || 0}</p>
                    <p className="text-xs text-purple-500 mt-1">Logins</p>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-center">
                    <p className="text-2xl font-bold text-orange-700">
                      {(activityData.summary?.by_action?.upload_template || 0) + (activityData.summary?.by_action?.add_company || 0)}
                    </p>
                    <p className="text-xs text-orange-500 mt-1">Uploads</p>
                  </div>
                </div>

                {/* Activity by Action — bar chart */}
                <div className="border border-gray-300 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900">Events by Type</h3>
                  </div>
                  <div className="p-5 space-y-2">
                    {Object.entries(activityData.summary?.by_action || {}).map(([action, count]: [string, any]) => {
                      const max = Math.max(...Object.values(activityData.summary?.by_action || {}) as number[])
                      const pct = max > 0 ? (count / max) * 100 : 0
                      const colors: Record<string, string> = {
                        login: "bg-blue-500", upload_template: "bg-green-500", add_company: "bg-purple-500",
                        reset_templates: "bg-red-500", reset_companies: "bg-red-400", update_models: "bg-orange-500",
                      }
                      return (
                        <div key={action} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-36 shrink-0 text-right">{action.replace(/_/g, " ")}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                            <div className={`h-full rounded-full ${colors[action] || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-700 w-8">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Activity Timeline — day chart */}
                {(activityData.summary?.by_day?.length || 0) > 0 && (
                  <div className="border border-gray-300 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-sm font-semibold text-gray-900">Daily Activity</h3>
                    </div>
                    <div className="p-5">
                      <div className="flex items-end gap-1 h-24">
                        {(activityData.summary?.by_day || []).map((d: any, i: number) => {
                          const max = Math.max(...(activityData.summary?.by_day || []).map((x: any) => x.count))
                          const h = max > 0 ? (d.count / max) * 100 : 0
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count} events`}>
                              <span className="text-[9px] text-gray-400">{d.count}</span>
                              <div className="w-full bg-brand/80 rounded-t" style={{ height: `${h}%`, minHeight: d.count > 0 ? "4px" : "0" }} />
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-gray-400">{activityData.summary?.by_day?.[0]?.date?.slice(5)}</span>
                        <span className="text-[9px] text-gray-400">{activityData.summary?.by_day?.slice(-1)[0]?.date?.slice(5)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Activity by Type */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Recent Templates */}
                  <div className="border border-gray-300 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-brand" />
                      <h3 className="text-xs font-semibold text-gray-900">Templates</h3>
                    </div>
                    <div className="p-3 space-y-2 max-h-48 overflow-auto">
                      {(activityData.recent?.templates || []).map((t: any, i: number) => (
                        <div key={i} className="text-xs space-y-0.5">
                          <p className="font-medium text-gray-800 truncate">{t.name}</p>
                          <p className="text-gray-400 flex items-center gap-1"><User className="w-3 h-3" />{t.uploaded_by}</p>
                        </div>
                      ))}
                      {(activityData.recent?.templates || []).length === 0 && <p className="text-xs text-gray-400">No templates</p>}
                    </div>
                  </div>

                  {/* Recent Companies */}
                  <div className="border border-gray-300 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-brand" />
                      <h3 className="text-xs font-semibold text-gray-900">Companies</h3>
                    </div>
                    <div className="p-3 space-y-2 max-h-48 overflow-auto">
                      {(activityData.recent?.companies || []).map((c: any, i: number) => (
                        <div key={i} className="text-xs space-y-0.5">
                          <p className="font-medium text-gray-800 truncate">{c.name}</p>
                          <p className="text-gray-400 flex items-center gap-1"><User className="w-3 h-3" />{c.created_by}</p>
                        </div>
                      ))}
                      {(activityData.recent?.companies || []).length === 0 && <p className="text-xs text-gray-400">No companies</p>}
                    </div>
                  </div>

                  {/* Recent Documents */}
                  <div className="border border-gray-300 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-brand" />
                      <h3 className="text-xs font-semibold text-gray-900">Documents</h3>
                    </div>
                    <div className="p-3 space-y-2 max-h-48 overflow-auto">
                      {(activityData.recent?.documents || []).map((d: any, i: number) => (
                        <div key={i} className="text-xs space-y-0.5">
                          <p className="font-medium text-gray-800 truncate">{d.file}</p>
                          <p className="text-gray-400 flex items-center gap-1"><User className="w-3 h-3" />{d.created_by}</p>
                        </div>
                      ))}
                      {(activityData.recent?.documents || []).length === 0 && <p className="text-xs text-gray-400">No documents</p>}
                    </div>
                  </div>
                </div>

                {/* Full Activity Log */}
                <div className="border border-gray-300 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Event Log</h3>
                    <button onClick={() => setActivityData(null)} className="text-xs text-gray-500 hover:text-gray-700">Refresh</button>
                  </div>
                  <div className="max-h-96 overflow-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Time</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">User</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Action</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(activityData.logs || []).map((log: any) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                              {log.time ? new Date(log.time).toLocaleString([], { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }) : "—"}
                            </td>
                            <td className="px-4 py-2 text-xs text-gray-700">{log.user}</td>
                            <td className="px-4 py-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                log.action === "login" ? "bg-blue-100 text-blue-700" :
                                log.action.startsWith("reset") ? "bg-red-100 text-red-700" :
                                log.action.startsWith("upload") ? "bg-green-100 text-green-700" :
                                log.action.startsWith("add") ? "bg-purple-100 text-purple-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {log.action.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-xs text-gray-500 max-w-xs truncate">{log.details}</td>
                          </tr>
                        ))}
                        {(activityData.logs || []).length === 0 && (
                          <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-400">No activity recorded yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* User Activity */}
                {Object.keys(activityData.summary?.by_user || {}).length > 0 && (
                  <div className="border border-gray-300 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-sm font-semibold text-gray-900">Activity by User</h3>
                    </div>
                    <div className="p-5 space-y-2">
                      {Object.entries(activityData.summary?.by_user || {}).map(([user, count]: [string, any]) => (
                        <div key={user} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-gray-700">
                            <User className="w-3.5 h-3.5 text-gray-400" /> {user}
                          </span>
                          <span className="text-xs font-medium text-gray-500">{count} events</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          )}

        </div>
      </div>
    </div>
  )
}

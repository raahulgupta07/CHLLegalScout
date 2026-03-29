"use client"

import { useEffect, useState } from "react"
import { Mail, Loader2, CheckCircle, XCircle, Paperclip, ChevronDown, ChevronUp, Send } from "lucide-react"
import { authFetch } from "@/lib/api-client"

const API = process.env.NEXT_PUBLIC_API_URL || ""

interface EmailLog {
  id: number
  to: string
  subject: string
  body: string
  attachment: string | null
  attachment_path: string | null
  sent_by: string
  status: string
  error: string | null
  time: string | null
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => { fetchEmails() }, [])

  const fetchEmails = async () => {
    try {
      const res = await authFetch(`${API}/api/admin/emails?limit=200`)
      const data = await res.json()
      if (data.success) setEmails(data.emails || [])
    } catch {} finally { setLoading(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-8 h-8 animate-spin text-brand" />
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-card">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-primary">Emails Sent</h1>
          <span className="text-xs text-muted bg-accent rounded-full px-2 py-0.5">{emails.length}</span>
        </div>
        <button onClick={() => { setLoading(true); fetchEmails() }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-300 rounded-lg hover:bg-accent">
          <Send className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted">
            <Mail className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No emails sent yet</p>
            <p className="text-xs mt-1">Emails sent from the chat will appear here</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-xs font-medium text-gray-500">
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">To</th>
                <th className="text-left px-4 py-3">Subject</th>
                <th className="text-left px-4 py-3">Attachment</th>
                <th className="text-left px-4 py-3">Sent By</th>
                <th className="text-left px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {emails.map(email => (
                <>
                  <tr
                    key={email.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                  >
                    <td className="px-4 py-3">
                      {email.status === "sent" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {email.time ? new Date(email.time).toLocaleString([], {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{email.to}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{email.subject || "—"}</td>
                    <td className="px-4 py-3">
                      {email.attachment ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <Paperclip className="w-3 h-3" /> {email.attachment}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{email.sent_by}</td>
                    <td className="px-4 py-3">
                      {expandedId === email.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </td>
                  </tr>
                  {/* Expanded Detail */}
                  {expandedId === email.id && (
                    <tr key={`${email.id}-detail`}>
                      <td colSpan={7} className="px-4 py-0">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-2 space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-xs font-medium text-gray-500">To:</span>
                              <p className="text-gray-900">{email.to}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Sent By:</span>
                              <p className="text-gray-900">{email.sent_by}</p>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Subject:</span>
                            <p className="text-sm text-gray-900">{email.subject || "—"}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Body:</span>
                            <div className="mt-1 p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                              {email.body || "No body content"}
                            </div>
                          </div>
                          {email.attachment && (
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{email.attachment}</span>
                              {email.attachment_path && (
                                <a href={`${API}${email.attachment_path}`} download
                                  className="text-xs text-blue-600 hover:underline ml-2">Download</a>
                              )}
                            </div>
                          )}
                          {email.error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <span className="text-xs font-medium text-red-600">Error:</span>
                              <p className="text-sm text-red-700 mt-1">{email.error}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

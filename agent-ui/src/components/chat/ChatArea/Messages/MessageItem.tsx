import Icon from '@/components/ui/icon'
import MarkdownRenderer from '@/components/ui/typography/MarkdownRenderer'
import { useStore } from '@/store'
import type { ChatMessage } from '@/types/os'
import Videos from './Multimedia/Videos'
import Images from './Multimedia/Images'
import Audios from './Multimedia/Audios'
import { memo, useState, useEffect } from 'react'
import AgentThinkingLoader from './AgentThinkingLoader'
import { DocumentCards } from '@/components/ui/DocumentViewer'
import { Button } from '@/components/ui/button'
import { Mail, Send, X, Paperclip, Loader2 } from 'lucide-react'
import { authFetch } from '@/lib/api-client'

interface MessageProps {
  message: ChatMessage
}

function extractDocuments(content: string): Array<{fileName: string, downloadUrl: string, previewUrl?: string}> {
  const documents = []
  
  const downloadUrlRegex = /Download URL:\s*(https?:\/\/[^\s]+)/gi
  const previewUrlRegex = /Preview URL:\s*(https?:\/\/[^\s]+)/gi
  const fileNameRegex = /(?:File|📄)\s*:\s*([^\n]+)/gi
  
  let downloadMatch
  let previewMatch
  let fileNameMatch
  
  const downloadUrls: string[] = []
  const previewUrls: string[] = []
  const fileNames: string[] = []
  
  while ((downloadMatch = downloadUrlRegex.exec(content)) !== null) {
    downloadUrls.push(downloadMatch[1])
  }
  
  while ((previewMatch = previewUrlRegex.exec(content)) !== null) {
    previewUrls.push(previewMatch[1])
  }
  
  while ((fileNameMatch = fileNameRegex.exec(content)) !== null) {
    fileNames.push(fileNameMatch[1].trim())
  }
  
  for (let i = 0; i < downloadUrls.length; i++) {
    const url = downloadUrls[i]
    const fileName = fileNames[i] || url.split('/').pop() || 'document.docx'
    const previewUrl = previewUrls[i]
    
    documents.push({
      fileName,
      downloadUrl: url,
      previewUrl
    })
  }
  
  return documents
}

interface Option {
  key: string
  label: string
}

function extractOptions(content: string): Option[] {
  // Check if message ends with "What would you like to do?" or similar follow-up phrases
  const hasFollowUpPhrase = /what would you like to do\?|what would you like\?|would you like to|what can i do for you/i.test(content)

  if (!hasFollowUpPhrase) {
    return []
  }

  // Extract options with pattern: a) text, b) text, c) text (each on separate line or inline)
  const lines = content.split('\n')
  const options: Option[] = []
  const optionPattern = /^([a-e])\)\s*(.+?)(?:\s*[b-e]\)|$)/i

  // Try multi-line detection first (each option on separate line)
  for (const line of lines) {
    const trimmed = line.trim()
    const match = trimmed.match(/^([a-e])\)\s*(.+)$/i)
    if (match) {
      const key = match[1].toLowerCase()
      const label = match[2].trim()
      if (label) {
        options.push({ key, label })
      }
    }
  }

  // If no multi-line options found, try inline detection (a) ... b) ... on same line)
  if (options.length === 0) {
    const inlinePattern = /([a-e])\)\s*([^a-e]+?)(?=\s*[b-e]\)|$)/gi
    let match
    while ((match = inlinePattern.exec(content)) !== null) {
      const key = match[1].toLowerCase()
      const label = match[2].trim()
      if (label && !label.match(/^[a-e]\)/)) {
        options.push({ key, label })
      }
    }
  }

  // Only return if we have 2-5 options (filter out noise)
  if (options.length >= 2 && options.length <= 5) {
    return options
  }

  return []
}

function removeButtonSection(content: string): string {
  // Remove the pattern: "a) ... b) ... What would you like to do?" from text
  const lines = content.split('\n')
  const result: string[] = []
  let skipNext = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip lines that are options (a), b), c), etc.)
    if (/^[a-e]\)\s*/.test(line)) {
      skipNext = true
      continue
    }

    // Skip "What would you like to do?" line
    if (/what would you like to do\?|what would you like\?/i.test(line)) {
      skipNext = false
      continue
    }

    // If we just skipped options, skip empty lines too
    if (skipNext && line === '') {
      continue
    }

    skipNext = false
    result.push(lines[i])
  }

  return result.join('\n').trim()
}

// Detect missing fields pattern from AI response
function extractMissingFields(content: string): string[] {
  const fields: string[] = []
  // Match patterns like "- company\n- director_name\n" or "company:\ndir_name:"
  const lines = content.split('\n')
  let inFieldSection = false

  for (const line of lines) {
    const trimmed = line.trim()
    // Detect start of field list
    if (/missing|need these|provide.*details|required|please.*provide/i.test(trimmed)) {
      inFieldSection = true
      continue
    }
    // Detect field lines: "- field_name" or "field_name:" or "• field_name"
    if (inFieldSection) {
      const match = trimmed.match(/^[-•*]\s*(.+?)(?:\s*:.*)?$/) || trimmed.match(/^([a-z_]+(?:\s*[a-z_]+)*)(?:\s*:)?\s*$/i)
      if (match) {
        const field = match[1].trim().replace(/:$/, '')
        // Filter out non-field lines
        if (field.length > 1 && field.length < 40 && !/already|database|have|send|format|like|what/i.test(field)) {
          fields.push(field)
        }
      }
      // Stop when hitting empty line or different section
      if (trimmed === '' && fields.length > 0) {
        // Check if next lines are still fields
        continue
      }
      if (/already|database|have:|if you/i.test(trimmed) && fields.length > 0) {
        break
      }
    }
  }
  return fields.length >= 2 ? fields : []
}

// Interactive form for missing fields
function MissingFieldsForm({ fields, onSubmit }: { fields: string[]; onSubmit: (values: Record<string, string>) => void }) {
  const [values, setValues] = useState<Record<string, string>>({})

  const handleSubmit = () => {
    // Build message with all field values
    const filled = Object.entries(values).filter(([_, v]) => v.trim())
    if (filled.length === 0) return
    onSubmit(values)
  }

  const formatLabel = (field: string) => {
    return field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <div className="mt-3 max-w-lg border border-gray-300 rounded-xl overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <p className="text-xs font-semibold text-gray-700">Fill Missing Information</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Complete the fields below and submit to generate</p>
      </div>
      <div className="p-4 space-y-2.5">
        {fields.map((field) => (
          <div key={field}>
            <label className="block text-[11px] font-medium text-gray-600 mb-0.5">{formatLabel(field)}</label>
            <input
              type={/date|birth/.test(field) ? 'date' : /email/.test(field) ? 'email' : /phone/.test(field) ? 'tel' : 'text'}
              placeholder={`Enter ${formatLabel(field).toLowerCase()}`}
              value={values[field] || ''}
              onChange={(e) => setValues(prev => ({ ...prev, [field]: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
            />
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
        <button
          onClick={handleSubmit}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
        >
          Submit & Generate
        </button>
      </div>
    </div>
  )
}

// Detect if message is about email sending — show composer form
function isEmailRelated(content: string): boolean {
  return /email.*not configured|smtp.*not.*configured|can't send.*email|couldn't send.*email|email isn't configured|set up.*smtp|configure.*smtp|send.*email.*to|recipient.*email|email.*address|email.*subject|email.*body|email.*message|I can send|I can email|send it.*email|attach.*document/i.test(content)
}

// Extract email address from message
function extractEmailAddress(content: string): string {
  const match = content.match(/[\w.-]+@[\w.-]+\.\w+/)
  return match ? match[0] : ""
}

// Extract document filename from message
function extractDocFilename(content: string): string {
  const match = content.match(/[\w_-]+\.docx/i)
  return match ? match[0] : ""
}

// Inline Email Composer shown in chat
function InlineEmailComposer({ defaultTo, defaultAttachment, onSent }: { defaultTo: string; defaultAttachment?: string; onSent: () => void }) {
  const [to, setTo] = useState(defaultTo)
  const [subject, setSubject] = useState(defaultAttachment ? `Document: ${defaultAttachment}` : "Document from Legal Scout")
  const [message, setMessage] = useState("")
  const [attachment, setAttachment] = useState(defaultAttachment || "")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [docs, setDocs] = useState<string[]>([])

  useEffect(() => {
    authFetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/dashboard/data`)
      .then(r => r.json())
      .then(data => setDocs((data.documents || []).slice(0, 10).map((d: any) => d.file_name)))
      .catch(() => {})
  }, [])

  if (sent) {
    return (
      <div className="mt-3 max-w-lg p-4 rounded-xl border border-green-300 bg-green-50 text-sm text-green-800 flex items-center gap-2">
        <Mail className="w-4 h-4" /> Email sent to {to}
      </div>
    )
  }

  const handleSend = async () => {
    if (!to) return
    setSending(true)
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/documents/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_email: to, subject, message: message || "Please find the attached document.",
          file_path: attachment ? `/documents/legal/output/${attachment}` : "",
        }),
      })
      const data = await res.json()
      if (data.success) { setSent(true); onSent() }
      else { alert(data.error || "Failed to send") }
    } catch { alert("Failed to send") }
    finally { setSending(false) }
  }

  return (
    <div className="mt-3 max-w-lg border-[2px] border-[#383832] overflow-hidden bg-[#feffd6] stamp-shadow">
      <div className="flex items-center justify-between px-4 py-2 bg-[#383832]">
        <div className="flex items-center gap-2 text-white">
          <Mail className="w-4 h-4" />
          <span className="text-xs font-semibold">Email</span>
        </div>
        <button onClick={handleSend} disabled={sending || !to}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white/20 text-white rounded-md hover:bg-white/30 disabled:opacity-50">
          {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        <div className="flex items-center px-4 py-1.5">
          <span className="text-[11px] text-gray-500 w-14">To:</span>
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="email@example.com" type="email"
            className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400" />
        </div>
        <div className="flex items-center px-4 py-1.5">
          <span className="text-[11px] text-gray-500 w-14">Subject:</span>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            className="flex-1 text-sm text-gray-900 outline-none" />
        </div>
        <div className="flex items-center px-4 py-1.5">
          <span className="text-[11px] text-gray-500 w-14 flex items-center gap-0.5"><Paperclip className="w-3 h-3" /></span>
          <select value={attachment} onChange={e => setAttachment(e.target.value)}
            className="flex-1 text-sm text-gray-900 outline-none bg-transparent">
            <option value="">No attachment</option>
            {docs.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="px-4 py-2">
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Write your message..." rows={3}
            className="w-full text-sm text-gray-900 outline-none resize-none placeholder:text-gray-400" />
        </div>
      </div>
    </div>
  )
}

function OptionButtons({ options, onSelect }: { options: Option[], onSelect: (key: string) => void }) {
  if (options.length === 0) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2 max-w-2xl font-brutalist">
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => onSelect(option.label)}
          className="inline-flex items-center gap-1.5 border-[2px] border-[#383832] border-r-[3px] border-b-[3px] bg-[#fffff0] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-[#383832]
                     hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#383832]
                     active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

const AgentMessage = ({ message }: MessageProps) => {
  const { streamingErrorMessage, setPendingMessage } = useStore()

  const documents = message.content ? extractDocuments(message.content) : []
  const options = message.content ? extractOptions(message.content) : []
  const missingFields = message.content ? extractMissingFields(message.content) : []
  const showEmailForm = message.content ? isEmailRelated(message.content) : false
  const emailTo = message.content ? extractEmailAddress(message.content) : ""
  const emailAttachment = message.content ? extractDocFilename(message.content) : ""

  const handleOptionSelect = (key: string) => {
    setPendingMessage(key)
  }

  const handleFieldsSubmit = (values: Record<string, string>) => {
    const lines = Object.entries(values)
      .filter(([_, v]) => v.trim())
      .map(([k, v]) => `${k}: ${v}`)
    if (lines.length > 0) {
      setPendingMessage("Use these values as custom_data and generate the document now:\n" + lines.join("\n"))
    }
  }

  // Remove button section from content if buttons will be rendered
  const displayContent = message.content && options.length > 0
    ? removeButtonSection(message.content)
    : message.content

  let messageContent
  if (message.streamingError) {
    messageContent = (
      <p className="text-destructive">
        Oops! Something went wrong while streaming.{' '}
        {streamingErrorMessage ? (
          <>{streamingErrorMessage}</>
        ) : (
          'Please try refreshing the page or try again later.'
        )}
      </p>
    )
  } else if (displayContent) {
    messageContent = (
      <div className="flex w-full flex-col gap-4">
        <MarkdownRenderer>{displayContent}</MarkdownRenderer>
        {showEmailForm ? (
          <InlineEmailComposer defaultTo={emailTo} defaultAttachment={emailAttachment} onSent={() => {}} />
        ) : missingFields.length > 0 ? (
          <MissingFieldsForm fields={missingFields} onSubmit={handleFieldsSubmit} />
        ) : null}
        {options.length > 0 && (
          <OptionButtons options={options} onSelect={handleOptionSelect} />
        )}
        {documents.length > 0 && (
          <DocumentCards documents={documents} />
        )}
        {message.videos && message.videos.length > 0 && (
          <Videos videos={message.videos} />
        )}
        {message.images && message.images.length > 0 && (
          <Images images={message.images} />
        )}
        {message.audio && message.audio.length > 0 && (
          <Audios audio={message.audio} />
        )}
      </div>
    )
  } else if (message.response_audio) {
    if (!message.response_audio.transcript) {
      return null
    } else {
      messageContent = (
        <div className="flex w-full flex-col gap-4">
          <MarkdownRenderer>
            {message.response_audio.transcript}
          </MarkdownRenderer>
          {message.response_audio.content && message.response_audio && (
            <Audios audio={[message.response_audio]} />
          )}
        </div>
      )
    }
  } else {
    // No content yet — return null so the answer box is hidden
    // (the CLI block in AgentMessageWrapper already shows the loading state)
    return null
  }

  return (
    <div className="font-brutalist text-[#383832]">
      {messageContent}
    </div>
  )
}

const UserMessage = memo(({ message }: MessageProps) => {
  return (
    <div className="flex items-start justify-end gap-3 pt-4 font-brutalist max-md:break-words">
      <div className="bg-[#262622] text-[#feffd6] px-5 py-3 max-w-[80%] border-[2px] border-[#383832] border-r-[4px] border-b-[4px]">
        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
      <div className="flex-shrink-0 mt-1">
        <div className="w-6 h-6 bg-[#262622] border border-[#e8e8d8]/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    </div>
  )
})

AgentMessage.displayName = 'AgentMessage'
UserMessage.displayName = 'UserMessage'
export { AgentMessage, UserMessage }

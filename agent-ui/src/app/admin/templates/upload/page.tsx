"use client"
import { authFetch } from "@/lib/api-client"

import { useState, useRef } from "react"
import { Upload, ArrowLeft, CheckCircle, XCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import apiClient from "@/lib/api-client"

interface UploadResult {
  success: boolean
  message: string
  template_name?: string
  fields?: string[]
}

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !files[0]) return

    const file = files[0]
    
    if (!file.name.endsWith(".docx")) {
      setResult({
        success: false,
        message: "Please upload a .docx file"
      })
      return
    }

    setUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await authFetch(apiClient.uploadTemplate(), {
        method: "POST",
        body: formData
      })
      
      const data = await res.json()
      
      if (data.success) {
        setResult({
          success: true,
          message: "Template uploaded successfully!",
          template_name: data.template_name,
          fields: data.fields
        })
        
        if (data.analyze) {
          setAnalyzing(true)
          await authFetch(apiClient.analyzeTemplate(), {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `name=${encodeURIComponent(data.template_name)}`
          })
          setAnalyzing(false)
        }
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to upload template"
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      setResult({
        success: false,
        message: "Failed to upload template"
      })
    } finally {
      setUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col h-full m-1.5 rounded-xl bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-400 dark:border-primary/15">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/templates"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="h-6 w-px bg-primary/15"></div>
          <h1 className="text-lg font-semibold">Upload Template</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Instructions */}
          <div className="border border-gray-400 dark:border-primary/15 bg-card rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-2">Upload a Word Document Template</h2>
            <p className="text-xs text-muted mb-4">
              Upload a .docx file with placeholders for document generation. 
              Supported formats: {"{{field}}"}, {"{field}"}, {"[field]"}
            </p>
          </div>

          {/* File Input - Visible for easy access */}
          <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/80"
            />
          </div>

          {/* Upload Button (alternative) */}
          <button
            onClick={triggerFileInput}
            disabled={uploading}
            className="w-full border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            {uploading ? (
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted">Uploading template...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-primary/10 rounded-full inline-block">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Click to select template file</p>
                  <p className="text-xs text-muted mt-1">Select a .docx file</p>
                </div>
              </div>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className={`border rounded-xl p-4 ${
              result.success 
                ? "border-green-500/30 bg-green-500/5" 
                : "border-red-500/30 bg-red-500/5"
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{result.message}</p>
                  {result.success && result.template_name && (
                    <p className="text-xs text-muted mt-1">
                      Template: {result.template_name}
                    </p>
                  )}
                  {analyzing && (
                    <div className="flex items-center gap-2 mt-2">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span className="text-xs text-muted">AI is analyzing template...</span>
                    </div>
                  )}
                  {result.success && result.fields && result.fields.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium">Fields detected ({result.fields.length}):</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.fields.slice(0, 10).map((field, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 bg-primary/10 rounded">
                            {field}
                          </span>
                        ))}
                        {result.fields.length > 10 && (
                          <span className="text-xs text-muted">+{result.fields.length - 10} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {result.success && (
                <div className="flex gap-2 mt-4">
                  <Link
                    href="/admin/templates"
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-primary text-black rounded-lg hover:bg-primary/80"
                  >
                    View Templates
                  </Link>
                  <button
                    onClick={() => {
                      setResult(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium border border-gray-400 dark:border-primary/15 rounded-lg hover:bg-accent"
                  >
                    Upload Another
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

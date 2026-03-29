"use client"

import { useEffect, useState } from "react"
import { Database, Table, ChevronDown, ChevronRight, Brain, FileText, Clock, CheckCircle, AlertCircle, RefreshCw, Users, FileCheck } from "lucide-react"
import { authFetch } from "@/lib/api-client"

interface TableInfo {
  name: string
  row_count: number
}

interface TrainingStats {
  total_templates: number
  trained_templates: number
  total_fields: number
  ai_trained: number
  last_trained: string | null
}

export default function KnowledgePage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<TrainingStats | null>(null)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

  useEffect(() => {
    fetchTables()
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/dashboard/templates`)
      const data = await res.json()
      const templates = data.templates || []
      
      const trained = templates.filter((t: any) => t.ai_trained).length
      const totalFields = templates.reduce((sum: number, t: any) => sum + (t.total_fields || 0), 0)
      
      setStats({
        total_templates: templates.length,
        trained_templates: trained,
        total_fields: totalFields,
        ai_trained: trained,
        last_trained: templates.length > 0 ? new Date().toLocaleString() : null
      })
    } catch (e) {
      console.error("Failed to fetch stats:", e)
    }
  }

  const fetchTables = async () => {
    try {
      const tablesData: TableInfo[] = [
        { name: 'templates', row_count: 0 },
        { name: 'knowledge_sources', row_count: 0 },
        { name: 'knowledge_vec', row_count: 0 },
        { name: 'knowledge_lookup', row_count: 0 },
        { name: 'knowledge_raw', row_count: 0 },
        { name: 'documents', row_count: 0 },
      ]
      
      for (const table of tablesData) {
        try {
          const res = await authFetch(`${API_BASE}/api/knowledge/table/${table.name}`)
          const data = await res.json()
          if (data.count !== undefined) {
            table.row_count = data.count
          }
        } catch (e) {
          console.log("Error fetching table:", table.name)
        }
      }
      
      setTables(tablesData)
    } catch (error) {
      console.error("Failed to fetch tables:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTableData = async (tableName: string) => {
    try {
      const res = await authFetch(`${API_BASE}/api/knowledge/table/${tableName}`)
      const data = await res.json()
      return data.data || []
    } catch (error) {
      console.error("Failed to fetch data:", error)
      return []
    }
  }

  const getTableIcon = (tableName: string) => {
    if (tableName === 'templates') return <FileText className="w-4 h-4 text-green-500" />
    if (tableName === 'documents') return <FileCheck className="w-4 h-4 text-blue-500" />
    if (tableName.includes('knowledge')) return <Brain className="w-4 h-4 text-purple-500" />
    return <Table className="w-4 h-4 text-blue-500" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-400 dark:border-primary/10 bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-primary">Knowledge Base</h1>
        </div>
        <button onClick={() => { fetchTables(); fetchStats(); }} className="flex items-center gap-2 px-3 py-2 text-xs font-medium border border-primary/10 rounded-lg hover:bg-accent">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        
        {/* Training Overview */}
        <div className="border border-primary/10 bg-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">AI Training Status</h2>
              <p className="text-xs text-muted">Overview of trained documents and knowledge</p>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-green-500" />
                  <h4 className="text-xs font-medium text-muted">Templates</h4>
                </div>
                <p className="text-2xl font-bold text-primary">{stats.total_templates}</p>
              </div>
              
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <h4 className="text-xs font-medium text-muted">Trained</h4>
                </div>
                <p className="text-2xl font-bold text-primary">{stats.trained_templates}</p>
              </div>
              
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-purple-500" />
                  <h4 className="text-xs font-medium text-muted">Total Fields</h4>
                </div>
                <p className="text-2xl font-bold text-primary">{stats.total_fields}</p>
              </div>
              
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <h4 className="text-xs font-medium text-muted">Last Trained</h4>
                </div>
                <p className="text-sm text-primary">{stats.last_trained || 'Never'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-primary/10 bg-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-primary mb-2">Training Data Stored</h3>
            <div className="space-y-1 text-xs text-muted">
              <p>• <span className="text-primary">templates</span> - Document templates with metadata</p>
              <p>• <span className="text-primary">knowledge_vec</span> - AI vector embeddings</p>
              <p>• <span className="text-primary">knowledge_lookup</span> - Company data index</p>
              <p>• <span className="text-primary">knowledge_raw</span> - Raw uploaded data</p>
            </div>
          </div>
          
          <div className="border border-primary/10 bg-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-primary mb-2">Training Fields</h3>
            <div className="space-y-1 text-xs text-muted">
              <p>• <span className="text-primary">purpose</span> - What document is for</p>
              <p>• <span className="text-primary">when_to_use</span> - Usage scenario</p>
              <p>• <span className="text-primary">how_to_use</span> - Step-by-step guide</p>
              <p>• <span className="text-primary">prerequisites</span> - Required documents</p>
              <p>• <span className="text-primary">+ 12 more fields...</span></p>
            </div>
          </div>
        </div>

        {/* Database Tables */}
        <div className="border border-primary/10 bg-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">Database Tables</h2>
              <p className="text-xs text-muted">View all stored knowledge data</p>
            </div>
          </div>

          <div className="space-y-2">
            {tables.map((table) => (
              <div key={table.name} className="border border-primary/10 rounded-lg overflow-hidden">
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/30"
                  onClick={async () => {
                    if (selectedTable === table.name) {
                      setSelectedTable(null)
                      setTableData([])
                    } else {
                      setSelectedTable(table.name)
                      const data = await fetchTableData(table.name)
                      setTableData(data)
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    {selectedTable === table.name ? (
                      <ChevronDown className="w-4 h-4 text-muted" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted" />
                    )}
                    {getTableIcon(table.name)}
                    <div>
                      <p className="text-sm font-medium text-primary">{table.name}</p>
                      <p className="text-xs text-muted">{table.row_count} rows</p>
                    </div>
                  </div>
                  {table.row_count > 0 && (
                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded">
                      Active
                    </span>
                  )}
                </div>
                
                {selectedTable === table.name && (
                  <div className="border-t border-primary/10 p-3 bg-muted/20 max-h-80 overflow-auto">
                    {tableData.length === 0 ? (
                      <div className="text-center py-4 text-muted text-xs">No data in this table</div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-primary/10">
                            {Object.keys(tableData[0] || {}).filter(k => k !== 'id').slice(0, 6).map((key) => (
                              <th key={key} className="text-left px-2 py-1 text-muted font-medium">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.slice(0, 10).map((row, idx) => (
                            <tr key={idx} className="border-b border-primary/5">
                              {Object.entries(row).filter(([k]) => k !== 'id').slice(0, 6).map(([key, value], i) => (
                                <td key={i} className="px-2 py-1 truncate max-w-32">
                                  {typeof value === 'object' ? JSON.stringify(value)?.slice(0, 30) : String(value)?.slice(0, 30)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Storage Info */}
        <div className="border border-primary/10 bg-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-primary mb-3">Where Data is Stored</h3>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-muted/20 rounded-lg">
              <h4 className="text-muted mb-1">PostgreSQL (scout-db)</h4>
              <p className="text-white">Port: 5433</p>
              <p className="text-muted">All tables above</p>
            </div>
            <div className="p-3 bg-muted/20 rounded-lg">
              <h4 className="text-muted mb-1">Templates</h4>
              <p className="text-white">/documents/legal/templates/</p>
              <p className="text-muted">.docx files</p>
            </div>
            <div className="p-3 bg-muted/20 rounded-lg">
              <h4 className="text-muted mb-1">Generated Docs</h4>
              <p className="text-white">/documents/legal/output/</p>
              <p className="text-muted">.docx output files</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"
import { authFetch } from "@/lib/api-client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, X } from "lucide-react"

interface User {
  id: number
  email: string
  name: string
  role: string
  status: string
  created_at: string
}

interface ActivityLog {
  id: number
  user_email: string
  action: string
  details: string
  timestamp: string
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/admin`

function getHeaders() {
  const token = localStorage.getItem("ls_token")
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogs, setShowLogs] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "user",
  })

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/users`, { headers: getHeaders() })
      const data = await res.json()
      if (Array.isArray(data)) setUsers(data)
      else if (data.users) setUsers(data.users)
    } catch {
      setError("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/activity-logs`, { headers: getHeaders() })
      const data = await res.json()
      if (Array.isArray(data)) setLogs(data)
      else if (data.logs) setLogs(data.logs)
    } catch {
      console.error("Failed to fetch logs")
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({ email: "", name: "", password: "", role: "user" })
    setError("")
    setShowModal(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({ email: user.email, name: user.name, password: "", role: user.role })
    setError("")
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      if (editingUser) {
        const body: Record<string, string> = { name: formData.name, role: formData.role }
        if (formData.password) body.password = formData.password
        const res = await authFetch(`${API_BASE}/users/${editingUser.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.detail || data.error || "Update failed"); return }
      } else {
        const res = await authFetch(`${API_BASE}/users`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.detail || data.error || "Create failed"); return }
      }
      setShowModal(false)
      fetchUsers()
    } catch {
      setError("Request failed")
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user "${user.name}" (${user.email})?`)) return
    try {
      await authFetch(`${API_BASE}/users/${user.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      })
      fetchUsers()
    } catch {
      setError("Delete failed")
    }
  }

  const handleToggleLogs = () => {
    if (!showLogs) fetchLogs()
    setShowLogs(!showLogs)
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const formatTimestamp = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-orange-100 text-orange-700 border-orange-200"
      case "editor": return "bg-blue-100 text-blue-700 border-blue-200"
      default: return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-red-100 text-red-700 border-red-200"
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Users</h1>
            <p className="text-sm text-muted mt-1">Manage user accounts and permissions</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-medium hover:from-orange-600 hover:to-red-700 transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Create User
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-card border border-primary/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10 bg-accent/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted">
                    No users found. Create one to get started.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-primary/5 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-primary font-medium">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-primary">{user.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(user.status || "active")}`}>
                        {user.status || "active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 rounded-lg hover:bg-accent text-muted hover:text-primary transition-colors"
                          title="Edit user"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 rounded-lg hover:bg-red-50 text-muted hover:text-red-600 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Activity Logs Section */}
        <div className="mt-6 bg-card border border-primary/10 rounded-2xl overflow-hidden">
          <button
            onClick={handleToggleLogs}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold text-primary hover:bg-accent/30 transition-colors"
          >
            {showLogs ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Activity Logs
          </button>
          {showLogs && (
            <div className="border-t border-primary/10">
              {logs.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted">No activity logs found.</div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary/10 bg-accent/50">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">Time</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">User</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">Action</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b border-primary/5">
                          <td className="px-4 py-2 text-xs text-muted whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                          <td className="px-4 py-2 text-xs text-primary">{log.user_email}</td>
                          <td className="px-4 py-2 text-xs text-primary font-medium">{log.action}</td>
                          <td className="px-4 py-2 text-xs text-muted">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingUser ? "Edit User" : "Create User"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Full name"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password{editingUser && " (leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  placeholder={editingUser ? "Leave blank to keep current" : "Set a password"}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                >
                  <option value="user">User</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-lg"
                >
                  {editingUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { Button } from '@/components/ui/button'
import { ModeSelector } from '@/components/chat/Sidebar/ModeSelector'
import { EntitySelector } from '@/components/chat/Sidebar/EntitySelector'
import useChatActions from '@/hooks/useChatActions'
import { useStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/icon'
import { getProviderIcon } from '@/lib/modelProvider'
import Sessions from './Sessions'
import AuthToken from './AuthToken'
import { isValidUrl } from '@/lib/utils'
import { toast } from 'sonner'
import { useQueryState } from 'nuqs'
import { truncateText } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

const ENDPOINT_PLACEHOLDER = 'NO ENDPOINT ADDED'
const SidebarHeader = () => (
    <div className="flex items-center gap-2">
    <div className="w-6 h-6 bg-[#383832] flex items-center justify-center shrink-0">
      <span className="text-[#feffd6] font-black text-[10px]">LS</span>
    </div>
    <span className="text-xs font-black uppercase text-[#383832] tracking-wider font-brutalist">Legal Scout</span>
  </div>
)

const NewChatButton = ({
  disabled,
  onClick
}: {
  disabled: boolean
  onClick: () => void
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    size="lg"
    className="h-9 w-full border-[2px] border-[#383832] bg-[#00fc40] text-xs font-black text-[#383832] uppercase tracking-wider hover:bg-[#00e639] font-brutalist cursor-pointer"
  >
    <Icon type="plus-icon" size="xs" className="text-background" />
    <span className="uppercase">New Chat</span>
  </Button>
)

const ModelDisplay = ({ model }: { model: string }) => (
  <div className="flex h-9 w-full items-center gap-3 rounded-xl border border-primary/10 bg-accent p-3 text-xs font-medium uppercase text-muted">
    {(() => {
      const icon = getProviderIcon(model)
      return icon ? <Icon type={icon} className="shrink-0" size="xs" /> : null
    })()}
    {model}
  </div>
)

const Endpoint = () => {
  const {
    selectedEndpoint,
    isEndpointActive,
    setSelectedEndpoint,
    setAgents,
    setSessionsData,
    setMessages
  } = useStore()
  const { initialize } = useChatActions()
  const [isEditing, setIsEditing] = useState(false)
  const [endpointValue, setEndpointValue] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [, setAgentId] = useQueryState('agent')
  const [, setSessionId] = useQueryState('session')

  useEffect(() => {
    setEndpointValue(selectedEndpoint)
    setIsMounted(true)
  }, [selectedEndpoint])

  const getStatusColor = (isActive: boolean) =>
    isActive ? 'bg-positive' : 'bg-destructive'

  const handleSave = async () => {
    if (!isValidUrl(endpointValue)) {
      toast.error('Please enter a valid URL')
      return
    }
    const cleanEndpoint = endpointValue.replace(/\/$/, '').trim()
    setSelectedEndpoint(cleanEndpoint)
    setAgentId(null)
    setSessionId(null)
    setIsEditing(false)
    setIsHovering(false)
    setAgents([])
    setSessionsData([])
    setMessages([])
  }

  const handleCancel = () => {
    setEndpointValue(selectedEndpoint)
    setIsEditing(false)
    setIsHovering(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleRefresh = async () => {
    setIsRotating(true)
    await initialize()
    setTimeout(() => setIsRotating(false), 500)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="text-xs font-medium uppercase text-primary">Legal Scout</div>
      {isEditing ? (
        <div className="flex w-full items-center gap-1">
          <input
            type="text"
            value={endpointValue}
            onChange={(e) => setEndpointValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex h-9 w-full items-center text-ellipsis rounded-xl border border-primary/10 bg-accent p-3 text-xs font-medium text-muted"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className="hover:cursor-pointer hover:bg-transparent"
          >
            <Icon type="save" size="xs" />
          </Button>
        </div>
      ) : (
        <div className="flex w-full items-center gap-1">
          <motion.div
            className="relative flex h-9 w-full cursor-pointer items-center justify-between rounded-xl border border-primary/10 bg-accent p-3 uppercase"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => setIsEditing(true)}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <AnimatePresence mode="wait">
              {isHovering ? (
                <motion.div
                  key="endpoint-display-hover"
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-primary">
                    <Icon type="edit" size="xxs" /> EDIT AGENTOS
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="endpoint-display"
                  className="absolute inset-0 flex items-center justify-between px-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs font-medium text-muted">
                    {isMounted
                      ? truncateText(selectedEndpoint, 21) ||
                        ENDPOINT_PLACEHOLDER
                      : 'Loading...'}
                  </p>
                  <div
                    className={`size-2 shrink-0 rounded-full ${getStatusColor(isEndpointActive)}`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="hover:cursor-pointer hover:bg-transparent"
          >
            <motion.div
              key={isRotating ? 'rotating' : 'idle'}
              animate={{ rotate: isRotating ? 360 : 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <Icon type="refresh" size="xs" />
            </motion.div>
          </Button>
        </div>
      )}
    </div>
  )
}

const Sidebar = ({
  hasEnvToken,
  envToken
}: {
  hasEnvToken?: boolean
  envToken?: string
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showDevConfig, setShowDevConfig] = useState(false)
  const [userRole, setUserRole] = useState("user")

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ls_user")
      if (raw) setUserRole(JSON.parse(raw).role || "user")
    } catch {}
  }, [])
  const { clearChat, focusChatInput, initialize } = useChatActions()
  const {
    messages,
    selectedEndpoint,
    isEndpointActive,
    selectedModel,
    hydrated,
    isEndpointLoading,
    mode
  } = useStore()
  const [isMounted, setIsMounted] = useState(false)
  const [agentId] = useQueryState('agent')
  const [teamId] = useQueryState('team')

  useEffect(() => {
    setIsMounted(true)

    if (hydrated) initialize()
  }, [selectedEndpoint, initialize, hydrated, mode])

  const handleNewChat = () => {
    clearChat()
    focusChatInput()
  }

  return (
    <motion.aside
      className="brutalist relative flex h-screen shrink-0 grow-0 flex-col overflow-hidden border-r border-[#e0e0d8] px-2 py-3 font-brutalist bg-white"
      initial={{ width: '16rem' }}
      animate={{ width: isCollapsed ? '2.5rem' : '16rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-2 top-2 z-10 p-1"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        type="button"
        whileTap={{ scale: 0.95 }}
      >
        <Icon
          type="sheet"
          size="xs"
          className={`transform ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}
        />
      </motion.button>
      <motion.div
        className="flex h-full w-60 flex-col overflow-hidden"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -20 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ pointerEvents: isCollapsed ? 'none' : 'auto' }}
      >
        {/* Top: fixed items */}
        <div className="space-y-3 shrink-0">
          <SidebarHeader />
          <NewChatButton disabled={messages.length === 0} onClick={handleNewChat} />
          {(
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-black text-[#feffd6] bg-[#383832] uppercase tracking-wider hover:bg-[#2a2a25] transition-all ink-border stamp-press font-brutalist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Legal Dashboard
            </Link>
          )}
        </div>

        {/* Middle: sessions (scrollable) */}
        <div className="flex-1 overflow-y-auto mt-3 min-h-0">
          {isMounted && isEndpointActive && <Sessions />}
        </div>

        {/* Profile + Logout */}
        {isMounted && (
          <div className="shrink-0 pt-2 border-t border-gray-300">
            {(() => {
              let userName = "User"
              let userEmail = ""
              try {
                const raw = localStorage.getItem("ls_user")
                if (raw) {
                  const u = JSON.parse(raw)
                  userName = u.name || u.email?.split("@")[0] || "User"
                  userEmail = u.email || ""
                }
              } catch {}
              const roleBadge = userRole === "admin"
                ? "bg-red-500/10 text-red-700"
                : userRole === "editor"
                ? "bg-blue-500/10 text-blue-700"
                : "bg-gray-100 text-gray-600"
              return (
                <div className="px-2 py-2">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 bg-[#383832] flex items-center justify-center shrink-0">
                      <span className="text-[#feffd6] text-[10px] font-black">{userName[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-primary truncate">{userName}</p>
                      <div className="flex items-center gap-1">
                        <span className="tag-label">{userRole}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem("ls_token")
                      localStorage.removeItem("ls_user")
                      window.location.href = "/login"
                    }}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-black text-[#be2d06] uppercase tracking-wider hover:bg-[#be2d06]/10 transition-colors font-brutalist"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )
            })()}
          </div>
        )}

        {/* Bottom: developer toggle (admin only) */}
        {isMounted && userRole === "admin" && (
          <div className="shrink-0 pt-2 border-t border-gray-300">
            <button
              onClick={() => setShowDevConfig(!showDevConfig)}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted hover:text-primary transition-colors"
            >
              <svg className={`w-3 h-3 transition-transform ${showDevConfig ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showDevConfig ? 'Hide Config' : 'Developer'}
            </button>
            {showDevConfig && (
              <div className="mt-2 space-y-3 max-h-[40vh] overflow-y-auto pb-2">
                <Endpoint />
                <AuthToken hasEnvToken={hasEnvToken} envToken={envToken} />
                {isEndpointActive && (
                  <div className="flex w-full flex-col items-start gap-2">
                    <div className="text-xs font-medium uppercase text-primary">Mode</div>
                    {isEndpointLoading ? (
                      <div className="flex w-full flex-col gap-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <Skeleton key={index} className="h-9 w-full rounded-xl" />
                        ))}
                      </div>
                    ) : (
                      <>
                        <ModeSelector />
                        <EntitySelector />
                        {selectedModel && (agentId || teamId) && <ModelDisplay model={selectedModel} />}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.aside>
  )
}

export default Sidebar

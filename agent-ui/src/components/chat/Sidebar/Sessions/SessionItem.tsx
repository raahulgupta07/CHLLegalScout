import { useQueryState } from 'nuqs'
import { SessionEntry } from '@/types/os'
import { Button } from '../../../ui/button'
import useSessionLoader from '@/hooks/useSessionLoader'
import { deleteSessionAPI } from '@/api/os'
import { useStore } from '@/store'
import { toast } from 'sonner'
import Icon from '@/components/ui/icon'
import { useState } from 'react'
import DeleteSessionModal from './DeleteSessionModal'
import useChatActions from '@/hooks/useChatActions'
import { truncateText, cn } from '@/lib/utils'
import { MessageSquare, Trash2 } from 'lucide-react'

function timeAgo(timestamp: number | string | undefined): string {
  if (!timestamp) return ''
  const now = Date.now()
  const t = typeof timestamp === 'number' ? timestamp * 1000 : new Date(timestamp).getTime()
  const diff = now - t
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type SessionItemProps = SessionEntry & {
  isSelected: boolean
  currentSessionId: string | null
  onSessionClick: () => void
}
const SessionItem = ({
  session_name: title,
  session_id,
  created_at,
  isSelected,
  currentSessionId,
  onSessionClick
}: SessionItemProps) => {
  const [agentId] = useQueryState('agent')
  const [teamId] = useQueryState('team')
  const [dbId] = useQueryState('db_id')
  const [, setSessionId] = useQueryState('session')
  const authToken = useStore((state) => state.authToken)
  const { getSession } = useSessionLoader()
  const { selectedEndpoint, sessionsData, setSessionsData, mode } = useStore()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { clearChat } = useChatActions()

  const handleGetSession = async () => {
    if (!(agentId || teamId || dbId)) return

    onSessionClick()
    await getSession(
      {
        entityType: mode,
        agentId,
        teamId,
        dbId: dbId ?? ''
      },
      session_id
    )
    setSessionId(session_id)
  }

  const handleDeleteSession = async () => {
    if (!(agentId || teamId || dbId)) return
    setIsDeleting(true)
    try {
      const response = await deleteSessionAPI(
        selectedEndpoint,
        dbId ?? '',
        session_id,
        authToken
      )

      if (response?.ok && sessionsData) {
        setSessionsData(sessionsData.filter((s) => s.session_id !== session_id))
        // If the deleted session was the active one, clear the chat
        if (currentSessionId === session_id) {
          setSessionId(null)
          clearChat()
        }
        toast.success('Session deleted')
      } else {
        const errorMsg = await response?.text()
        toast.error(
          `Failed to delete session: ${response?.statusText || 'Unknown error'} ${errorMsg || ''}`
        )
      }
    } catch (error) {
      toast.error(
        `Failed to delete session: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      setIsDeleteModalOpen(false)
      setIsDeleting(false)
    }
  }
  return (
    <>
      <div
        className={cn(
          'group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all duration-150',
          isSelected
            ? 'bg-accent/80 shadow-sm'
            : 'cursor-pointer hover:bg-accent/50'
        )}
        onClick={handleGetSession}
      >
        <MessageSquare className={cn(
          'h-4 w-4 shrink-0',
          isSelected ? 'text-brand' : 'text-muted'
        )} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h4
            className={cn(
              'truncate text-[13px] leading-5',
              isSelected ? 'font-medium text-primary' : 'text-primary/80'
            )}
          >
            {title || 'New conversation'}
          </h4>
          {created_at && (
            <span className="text-[11px] text-muted/70">
              {timeAgo(created_at)}
            </span>
          )}
        </div>
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-0 transition-opacity duration-150 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            setIsDeleteModalOpen(true)
          }}
          title="Delete conversation"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <DeleteSessionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDeleteSession}
        isDeleting={isDeleting}
      />
    </>
  )
}

export default SessionItem

'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { TextArea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import useAIChatStreamHandler from '@/hooks/useAIStreamHandler'
import { useQueryState } from 'nuqs'
import Icon from '@/components/ui/icon'
import { Mail } from 'lucide-react'

const ChatInput = () => {
  const { chatInputRef, pendingMessage, setPendingMessage } = useStore()
  const { handleStreamResponse, cancelStream } = useAIChatStreamHandler()
  const [selectedAgent] = useQueryState('agent')
  const [teamId] = useQueryState('team')
  const [inputMessage, setInputMessage] = useState('')
  const isStreaming = useStore((state) => state.isStreaming)

  const submitMessage = async (message: string) => {
    if (!message.trim()) return
    setInputMessage('')
    try {
      await handleStreamResponse(message)
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
      setInputMessage(message)
    }
  }

  useEffect(() => {
    if (pendingMessage) {
      submitMessage(pendingMessage)
      setPendingMessage(null)
    }
  }, [pendingMessage, setPendingMessage])

  const handleSubmit = async () => {
    if (!inputMessage.trim()) return
    const currentMessage = inputMessage
    await submitMessage(currentMessage)
  }

  const handleCancel = () => {
    cancelStream()
  }

  return (
    <div className="brutalist relative mx-auto flex w-full max-w-full items-center gap-3 px-4 pb-4 md:max-w-3xl lg:max-w-5xl">
      {/* Email Button */}
      <Button
        onClick={() => {
          setPendingMessage("I want to send an email with a document attachment")
        }}
        size="icon"
        className="p-5 shrink-0 bg-[#383832] text-[#feffd6] hover:bg-[#2a2a25] ink-border stamp-press cursor-pointer"
        title="Send Email"
        disabled={!(selectedAgent || teamId) || isStreaming}
      >
        <Mail className="w-4 h-4" />
      </Button>

      <TextArea
        placeholder="ENTER COMMAND..."
        value={inputMessage}
        maxLength={5000}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && !e.shiftKey && !isStreaming) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        className="w-full bg-[#feffd6] px-4 text-sm text-[#383832] font-brutalist
                   border-[2px] border-[#383832] border-r-[3px] border-b-[3px]
                   focus:border-[#00fc40] focus:ring-1 focus:ring-[#00fc40] placeholder:text-[#383832]/30
                   placeholder:uppercase placeholder:tracking-widest placeholder:text-xs placeholder:font-bold"
        disabled={!(selectedAgent || teamId)}
        ref={chatInputRef}
      />
      {isStreaming ? (
        <Button onClick={handleCancel} size="icon" className="bg-[#be2d06] p-5 text-white hover:bg-[#a02505] ink-border stamp-press cursor-pointer">
          <Icon type="x" color="white" />
        </Button>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={!(selectedAgent || teamId) || !inputMessage.trim() || isStreaming}
          size="icon"
          className="bg-[#00fc40] p-5 text-[#383832] hover:bg-[#00e639] border-[2px] border-[#383832] cursor-pointer hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#383832] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
        >
          <Icon type="send" color="secondary" />
        </Button>
      )}
    </div>
  )
}

export default ChatInput

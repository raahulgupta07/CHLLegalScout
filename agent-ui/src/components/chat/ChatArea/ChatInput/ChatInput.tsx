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
    <div className="relative mx-auto flex w-full max-w-full items-center gap-2 px-4 pb-4 md:max-w-3xl lg:max-w-5xl">
      {/* Email Button — sends message to agent to trigger email flow */}
      <Button
        onClick={() => {
          setPendingMessage("I want to send an email with a document attachment")
        }}
        size="icon"
        className="rounded-xl p-5 shrink-0 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
        title="Send Email"
        disabled={!(selectedAgent || teamId) || isStreaming}
      >
        <Mail className="w-4 h-4" />
      </Button>

      <TextArea
        placeholder="Ask anything"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && !e.shiftKey && !isStreaming) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        className="w-full border border-gray-300 bg-white px-4 text-sm text-primary focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
        disabled={!(selectedAgent || teamId)}
        ref={chatInputRef}
      />
      {isStreaming ? (
        <Button onClick={handleCancel} size="icon" className="rounded-xl bg-red-500 p-5 text-white hover:bg-red-600">
          <Icon type="x" color="white" />
        </Button>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={!(selectedAgent || teamId) || !inputMessage.trim() || isStreaming}
          size="icon"
          className="rounded-xl bg-primary p-5 text-primaryAccent"
        >
          <Icon type="send" color="primaryAccent" />
        </Button>
      )}
    </div>
  )
}

export default ChatInput

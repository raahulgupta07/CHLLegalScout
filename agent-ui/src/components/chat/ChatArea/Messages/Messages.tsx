import type { ChatMessage } from '@/types/os'

import { AgentMessage, UserMessage } from './MessageItem'
import Tooltip from '@/components/ui/tooltip'
import { memo, useState, useEffect, useRef } from 'react'
import {
  ToolCallProps,
  ReasoningStepProps,
  ReasoningProps,
  ReferenceData,
  Reference
} from '@/types/os'
import React, { type FC } from 'react'

import Icon from '@/components/ui/icon'
import ChatBlankState from './ChatBlankState'

// Live timer that ticks every 100ms while waiting for response
const LiveTimer = () => {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startRef.current)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted font-dmmono">
      <span className="inline-block h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
      {(elapsed / 1000).toFixed(1)}s
    </span>
  )
}

// Static badge showing the final response time
const ResponseTime = ({ ms }: { ms: number }) => (
  <span className="inline-flex items-center gap-1 text-xs text-muted font-dmmono">
    ⏱ {(ms / 1000).toFixed(1)}s
  </span>
)

interface MessageListProps {
  messages: ChatMessage[]
}

interface MessageWrapperProps {
  message: ChatMessage
  isLastMessage: boolean
}

interface ReferenceProps {
  references: ReferenceData[]
}

interface ReferenceItemProps {
  reference: Reference
}

const ReferenceItem: FC<ReferenceItemProps> = ({ reference }) => (
  <div className="relative flex h-[63px] w-[190px] cursor-default flex-col justify-between overflow-hidden rounded-md bg-background-secondary p-3 transition-colors hover:bg-background-secondary/80">
    <p className="text-base font-medium text-primary">{reference.name}</p>
    <p className="truncate text-sm text-primary/40">{reference.content}</p>
  </div>
)

const References: FC<ReferenceProps> = ({ references }) => (
  <div className="flex flex-col gap-4">
    {references.map((referenceData, index) => (
      <div
        key={`${referenceData.query}-${index}`}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap gap-3">
          {referenceData.references.map((reference, refIndex) => (
            <ReferenceItem
              key={`${reference.name}-${reference.meta_data.chunk}-${refIndex}`}
              reference={reference}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
)

const AgentMessageWrapper = ({ message }: MessageWrapperProps) => {
  return (
    <div className="flex flex-col gap-y-9">
      {message.extra_data?.reasoning_steps &&
        message.extra_data.reasoning_steps.length > 0 && (
          <div className="flex items-start gap-4">
            <Tooltip
              delayDuration={0}
              content={<p className="text-accent">Reasoning</p>}
              side="top"
            >
              <Icon type="reasoning" size="sm" />
            </Tooltip>
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase">Reasoning</p>
              <Reasonings reasoning={message.extra_data.reasoning_steps} />
            </div>
          </div>
        )}
      {message.extra_data?.references &&
        message.extra_data.references.length > 0 && (
          <div className="flex items-start gap-4">
            <Tooltip
              delayDuration={0}
              content={<p className="text-accent">References</p>}
              side="top"
            >
              <Icon type="references" size="sm" />
            </Tooltip>
            <div className="flex flex-col gap-3">
              <References references={message.extra_data.references} />
            </div>
          </div>
        )}
      {message.tool_calls && message.tool_calls.length > 0 && (
        <div className="flex items-start gap-3">
          <Tooltip
            delayDuration={0}
            content={<p className="text-accent">Tool Calls</p>}
            side="top"
          >
            <Icon
              type="hammer"
              className="rounded-lg bg-background-secondary p-1"
              size="sm"
              color="secondary"
            />
          </Tooltip>

          <div className="flex flex-wrap gap-2">
            {message.tool_calls.map((toolCall, index) => (
              <ToolComponent
                key={
                  toolCall.tool_call_id ||
                  `${toolCall.tool_name}-${toolCall.created_at}-${index}`
                }
                tools={toolCall}
              />
            ))}
          </div>
        </div>
      )}
      <AgentMessage message={message} />
    </div>
  )
}
const Reasoning: FC<ReasoningStepProps> = ({ index, stepTitle }) => (
  <div className="flex items-center gap-2 text-secondary">
    <div className="flex h-[20px] items-center rounded-md bg-background-secondary p-2">
      <p className="text-sm">STEP {index + 1}</p>
    </div>
    <p className="text-sm">{stepTitle}</p>
  </div>
)
const Reasonings: FC<ReasoningProps> = ({ reasoning }) => (
  <div className="flex flex-col items-start justify-center gap-2">
    {reasoning.map((title, index) => (
      <Reasoning
        key={`${title.title}-${title.action}-${index}`}
        stepTitle={title.title}
        index={index}
      />
    ))}
  </div>
)

const ToolComponent = memo(({ tools }: ToolCallProps) => (
  <div className="cursor-default rounded-full border border-gray-300 bg-gray-100 px-3 py-1.5 text-xs">
    <p className="font-dmmono uppercase text-gray-700">{tools.tool_name}</p>
  </div>
))
ToolComponent.displayName = 'ToolComponent'
const Messages = ({ messages }: MessageListProps) => {
  if (messages.length === 0) {
    return <ChatBlankState />
  }

  // Build timing map: for each agent message, compute elapsed time from previous user message
  const timings: Record<number, number> = {}
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].role === 'agent' && messages[i - 1].role === 'user') {
      const userTime = messages[i - 1].created_at ? new Date(messages[i - 1].created_at * 1000).getTime() : 0
      const agentTime = messages[i].created_at ? new Date(messages[i].created_at * 1000).getTime() : 0
      if (userTime && agentTime && agentTime > userTime) {
        timings[i] = agentTime - userTime
      }
    }
  }

  const lastMessage = messages[messages.length - 1]
  const isWaitingForResponse = lastMessage?.role === 'user'

  return (
    <>
      {messages.map((message, index) => {
        const key = `${message.role}-${message.created_at}-${index}`
        const isLastMessage = index === messages.length - 1

        const msgTime = message.created_at
          ? new Date(message.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : null

        if (message.role === 'agent') {
          return (
            <div key={key} className="flex flex-col gap-1">
              <AgentMessageWrapper
                message={message}
                isLastMessage={isLastMessage}
              />
              <div className="ml-12 mt-1 flex items-center gap-3">
                {timings[index] && <ResponseTime ms={timings[index]} />}
                {msgTime && <span className="text-[11px] text-gray-400">{msgTime}</span>}
              </div>
            </div>
          )
        }
        return (
          <div key={key} className="flex flex-col gap-1">
            <UserMessage message={message} />
            {msgTime && (
              <div className="ml-12 mt-0.5">
                <span className="text-[11px] text-gray-400">{msgTime}</span>
              </div>
            )}
            {isLastMessage && isWaitingForResponse && (
              <div className="ml-12 mt-1">
                <LiveTimer />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

export default Messages

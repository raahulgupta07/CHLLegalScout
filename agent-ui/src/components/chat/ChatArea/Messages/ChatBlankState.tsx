'use client'

import { motion } from 'framer-motion'
import { useStore } from '@/store'
import { useQueryState } from 'nuqs'

const QUICK_ACTIONS = [
  {
    title: 'Create AGM for City Holdings',
    prompt: 'Create AGM for City Holdings Limited',
  },
  {
    title: 'Create Director Consent Form',
    prompt: 'Create Director Consent Form',
  },
  {
    title: 'List all companies',
    prompt: 'List all companies',
  },
  {
    title: 'Show all templates',
    prompt: 'Show all templates',
  },
]

const ChatBlankState = () => {
  const { setPendingMessage } = useStore()
  const [agentId, setAgentId] = useQueryState('agent')
  const [dbId, setDbId] = useQueryState('db_id')

  const handleQuickAction = (prompt: string) => {
    if (!agentId) {
      setAgentId('scout')
      setDbId('scout-db')
      setTimeout(() => setPendingMessage(prompt), 300)
    } else {
      setPendingMessage(prompt)
    }
  }

  return (
    <section className="flex flex-col items-center text-center font-brutalist" aria-label="Welcome">
      <div className="flex max-w-2xl flex-col items-center gap-y-6">
        {/* Title — clean like DASH */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          <h1 className="text-[42px] font-black text-[#383832] tracking-[-0.02em] uppercase leading-tight">Legal Scout</h1>
          <p className="text-xs font-bold text-[#383832]/40 uppercase tracking-[0.15em]">
            AI-Powered Document Assistant — Myanmar Corporate Law
          </p>
        </motion.div>

        {/* Quick Actions — simple bordered list like DASH */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col gap-2 w-full max-w-md"
        >
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.2 + i * 0.05 }}
              onClick={() => handleQuickAction(action.prompt)}
              className="px-4 py-3 text-left text-sm font-medium text-[#383832]
                         border border-[#383832]/20 hover:border-[#383832]/50 hover:bg-[#383832]/5
                         transition-all duration-150 cursor-pointer"
            >
              {action.title}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default ChatBlankState

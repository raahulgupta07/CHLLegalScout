'use client'

import { motion } from 'framer-motion'
import { useStore } from '@/store'
import { useQueryState } from 'nuqs'
import { FileText, Building, ScrollText, Search } from 'lucide-react'

const QUICK_ACTIONS = [
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Create AGM Minutes",
    description: "Generate Annual General Meeting minutes for a company",
    prompt: "Create AGM for City Holdings Limited",
  },
  {
    icon: <ScrollText className="w-5 h-5" />,
    title: "Director Consent Form",
    description: "Generate a director consent form for appointment",
    prompt: "Create Director Consent Form",
  },
  {
    icon: <Building className="w-5 h-5" />,
    title: "List Companies",
    description: "Show all companies in the database",
    prompt: "List all companies",
  },
  {
    icon: <Search className="w-5 h-5" />,
    title: "Show Templates",
    description: "Browse all available document templates",
    prompt: "Show all templates",
  },
]

const ChatBlankState = () => {
  const { setPendingMessage } = useStore()
  const [agentId, setAgentId] = useQueryState('agent')
  const [dbId, setDbId] = useQueryState('db_id')

  const handleQuickAction = (prompt: string) => {
    // Ensure agent is selected before sending
    if (!agentId) {
      setAgentId('scout')
      setDbId('scout-db')
      // Small delay to let URL params update
      setTimeout(() => setPendingMessage(prompt), 300)
    } else {
      setPendingMessage(prompt)
    }
  }

  return (
    <section className="flex flex-col items-center text-center font-geist" aria-label="Welcome">
      <div className="flex max-w-2xl flex-col items-center gap-y-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg"
        >
          <span className="text-white font-bold text-2xl">LS</span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-2"
        >
          <h1 className="text-2xl font-bold text-primary tracking-tight">Legal Scout</h1>
          <p className="text-sm text-muted">AI-powered legal document assistant for Myanmar corporate law</p>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 gap-3 w-full"
        >
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 + i * 0.08 }}
              onClick={() => handleQuickAction(action.prompt)}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border border-primary/10 bg-card hover:bg-accent/50 hover:border-primary/20 transition-all text-left group"
            >
              <div className="p-2 rounded-lg bg-accent group-hover:bg-brand/10 transition-colors">
                <div className="text-muted group-hover:text-brand transition-colors">
                  {action.icon}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{action.title}</p>
                <p className="text-xs text-muted mt-0.5">{action.description}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-xs text-muted/60"
        >
          Click a suggestion above or type your question below
        </motion.p>
      </div>
    </section>
  )
}

export default ChatBlankState

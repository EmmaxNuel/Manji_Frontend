/**
 * ManjiAiPanel.jsx
 *
 * The Manji AI creative co-author panel. Phase 1 ships a conversation chat
 * backed by a real, configurable LLM provider. Later phases add the dedicated
 * modes (ideas, characters, world, plot, writing, images).
 *
 * Props:
 *   story            – the story being edited ({ id, title })
 *   activeChapterId  – optional chapter currently open in the editor (its
 *                      draft is used as extra context)
 *   onInsert         – optional callback(content) to insert AI text into the
 *                      editor draft
 *   onClose          – optional callback() to close the panel (mobile)
 */

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Sparkles, Send, Plus, Copy, Check, Trash2, X, Wand2, MessageSquare,
} from 'lucide-react'
import { aiService } from '../../services/aiService'
import { Spinner } from '../ui'

// ---------------------------------------------------------------------------
// Quick actions – Phase 1: these prefill the prompt. Dedicated modes arrive
// in Phase 2.
// ---------------------------------------------------------------------------
const QUICK_ACTIONS = [
  { icon: '💡', label: 'Ideas',    prompt: 'Give me five possible directions for the next chapter.' },
  { icon: '✍️', label: 'Continue', prompt: 'Continue my draft from where it stops.' },
  { icon: '🎭', label: 'Characters', prompt: 'Suggest a character who could change this story, with a short background and goal.' },
  { icon: '🌎', label: 'World',    prompt: 'Suggest world-building details that fit this story.' },
  { icon: '⚡', label: 'Plot Twist', prompt: 'Give me a plot twist.' },
  { icon: '🎨', label: 'Generate Art', prompt: 'Suggest a scene to illustrate for this story, and write an image prompt for it.' },
]

function quickLabel(icon) {
  return `${icon} ${QUICK_ACTIONS.find((a) => a.icon === icon)?.label || ''}`.trim()
}

export default function ManjiAiPanel({ story, activeChapterId, onInsert, onClose, className = '' }) {
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const scrollRef = useRef(null)

  // Load the most recent conversation for this story.
  useEffect(() => {
    let active = true
    async function load() {
      setLoadingHistory(true)
      try {
        const conversations = await aiService.getConversations(story.id)
        const latest = conversations[0]
        if (latest && active) {
          const detail = await aiService.getConversation(latest.id)
          setMessages(detail.messages || [])
          setConversationId(latest.id)
        }
      } catch {
        // History is non-critical.
      } finally {
        if (active) setLoadingHistory(false)
      }
    }
    load()
    return () => { active = false }
  }, [story.id])

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function startNewConversation() {
    setConversationId(null)
    setMessages([])
    setError('')
    setInput('')
  }

  async function handleDeleteConversation() {
    if (!conversationId) return
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return
    try {
      await aiService.deleteConversation(conversationId)
      startNewConversation()
      toast.success('Conversation deleted.')
    } catch {
      toast.error('Failed to delete conversation.')
    }
  }

  async function handleSend(text) {
    const content = (text ?? input).trim()
    if (!content || sending) return
    setError('')
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: 'user', content }])
    setInput('')
    setSending(true)
    try {
      const res = await aiService.chat({
        story_id: story.id,
        conversation_id: conversationId || undefined,
        chapter_id: activeChapterId || undefined,
        message: content,
      })
      const data = res.data
      setConversationId(data.conversation_id)
      setMessages((prev) => [...prev.filter((m) => !m.id.startsWith('local-')), { role: 'user', content }, data.message])
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Manji AI is unavailable right now. Try again.')
    } finally {
      setSending(false)
    }
  }

  async function handleCopy(content) {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Copied to clipboard.')
    } catch {
      toast.error('Could not copy text.')
    }
  }

  function handleInsert(content) {
    if (onInsert) onInsert(content)
    toast.success('Inserted into your draft.')
  }

  function handleMarkCopied(id) {
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className={`glass-dark rounded-2xl border border-white/10 flex flex-col overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-orange-500/15 text-orange-400 flex-shrink-0">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold leading-tight">Manji AI</h3>
            <p className="text-white/40 text-xs leading-tight">Creative co-author</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={startNewConversation}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            title="New conversation"
          >
            <Plus size={15} />
          </button>
          {conversationId && (
            <button
              onClick={handleDeleteConversation}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
              title="Delete conversation"
            >
              <Trash2 size={15} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              title="Close"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[240px] max-h-[48vh] lg:max-h-[56vh]">
        {loadingHistory ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-500/15 flex items-center justify-center mb-3">
              <Wand2 size={26} className="text-orange-400" />
            </div>
            <p className="text-white/70 font-medium text-sm">What can I help with?</p>
            <p className="text-white/40 text-xs mt-1 px-4">
              Brainstorm directions, continue your draft, build characters or
              world — then accept, edit, or insert the ideas.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                message.role === 'user'
                  ? 'bg-orange-500/15 text-white border border-orange-500/20'
                  : 'bg-white/5 text-white/90 border border-white/10'
              }`}>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles size={12} className="text-orange-400" />
                    <span className="text-orange-400/80 text-xs font-medium">Manji AI</span>
                  </div>
                )}
                {message.content}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => { handleInsert(message.content); handleMarkCopied(message.id) }}
                      className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 text-xs font-medium transition-colors"
                    >
                      <Check size={12} /> Insert
                    </button>
                    <button
                      onClick={() => handleCopy(message.content)}
                      className="inline-flex items-center gap-1 text-white/50 hover:text-white text-xs transition-colors"
                    >
                      {copiedId === message.id ? <Check size={12} /> : <Copy size={12} />}
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2.5 text-white/60 text-sm">
              <Spinner size="sm" />
              <span>Manji AI is thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-red-300 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => handleSend(action.prompt)}
            disabled={sending}
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-orange-500/15 hover:text-orange-300 hover:border-orange-500/30 text-xs transition-colors disabled:opacity-50"
            title={action.prompt}
          >
            <span>{action.icon}</span> {action.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 pt-2 border-t border-white/10">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask Manji AI…"
            rows={1}
            className="flex-1 input-field resize-none max-h-32 min-h-[44px]"
          />
          <button
            onClick={() => handleSend()}
            disabled={sending || !input.trim()}
            className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
            title="Send"
          >
            {sending ? <Spinner size="sm" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-white/30 text-[11px] mt-2 flex items-center gap-1">
          <MessageSquare size={11} /> Context: {story.title}
          {activeChapterId ? ' + open chapter' : ''}
        </p>
      </div>
    </div>
  )
}
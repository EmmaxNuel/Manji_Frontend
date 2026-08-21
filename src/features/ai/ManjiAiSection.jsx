/**
 * ManjiAiSection – the Manji AI co-author tab inside MANJI STUDIO (Phase 4).
 *
 * A project-scoped chat that reasons over the whole production: the linked
 * story, the cast, the scene board and the project's art direction. The
 * creator can focus the AI on a specific scene via a picker, or just ask
 * freely. Responses are streamed as normal chat turns and can be copied.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Sparkles, Send, Plus, Copy, Check, Trash2, Wand2, MessageSquare, RefreshCw,
} from 'lucide-react'
import { Spinner, Badge } from '../../components/ui'
import ManjiGuide from '../../components/manji/ManjiGuide'
import { aiService } from '../../services/aiService'

const QUICK_ACTIONS = [
  { icon: '🎬', label: 'Scene',      prompt: 'Help me open this scene with strong visual and emotional hooks.' },
  { icon: '💬', label: 'Dialogue',   prompt: 'Rewrite the dialogue in this scene so it feels more natural and revealing.' },
  { icon: '🎨', label: 'Art',        prompt: 'Suggest 3 compositions for this scene as image prompts, matching the project art style.' },
  { icon: '⏱️', label: 'Pacing',     prompt: 'How can I improve the pacing of this scene?' },
  { icon: '🎭', label: 'Cast',       prompt: 'Suggest a new character who could raise the stakes, consistent with the cast and setting.' },
  { icon: '⚡', label: 'Plot',       prompt: 'Give me a plot twist that fits this project.' },
]

function contextLabel(context) {
  return context?.art_style || 'No art style set'
}

export default function ManjiAiSection({ project }) {
  const [context, setContext] = useState(null)
  const [scenes, setScenes] = useState([])
  const [sceneId, setSceneId] = useState('')
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const scrollRef = useRef(null)

  const loadContext = async () => {
    try {
      const ctx = await aiService.getProjectContext(project.id)
      setContext(ctx)
      setScenes(ctx.scenes || [])
    } catch {
      setContext(null)
    }
  }

  // Load the project snapshot + the latest conversation for this project.
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      await loadContext()
      setLoadingHistory(true)
      try {
        const conversations = await aiService.getProjectConversations(project.id)
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
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [project.id])

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
      const res = await aiService.projectChat(project.id, {
        message: content,
        conversation_id: conversationId || undefined,
        scene_id: sceneId || undefined,
      })
      const data = res.data
      setConversationId(data.conversation_id)
      setMessages((prev) => [
        ...prev.filter((m) => !m.id.startsWith('local-')),
        { role: 'user', content },
        data.message,
      ])
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

  function handleMarkCopied(id) {
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const activeScene = useMemo(
    () => scenes.find((s) => s.id === sceneId) || null,
    [scenes, sceneId],
  )

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  return (
    <div data-tour="manji-ai-section">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-orange-400" /> Manji AI
          </h2>
          <p className="text-white/50 text-sm mt-1">
            Your co-author for the whole production — story, cast, scenes and art direction.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { startNewConversation(); loadContext() }}
            className="btn-ghost text-sm px-3 py-2.5 justify-center"
            title="Refresh context"
          >
            <RefreshCw size={14} /> Refresh context
          </button>
        </div>
      </div>

      {/* Context strip */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="accent">{context?.project_type || 'Project'}</Badge>
        <Badge variant="accent">{contextLabel(context)}</Badge>
        <Badge>{context?.characters?.length ?? 0} cast</Badge>
        <Badge>{context?.scenes?.length ?? 0} scenes</Badge>
        {context?.story && <Badge>Story: {context.story.title}</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat panel */}
        <div className="lg:col-span-2 glass-dark rounded-2xl border border-white/10 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-orange-500/15 text-orange-400 flex-shrink-0">
                <Sparkles size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold leading-tight">Co-author chat</h3>
                <p className="text-white/40 text-xs leading-tight">
                  {activeScene ? `Focusing on: ${activeScene.title}` : 'Focusing on the whole project'}
                </p>
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
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[300px] max-h-[52vh]">
            {loadingHistory ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-500/15 flex items-center justify-center mb-3">
                  <Wand2 size={26} className="text-orange-400" />
                </div>
                <p className="text-white/70 font-medium text-sm">What can I help you make?</p>
                <p className="text-white/40 text-xs mt-1 px-4">
                  Ask about a scene, the cast, the story or the art direction —
                  or try one of the prompts below.
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
              <MessageSquare size={11} /> Context: {project.title}
              {activeScene ? ` + scene "${activeScene.title}"` : ''} · {contextLabel(context)}
            </p>
          </div>
        </div>

        {/* Scene focus + project snapshot */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-white font-semibold text-sm mb-3">Focus the AI</h3>
            <label className="label">Scene</label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-[var(--color-card)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={sceneId}
              onChange={(e) => setSceneId(e.target.value)}
            >
              <option value="">Whole project</option>
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  #{scene.order} {scene.title}
                </option>
              ))}
            </select>
            {scenes.length === 0 && (
              <p className="text-white/40 text-xs mt-2">
                No scenes yet — add some in the Scenes tab to focus the AI on a specific beat.
              </p>
            )}
          </div>

          <div className="card p-4">
            <h3 className="text-white font-semibold text-sm mb-3">Project snapshot</h3>
            {!context ? (
              <p className="text-white/40 text-xs">Project context is unavailable.</p>
            ) : (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-white/50">Type</dt>
                  <dd className="text-white capitalize">{context.project_type}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-white/50">Art style</dt>
                  <dd className="text-white text-right">{contextLabel(context)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-white/50">Status</dt>
                  <dd className="text-white capitalize">{context.status}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-white/50">Story</dt>
                  <dd className="text-white text-right">{context.story?.title || '—'}</dd>
                </div>
              </dl>
            )}
            {context?.characters?.length > 0 && (
              <>
                <h4 className="text-white/50 text-xs font-medium mt-4 mb-2 uppercase tracking-wide">Cast</h4>
                <ul className="space-y-1.5 text-sm">
                  {context.characters.slice(0, 8).map((character) => (
                    <li key={character.name} className="flex items-center justify-between gap-2">
                      <span className="text-white/90">{character.name}</span>
                      <Badge>{character.role || 'Role'}</Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {scenes.length === 0 && (
            <ManjiGuide
              expression="curious" size="md"
              message="Once you add scenes and characters, Manji AI can work with the whole production — not just your prompt."
            />
          )}
        </div>
      </div>
    </div>
  )
}
/**
 * ChapterReaderPage.jsx
 *
 * Distraction-free chapter reader with:
 * - Chapter navigation (prev/next)
 * - Table of contents
 * - Font size controls
 * - Reading width controls
 * - Light/dark reading mode
 * - Auto-save reading progress
 * - Comments
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ChevronLeft, ChevronRight, Menu, X, Type, Columns,
  Sun, Moon, BookOpen, MessageCircle, Settings,
  List, Plus, Minus, Sparkles, PenSquare, Compass,
} from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../context/AuthContext'
import { storyService } from '../../services/storyService'
import { Spinner, Button } from '../../components/ui'

// ---------------------------------------------------------------------------
// Reading settings defaults
// ---------------------------------------------------------------------------
const DEFAULT_SETTINGS = {
  fontSize: 18,
  readingWidth: 'medium', // 'narrow' | 'medium' | 'wide'
  theme: 'dark', // 'light' | 'dark'
}

const FONT_SIZES = {
  small: 14,
  medium: 18,
  large: 22,
  xlarge: 26,
}

const READING_WIDTHS = {
  narrow: 'max-w-2xl',
  medium: 'max-w-3xl',
  wide: 'max-w-5xl',
}

// ---------------------------------------------------------------------------
// Settings panel
// ---------------------------------------------------------------------------
function SettingsPanel({ settings, onSettingsChange, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-80 bg-[var(--color-card)] border-l border-[var(--color-border)] shadow-2xl p-6 overflow-y-auto max-h-screen">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings size={20} /> Reading Settings
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Font size */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/90 mb-3">Font Size</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSettingsChange({ fontSize: Math.max(12, settings.fontSize - 2) })}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="text-white text-sm w-16 text-center">{settings.fontSize}px</span>
            <button
              onClick={() => onSettingsChange({ fontSize: Math.min(32, settings.fontSize + 2) })}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Reading width */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/90 mb-3">Reading Width</label>
          <div className="flex gap-2">
            {['narrow', 'medium', 'wide'].map((width) => (
              <button
                key={width}
                onClick={() => onSettingsChange({ readingWidth: width })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                  settings.readingWidth === width
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
                }`}
              >
                {width}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white/90 mb-3">Reading Theme</label>
          <div className="flex gap-2">
            <button
              onClick={() => onSettingsChange({ theme: 'light' })}
              className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                settings.theme === 'light'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
              }`}
            >
              <Sun size={14} /> Light
            </button>
            <button
              onClick={() => onSettingsChange({ theme: 'dark' })}
              className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                settings.theme === 'dark'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'
              }`}
            >
              <Moon size={14} /> Dark
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Table of contents sidebar
// ---------------------------------------------------------------------------
function TocSidebar({ chapters, currentChapterId, onClose, onSelectChapter }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-80 bg-[var(--color-card)] border-r border-[var(--color-border)] shadow-2xl overflow-y-auto">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <List size={20} /> Chapters
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-2">
          {chapters.map((ch) => (
            <button
              key={ch.id}
              onClick={() => onSelectChapter(ch.id)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                ch.id === currentChapterId
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-white/40 text-xs mr-2">#{ch.chapter_number}</span>
              {ch.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Official welcome story ending
// ---------------------------------------------------------------------------

function WelcomeEnding({ story, settings }) {
  return (
    <div className="mt-16 pt-12 border-t border-[var(--color-border)]">
      <div className={`relative overflow-hidden rounded-3xl border ${
        settings.theme === 'dark'
          ? 'border-orange-500/25 bg-gradient-to-b from-[#1a1410] to-[#1a1a1a]'
          : 'border-orange-500/30 bg-gradient-to-b from-orange-50 to-[#f8f6f1]'
      }`}>
        {story.cover && (
          <div className="absolute inset-0 opacity-10">
            <img src={story.cover} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative z-10 p-8 sm:p-12 text-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-orange-500 to-red-500 text-white mb-6`}>
            <Sparkles size={13} /> Official Manji Story
          </span>
          <h2 className={`text-3xl sm:text-4xl font-serif font-black mb-5 ${
            settings.theme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            You've found Manji.
            <br />
            Now, what story will you leave behind?
          </h2>
          <p className={`max-w-xl mx-auto mb-10 leading-relaxed ${
            settings.theme === 'dark' ? 'text-white/60' : 'text-black/60'
          }`}>
            This is where your journey begins. Explore worlds written and drawn
            by creators from everywhere — or start the one story only you can tell.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/discover"
              className="btn-primary text-base px-8 py-3.5 gap-2 shadow-2xl shadow-orange-500/30"
            >
              <Compass size={18} /> Explore Manji
            </Link>
            <Link
              to="/create/new"
              className={`btn-secondary text-base px-8 py-3.5 gap-2 ${
                settings.theme === 'dark' ? '' : 'border-black/20 text-black/80 hover:border-black/40'
              }`}
            >
              <PenSquare size={18} /> Create Your Story
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Comments section
// ---------------------------------------------------------------------------
function CommentsSection({ chapterId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    // TODO: Load comments from API
    setComments([])
    setLoading(false)
  }, [chapterId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    // TODO: POST comment to API
    setNewComment('')
    setSubmitting(false)
    toast.success('Comment posted!')
  }

  return (
    <div className="mt-12 pt-8 border-t border-[var(--color-border)]">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <MessageCircle size={20} /> Comments
      </h3>
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              className="input-field resize-none mb-3"
            />
            <Button type="submit" loading={submitting} disabled={!newComment.trim()}>
              Post Comment
            </Button>
          </form>
          {comments.length === 0 && (
            <p className="text-white/40 text-sm text-center py-8">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main reader page
// ---------------------------------------------------------------------------
export default function ChapterReaderPage() {
  const { id: chapterId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [chapter, setChapter] = useState(null)
  const [chapters, setChapters] = useState([])
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showToc, setShowToc] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('manji-reading-settings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  // Auto-save reading progress
  const saveProgress = useCallback(async () => {
    if (!chapter || !user) return
    try {
      await storyService.saveReadingProgress({
        story_id: story?.id,
        chapter_id: chapter.id,
        progress_percentage: 50, // Could be calculated from scroll position
        completed: false,
      })
    } catch {
      // Silently fail - progress saving is not critical
    }
  }, [chapter, story, user])

  useEffect(() => {
    if (!chapterId) return
    loadChapter()
  }, [chapterId])

  useEffect(() => {
    if (!chapter || !story) return
    loadStoryChapters()
    // Auto-save progress every 30 seconds
    const interval = setInterval(saveProgress, 30000)
    return () => clearInterval(interval)
  }, [chapter, story, saveProgress])

  useEffect(() => {
    localStorage.setItem('manji-reading-settings', JSON.stringify(settings))
  }, [settings])

  async function loadChapter() {
    setLoading(true)
    try {
      const res = await storyService.getChapter(chapterId)
      const chapterData = res.data
      setChapter(chapterData)
      setStory(chapterData.story)
    } catch {
      toast.error('Failed to load chapter.')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  async function loadStoryChapters() {
    if (!story?.slug) return
    try {
      const res = await storyService.getChapters(story.slug)
      setChapters(res.data || [])
    } catch {
      // Non-critical
    }
  }

  function handleSelectChapter(id) {
    setShowToc(false)
    navigate(`/chapters/${id}`)
  }

  function goToPrev() {
    if (!chapters.length || !chapter) return
    const currentIndex = chapters.findIndex((ch) => ch.id === chapter.id)
    if (currentIndex > 0) {
      handleSelectChapter(chapters[currentIndex - 1].id)
    }
  }

  function goToNext() {
    if (!chapters.length || !chapter) return
    const currentIndex = chapters.findIndex((ch) => ch.id === chapter.id)
    if (currentIndex < chapters.length - 1) {
      handleSelectChapter(chapters[currentIndex + 1].id)
    }
  }

  const currentIndex = chapters.findIndex((ch) => ch.id === chapter?.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < chapters.length - 1

  const readingTheme = settings.theme === 'dark' ? 'dark' : ''

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-32">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (!chapter) return null

  return (
    <MainLayout>
      <div className={`min-h-screen ${readingTheme ? 'dark ' : ''}`}>
        {/* Reading background */}
        <div className={`fixed inset-0 -z-10 ${
          settings.theme === 'dark'
            ? 'bg-[#1a1a1a]'
            : 'bg-[#f8f6f1]'
        }`} />

        {/* Top bar */}
        <div className={`sticky top-0 z-40 border-b backdrop-blur-md ${
          settings.theme === 'dark'
            ? 'bg-[#1a1a1a]/90 border-white/5'
            : 'bg-[#f8f6f1]/90 border-black/5'
        }`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className={`p-2 rounded-lg transition-colors ${
                  settings.theme === 'dark'
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <Link
                  to={`/stories/${story?.slug}`}
                  className={`text-sm font-medium hover:underline ${
                    settings.theme === 'dark' ? 'text-white/80' : 'text-black/80'
                  }`}
                >
                  {story?.title}
                </Link>
                <p className={`text-xs ${
                  settings.theme === 'dark' ? 'text-white/40' : 'text-black/40'
                }`}>
                  Chapter {chapter.chapter_number}: {chapter.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowToc(true)}
                className={`p-2 rounded-lg transition-colors ${
                  settings.theme === 'dark'
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
                title="Table of contents"
              >
                <Menu size={20} />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-lg transition-colors ${
                  settings.theme === 'dark'
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
                title="Reading settings"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Chapter content */}
        <div className={`max-w-5xl mx-auto px-4 sm:px-6 py-8 ${READING_WIDTHS[settings.readingWidth]}`}>
          <article
            className={`prose prose-lg max-w-none ${
              settings.theme === 'dark' ? 'prose-invert' : ''
            }`}
            style={{ fontSize: `${settings.fontSize}px`, lineHeight: 1.8 }}
          >
            <h1 className={`text-3xl font-bold mb-8 ${
              settings.theme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              {chapter.title}
            </h1>
            <div
              className={`whitespace-pre-wrap leading-relaxed ${
                settings.theme === 'dark'
                  ? 'text-white/90'
                  : 'text-black/90'
              }`}
              style={{ fontSize: `${settings.fontSize}px`, lineHeight: 1.8 }}
            >
              {chapter.content || 'This chapter is empty.'}
            </div>
          </article>

          {/* Chapter navigation */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-[var(--color-border)]">
            <Button
              variant="ghost"
              onClick={goToPrev}
              disabled={!hasPrev}
              className={!hasPrev ? 'opacity-30 cursor-not-allowed' : ''}
            >
              <ChevronLeft size={18} /> Previous Chapter
            </Button>
            <Button
              variant="ghost"
              onClick={goToNext}
              disabled={!hasNext}
              className={!hasNext ? 'opacity-30 cursor-not-allowed' : ''}
            >
              Next Chapter <ChevronRight size={18} />
            </Button>
          </div>

          {/* Official welcome story ending */}
          {story?.is_official && !hasNext && (
            <WelcomeEnding story={story} settings={settings} />
          )}

          {/* Comments */}
          <CommentsSection chapterId={chapter.id} />
        </div>

        {/* Table of contents sidebar */}
        {showToc && (
          <TocSidebar
            chapters={chapters}
            currentChapterId={chapter.id}
            onClose={() => setShowToc(false)}
            onSelectChapter={handleSelectChapter}
          />
        )}

        {/* Settings panel */}
        {showSettings && (
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </MainLayout>
  )
}

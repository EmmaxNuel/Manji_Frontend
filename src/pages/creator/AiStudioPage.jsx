/**
 * AiStudioPage.jsx
 *
 * Creator AI studio with two workbenches:
 *   - Image Studio: generate cover / chapter / character images per story,
 *     watch async jobs, browse the gallery, and apply results as covers or
 *     chapter pages.
 *   - Idea Studio: generate story ideas, title suggestions, and chapter
 *     outlines using the LLM backend.
 */

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Sparkles, ImageIcon, PenLine, Wand2, Loader2,
  Trash2, ImagePlus, BookOpen, RefreshCw, ChevronDown, Layers,
} from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../context/AuthContext'
import { aiService } from '../../services/aiService'
import { storyService } from '../../services/storyService'
import { Spinner } from '../../components/ui'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const IMAGE_TYPES = [
  { value: 'cover',    label: 'Story Cover' },
  { value: 'chapter',  label: 'Chapter Illustration' },
  { value: 'character', label: 'Character Art' },
  { value: 'scene',    label: 'Scene Art' },
]

const PROVIDERS = [
  { value: 'dalle',  label: 'DALL-E 3' },
  { value: 'stability', label: 'Stability AI' },
  { value: 'leonardo', label: 'Leonardo AI' },
  { value: 'local',  label: 'Local (dev)' },
]

const SIZES = [
  { value: '1024x1024', label: 'Square 1:1' },
  { value: '1024x1536', label: 'Portrait 2:3' },
  { value: '1536x1024', label: 'Landscape 3:2' },
]

const IDEA_TABS = [
  { value: 'ideas',   label: 'Story Ideas' },
  { value: 'titles',  label: 'Titles' },
  { value: 'outline', label: 'Chapter Outline' },
]

const GENRES = ['Fantasy', 'Romance', 'Action', 'Adventure', 'Mystery', 'Thriller', 'Sci-Fi', 'Horror', 'Comedy', 'Drama', 'Slice of Life', 'Historical']

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/90 mb-2">{label}</label>
      {children}
      {hint && <p className="text-white/40 text-xs mt-1">{hint}</p>}
    </div>
  )
}

const selectCls =
  'w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm'
const inputCls = selectCls
const textareaCls = selectCls + ' resize-none'

function QuotaBar({ label, quota }) {
  if (!quota) return null
  const pct = quota.limit > 0 ? Math.min(100, (quota.used_today / quota.limit) * 100) : 0
  return (
    <div className="flex items-center gap-3 text-xs text-white/50">
      <span className="font-medium text-white/70 whitespace-nowrap">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-orange-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="whitespace-nowrap">{quota.used_today}/{quota.limit}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Image Studio
// ---------------------------------------------------------------------------

function ImageStudio({ stories }) {
  const [storyId, setStoryId] = useState(stories[0]?.id || '')
  const [imageType, setImageType] = useState('cover')
  const [provider, setProvider] = useState('local')
  const [size, setSize] = useState('1024x1024')
  const [style, setStyle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')

  const [generating, setGenerating] = useState(false)
  const [polling, setPolling] = useState(false)
  const [gallery, setGallery] = useState([])
  const [chapters, setChapters] = useState([])
  const [chapterTarget, setChapterTarget] = useState('')
  const [pageOrder, setPageOrder] = useState('')
  const [loading, setLoading] = useState(true)
  const pollRef = useRef(null)

  const selectedStory = stories.find((s) => s.id === storyId)

  useEffect(() => {
    loadGallery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId])

  useEffect(() => {
    return () => clearInterval(pollRef.current)
  }, [])

  async function loadGallery() {
    setLoading(true)
    try {
      const res = await aiService.listImages(storyId ? { story_id: storyId } : {})
      setGallery(res.results ?? [])
    } catch {
      toast.error('Failed to load AI image gallery.')
    } finally {
      setLoading(false)
    }
  }

  async function loadChapters() {
    if (!selectedStory?.slug) return
    try {
      const res = await storyService.getChapters(selectedStory.slug)
      setChapters(res.data ?? [])
    } catch {
      setChapters([])
    }
  }

  function startPolling(genId) {
    clearInterval(pollRef.current)
    setPolling(true)
    pollRef.current = setInterval(async () => {
      try {
        const res = await aiService.getGeneration(genId)
        const gen = res.data
        if (gen.status === 'completed' || gen.status === 'failed') {
          clearInterval(pollRef.current)
          setPolling(false)
          setGenerating(false)
          if (gen.status === 'completed') {
            toast.success('Image generated!')
            loadGallery()
          } else {
            toast.error(gen.error_message || 'Generation failed.')
          }
        }
      } catch {
        clearInterval(pollRef.current)
        setPolling(false)
        setGenerating(false)
      }
    }, 3000)
  }

  async function handleGenerate() {
    if (!storyId) return toast.error('Pick a story first.')
    if (!prompt.trim()) return toast.error('Write an image prompt first.')
    const [width, height] = size.split('x').map(Number)
    setGenerating(true)
    try {
      const res = await aiService.generateImage({
        prompt,
        negative_prompt: negativePrompt,
        style,
        provider,
        width,
        height,
        image_type: imageType,
        story_id: storyId,
      })
      toast.success('Generation started.')
      startPolling(res.data.id)
    } catch (err) {
      setGenerating(false)
      toast.error(err?.response?.data?.error?.message || 'Failed to start generation.')
    }
  }

  async function handleApplyCover(img) {
    try {
      await aiService.applyImage(img.id, { target: 'cover', story_id: storyId })
      toast.success('Applied as story cover.')
      loadGallery()
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to apply image.')
    }
  }

  async function handleApplyChapter(img) {
    if (!chapterTarget) return toast.error('Select a target chapter first.')
    try {
      await aiService.applyImage(img.id, {
        target: 'chapter',
        story_id: storyId,
        chapter_id: chapterTarget,
        page_order: pageOrder ? Number(pageOrder) : null,
      })
      toast.success('Added to chapter.')
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to add to chapter.')
    }
  }

  async function handleDelete(img) {
    if (!window.confirm('Delete this generated image?')) return
    try {
      await aiService.deleteImage(img.id)
      setGallery((prev) => prev.filter((i) => i.id !== img.id))
      toast.success('Image deleted.')
    } catch {
      toast.error('Failed to delete image.')
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left: generator form */}
      <div className="space-y-6">
        <div className="glass-dark rounded-2xl p-6 border border-white/5 space-y-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Wand2 size={18} className="text-orange-400" /> Generate an Image
          </h2>

          <Field label="Story">
            <select value={storyId} onChange={(e) => setStoryId(e.target.value)} className={selectCls}>
              <option value="" className="bg-gray-900">Select a story…</option>
              {stories.map((s) => (
                <option key={s.id} value={s.id} className="bg-gray-900">{s.title}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Image type">
              <select value={imageType} onChange={(e) => setImageType(e.target.value)} className={selectCls}>
                {IMAGE_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-gray-900">{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Provider">
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className={selectCls}>
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value} className="bg-gray-900">{p.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Size">
              <select value={size} onChange={(e) => setSize(e.target.value)} className={selectCls}>
                {SIZES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-gray-900">{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Style" hint="anime, comic, realistic, ink…">
              <input
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="e.g. dark fantasy anime"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Prompt" hint="Describe the scene, characters, mood, and composition.">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="A lone swordsman stands before a burning citadel at dusk, embers drifting in the wind…"
              className={textareaCls}
            />
          </Field>

          <Field label="Negative prompt">
            <input
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, low quality, extra limbs…"
              className={inputCls}
            />
          </Field>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary w-full justify-center gap-2"
          >
            {generating ? <Spinner size="sm" className="text-current" /> : <Sparkles size={18} />}
            {generating ? 'Generating…' : 'Generate Image'}
          </button>

          {generating && (
            <p className="text-white/40 text-xs flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              This can take 10–30 seconds. This page stays open while we work.
            </p>
          )}
        </div>

        {/* Chapter target for applying images */}
        {gallery.length > 0 && (
          <div className="glass-dark rounded-2xl p-6 border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers size={16} className="text-orange-400" /> Add a page to a chapter
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Chapter">
                <div className="relative">
                  <select
                    value={chapterTarget}
                    onChange={(e) => setChapterTarget(e.target.value)}
                    onFocus={loadChapters}
                    className={selectCls + ' pr-10'}
                  >
                    <option value="" className="bg-gray-900">Choose…</option>
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id} className="bg-gray-900">
                        Ch. {c.chapter_number} · {c.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
              </Field>
              <Field label="Page order" hint="optional">
                <input
                  value={pageOrder}
                  onChange={(e) => setPageOrder(e.target.value.replace(/\D/g, ''))}
                  placeholder="auto"
                  className={inputCls}
                />
              </Field>
            </div>
            <p className="text-white/40 text-xs">
              Then click the <span className="text-orange-400">Add to chapter</span> button on any
              image below.
            </p>
          </div>
        )}
      </div>

      {/* Right: gallery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ImagePlus size={18} className="text-orange-400" /> Generated Gallery
          </h2>
          <button
            onClick={loadGallery}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : gallery.length === 0 ? (
          <div className="text-center py-16 glass-dark rounded-2xl border border-white/5">
            <ImageIcon size={36} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No AI images yet. Generate your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {gallery.map((img) => (
              <div key={img.id} className="glass-dark rounded-xl overflow-hidden border border-white/5 group">
                <div className="relative aspect-[3/4] bg-white/5">
                  <img src={img.image_url} alt={img.prompt} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDelete(img)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-500/80 text-white/80 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white/80 text-[10px] uppercase tracking-wide">
                    {img.image_type}
                  </span>
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-white/60 text-xs line-clamp-2">{img.prompt}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApplyCover(img)}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-medium transition-colors"
                    >
                      Use as cover
                    </button>
                    <button
                      onClick={() => handleApplyChapter(img)}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-medium transition-colors"
                    >
                      Add to chapter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Idea Studio
// ---------------------------------------------------------------------------

function IdeaStudio({ stories }) {
  const [tab, setTab] = useState('ideas')
  const [loading, setLoading] = useState(false)

  // Story ideas
  const [genre, setGenre] = useState('Fantasy')
  const [contentType, setContentType] = useState('novel')
  const [themes, setThemes] = useState('')
  const [tone, setTone] = useState('')
  const [ideas, setIdeas] = useState([])

  // Titles
  const [premise, setPremise] = useState('')
  const [titleStyle, setTitleStyle] = useState('')
  const [titles, setTitles] = useState([])

  // Outline
  const [outlinePremise, setOutlinePremise] = useState('')
  const [chapterCount, setChapterCount] = useState(8)
  const [outline, setOutline] = useState([])

  async function handleIdeas() {
    setLoading(true)
    setIdeas([])
    try {
      const res = await aiService.generateIdeas({
        genre,
        content_type: contentType,
        themes,
        tone,
        count: 5,
        story_id: stories[0]?.id || null,
      })
      setIdeas(res.data)
      toast.success(`${res.data.length} ideas ready.`)
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to generate ideas.')
    } finally {
      setLoading(false)
    }
  }

  async function handleTitles() {
    if (!premise.trim()) return toast.error('Write a premise first.')
    setLoading(true)
    setTitles([])
    try {
      const res = await aiService.generateTitles({ premise, style: titleStyle, count: 8 })
      setTitles(res.data)
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to generate titles.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOutline() {
    if (!outlinePremise.trim()) return toast.error('Write a premise first.')
    setLoading(true)
    setOutline([])
    try {
      const res = await aiService.generateOutline({ premise: outlinePremise, chapter_count: chapterCount })
      setOutline(res.data)
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to generate outline.')
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    'w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm'

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left: controls */}
      <div className="space-y-6">
        <div className="glass-dark rounded-2xl p-2 border border-white/5 flex gap-1">
          {IDEA_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.value
                  ? 'bg-orange-500/20 text-orange-300'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'ideas' && (
          <div className="glass-dark rounded-2xl p-6 border border-white/5 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-orange-400" /> Brainstorm Story Ideas
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Genre">
                <select value={genre} onChange={(e) => setGenre(e.target.value)} className={selectCls}>
                  {GENRES.map((g) => (
                    <option key={g} value={g} className="bg-gray-900">{g}</option>
                  ))}
                </select>
              </Field>
              <Field label="Content type">
                <select value={contentType} onChange={(e) => setContentType(e.target.value)} className={selectCls}>
                  {['novel', 'short_story', 'web_novel', 'comic', 'manga', 'manhua'].map((c) => (
                    <option key={c} value={c} className="bg-gray-900">{c.replace('_', ' ')}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Themes" hint="comma separated: betrayal, found family, time travel…">
              <input value={themes} onChange={(e) => setThemes(e.target.value)} placeholder="e.g. magic, war, redemption" className={inputBase} />
            </Field>
            <Field label="Tone">
              <input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="dark, hopeful, comedic…" className={inputBase} />
            </Field>
            <button onClick={handleIdeas} disabled={loading} className="btn-primary w-full justify-center gap-2">
              {loading ? <Spinner size="sm" className="text-current" /> : <Wand2 size={18} />}
              {loading ? 'Thinking…' : 'Generate Story Ideas'}
            </button>
          </div>
        )}

        {tab === 'titles' && (
          <div className="glass-dark rounded-2xl p-6 border border-white/5 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <PenLine size={18} className="text-orange-400" /> Title Suggestions
            </h2>
            <Field label="Story premise">
              <textarea value={premise} onChange={(e) => setPremise(e.target.value)} rows={4}
                placeholder="A disgraced knight must unite rival houses before the winter ends…" className={textareaCls} />
            </Field>
            <Field label="Style hint">
              <input value={titleStyle} onChange={(e) => setTitleStyle(e.target.value)} placeholder="one word, epic, literary…" className={inputBase} />
            </Field>
            <button onClick={handleTitles} disabled={loading} className="btn-primary w-full justify-center gap-2">
              {loading ? <Spinner size="sm" className="text-current" /> : <PenLine size={18} />}
              {loading ? 'Writing…' : 'Generate Titles'}
            </button>
          </div>
        )}

        {tab === 'outline' && (
          <div className="glass-dark rounded-2xl p-6 border border-white/5 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BookOpen size={18} className="text-orange-400" /> Chapter Outline
            </h2>
            <Field label="Story premise">
              <textarea value={outlinePremise} onChange={(e) => setOutlinePremise(e.target.value)} rows={4}
                placeholder="A thief steals a relic that starts speaking to her…" className={textareaCls} />
            </Field>
            <Field label="Chapters">
              <select value={chapterCount} onChange={(e) => setChapterCount(Number(e.target.value))} className={selectCls}>
                {[4, 8, 12, 16, 24].map((n) => (
                  <option key={n} value={n} className="bg-gray-900">{n} chapters</option>
                ))}
              </select>
            </Field>
            <button onClick={handleOutline} disabled={loading} className="btn-primary w-full justify-center gap-2">
              {loading ? <Spinner size="sm" className="text-current" /> : <BookOpen size={18} />}
              {loading ? 'Planning…' : 'Generate Outline'}
            </button>
          </div>
        )}
      </div>

      {/* Right: results */}
      <div className="glass-dark rounded-2xl p-6 border border-white/5 min-h-[300px]">
        {tab === 'ideas' && (
          <>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4">Idea Results</h3>
            {loading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : ideas.length === 0 ? (
              <EmptyState icon={Sparkles} text="Generated story ideas will appear here." />
            ) : (
              <div className="space-y-4">
                {ideas.map((idea, i) => (
                  <div key={i} className="rounded-xl bg-white/5 border border-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-white font-semibold">{idea.title}</h4>
                      <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 text-xs">{idea.genre}</span>
                    </div>
                    <p className="text-white/60 text-sm mt-2 leading-relaxed">{idea.premise}</p>
                    {idea.logline && <p className="text-white/40 text-sm italic mt-2">{idea.logline}</p>}
                    {Array.isArray(idea.tags) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {idea.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'titles' && (
          <>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4">Title Results</h3>
            {loading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : titles.length === 0 ? (
              <EmptyState icon={PenLine} text="Title suggestions will appear here." />
            ) : (
              <div className="space-y-3">
                {titles.map((t, i) => (
                  <div key={i} className="rounded-xl bg-white/5 border border-white/5 p-4 flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-300 text-sm font-semibold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="text-white font-semibold">{t.title}</h4>
                      {t.rationale && <p className="text-white/40 text-sm mt-1">{t.rationale}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'outline' && (
          <>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4">Outline Results</h3>
            {loading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : outline.length === 0 ? (
              <EmptyState icon={BookOpen} text="Chapter outline will appear here." />
            ) : (
              <ol className="space-y-3">
                {outline.map((c) => (
                  <li key={c.number} className="rounded-xl bg-white/5 border border-white/5 p-4">
                    <h4 className="text-white font-semibold">Ch. {c.number} · {c.title}</h4>
                    {c.summary && <p className="text-white/50 text-sm mt-1">{c.summary}</p>}
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="text-center py-16">
      <Icon size={32} className="text-white/20 mx-auto mb-3" />
      <p className="text-white/40 text-sm">{text}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AiStudioPage() {
  const { user } = useAuth()
  const [stories, setStories] = useState([])
  const [usage, setUsage] = useState(null)
  const [loadingStories, setLoadingStories] = useState(true)

  useEffect(() => {
    if (user?.role !== 'creator' && user?.role !== 'admin') {
      setLoadingStories(false)
      return
    }
    ;(async () => {
      try {
        const [storiesRes, usageRes] = await Promise.all([
          storyService.getMyStories(),
          aiService.getUsage(),
        ])
        setStories(storiesRes.results ?? storiesRes.data ?? [])
        setUsage(usageRes)
      } catch {
        toast.error('Failed to load AI studio data.')
      } finally {
        setLoadingStories(false)
      }
    })()
  }, [user])

  const isCreator = user?.role === 'creator' || user?.role === 'admin'

  return (
    <MainLayout>
      <div className="page-container py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Sparkles size={28} className="text-orange-400" /> AI Studio
            </h1>
            <p className="text-white/50 mt-1">
              Generate cover art, chapter illustrations, story ideas, titles, and outlines.
            </p>
          </div>
          {usage && (
            <div className="glass-dark rounded-xl px-4 py-3 border border-white/5 w-full sm:w-72 space-y-2">
              <QuotaBar label="Images today" quota={usage.image_quota} />
              <QuotaBar label="Writing today" quota={usage.text_quota} />
            </div>
          )}
        </div>

        {!isCreator ? (
          <div className="text-center py-20 glass-dark rounded-2xl border border-white/5">
            <Wand2 size={40} className="text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Creators only</h3>
            <p className="text-white/40 text-sm">Upgrade to a creator account in Creator Studio to use AI tools.</p>
          </div>
        ) : loadingStories ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : (
          <ImageStudio stories={stories} />
        )}
      </div>
    </MainLayout>
  )
}
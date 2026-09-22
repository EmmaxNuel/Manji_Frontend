/**
 * OfficialPage – public landing page for MANJI's official story
 * "The World Beyond" and its anime adaptation.
 *
 * Route: /official
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Play, BookOpen, Users, ChevronRight, Star, Sparkles, X, Eye, ArrowRight } from 'lucide-react'
import { Badge, Spinner } from '../components/ui'
import ManjiGuide from '../components/manji/ManjiGuide'
import VideoPlayer from '../components/VideoPlayer'
import officialService from '../services/officialService'

const OFFICIAL_SERIES_SLUG = 'manji'
const OFFICIAL_ARC_SLUG = 'the-world-beyond'

export default function OfficialPage() {
  const [series, setSeries] = useState(null)
  const [season, setSeason] = useState(null)
  const [arc, setArc] = useState(null)
  const [story, setStory] = useState(null)
  const [chapters, setChapters] = useState([])
  const [animation, setAnimation] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('story')
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [selectedEpisode, setSelectedEpisode] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        // Load series -> season -> arc -> story -> chapters
        const seriesRes = await officialService.getSeries()
        if (cancelled) return
        const seriesData = seriesRes.data.results || seriesRes.data
        const manjiSeries = Array.isArray(seriesData) ? seriesData.find(s => s.slug === OFFICIAL_SERIES_SLUG) : seriesData
        if (!manjiSeries) throw new Error('Official series not found')
        setSeries(manjiSeries)

        // Get seasons for this series
        const seasonsRes = await officialService.getSeasons(manjiSeries.slug)
        if (cancelled) return
        const seasonsData = seasonsRes.data.results || seasonsRes.data
        const seasonData = Array.isArray(seasonsData) ? seasonsData[0] : seasonsData
        if (seasonData) setSeason(seasonData)

        // Get arcs for this season
        if (seasonData) {
          const arcsRes = await officialService.getArcs(seasonData.id)
          if (cancelled) return
          const arcsData = arcsRes.data.results || arcsRes.data
          const arcData = Array.isArray(arcsData) ? arcsData.find(a => a.slug === OFFICIAL_ARC_SLUG) : arcsData
          if (arcData) {
            setArc(arcData)

            // Get stories for this arc
            const storiesRes = await officialService.getStories(arcData.id)
            if (cancelled) return
            const storiesData = storiesRes.data.results || storiesRes.data
            const storyData = Array.isArray(storiesData) ? storiesData[0] : storiesData
            if (storyData) {
              setStory(storyData)

              // Get chapters for this story
              const chaptersRes = await officialService.getChapters(storyData.id)
              if (cancelled) return
              const chaptersData = chaptersRes.data.results || chaptersRes.data
              setChapters(Array.isArray(chaptersData) ? chaptersData : [])
            }
          }
        }

        // Get animations
        const animRes = await officialService.getAnimations()
        if (cancelled) return
        const animData = animRes.data.results || animRes.data
        const manjiAnim = Array.isArray(animData) ? animData[0] : animData
        if (manjiAnim) {
          setAnimation(manjiAnim)

          // Get episodes for this animation
          const epRes = await officialService.getEpisodes(manjiAnim.id)
          if (cancelled) return
          const epData = epRes.data.results || epRes.data
          setEpisodes(Array.isArray(epData) ? epData : [])
        }

      } catch (err) {
        if (!cancelled) toast.error('Failed to load official content.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!series || !story) {
    return (
      <div className="card p-10 text-center text-white/60">
        <Sparkles size={32} className="mx-auto mb-3 text-orange-400" />
        <p>Official story is not available right now.</p>
      </div>
    )
  }

  const tabs = [
    { key: 'story', label: 'Story', icon: BookOpen },
    { key: 'episodes', label: 'Episodes', icon: Play },
    { key: 'characters', label: 'Characters', icon: Users },
  ]

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="card overflow-hidden">
        <div className="relative h-64 md:h-80 bg-gradient-to-br from-orange-600/20 via-[var(--color-bg)] to-purple-600/20">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] via-transparent to-transparent" />
          <div className="absolute top-4 left-4">
            <Badge variant="accent" className="text-xs font-bold uppercase tracking-widest">
              MANJI ORIGINAL
            </Badge>
          </div>
        </div>
        <div className="px-6 pb-6 -mt-16 relative">
          <div className="flex flex-col md:flex-row gap-6">
            {story.cover ? (
              <img
                src={story.cover}
                alt={story.title}
                className="w-32 h-48 object-cover rounded-xl border-2 border-[var(--color-border)] shadow-2xl flex-shrink-0"
              />
            ) : (
              <div className="w-32 h-48 rounded-xl border-2 border-[var(--color-border)] bg-white/5 flex items-center justify-center flex-shrink-0">
                <BookOpen size={32} className="text-white/20" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{story.title}</h1>
              <p className="text-white/60 mt-2 text-sm leading-relaxed">{story.description}</p>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Link to={`/stories/${story.slug}`} className="btn-primary text-sm px-5 justify-center">
                  <BookOpen size={16} className="mr-1.5" /> Read Story
                </Link>
                <Link to={`/chapters/${chapters[0]?.id}`} className="btn-ghost text-sm px-5 justify-center border border-white/20">
                  <Play size={16} className="mr-1.5" /> Start Reading
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === key
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'story' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chapters.slice(0, 6).map((chapter) => (
              <Link
                key={chapter.id}
                to={`/chapters/${chapter.chapter?.id || chapter.id}`}
                className="card p-4 hover:border-orange-500/30 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Star size={14} className="text-orange-400" />
                  <span className="text-xs text-white/50 font-mono">Ch. {chapter.chapter?.chapter_number || chapter.order}</span>
                </div>
                <h3 className="text-white font-semibold text-sm group-hover:text-orange-400 transition-colors line-clamp-1">
                  {chapter.chapter?.title || chapter.title}
                </h3>
                <p className="text-white/40 text-xs mt-1 line-clamp-2">
                  {chapter.chapter?.content ? chapter.chapter.content.substring(0, 100) + '...' : chapter.chapter?.description || 'No preview available'}
                </p>
                <button
                  onClick={(e) => { e.preventDefault(); setSelectedChapter(chapter); }}
                  className="mt-3 w-full btn-ghost text-sm justify-center"
                >
                  <Eye size={14} className="mr-1.5" /> Read Chapter
                </button>
              </Link>
            ))}
          </div>
          {chapters.length > 6 && (
            <div className="text-center">
              <Link to={`/stories/${story.slug}`} className="text-orange-400 text-sm hover:text-orange-300">
                View all chapters <ChevronRight size={14} className="inline" />
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'episodes' && (
        <div className="space-y-4">
          {episodes.length === 0 ? (
            <ManjiGuide
              expression="thinking"
              size="md"
              animated="bounce"
              title="No episodes yet"
              body="The official anime is in production. Episodes will appear here as they are released."
            >
              <span className="text-xs text-white/40">Stay tuned.</span>
            </ManjiGuide>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {episodes.map((ep) => (
                <div key={ep.id} className="card p-5 hover:border-orange-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-orange-400">EP. {ep.episode_number}</span>
                    <Badge variant={ep.is_published ? 'success' : 'default'}>
                      {ep.is_published ? 'Published' : 'Coming Soon'}
                    </Badge>
                  </div>
                  <h3 className="text-white font-semibold text-sm">{ep.title}</h3>
                  <p className="text-white/50 text-xs mt-1 line-clamp-2">{ep.description}</p>
                  {ep.thumbnail && (
                    <img src={ep.thumbnail} alt={ep.title} className="w-full h-32 object-cover rounded-lg mt-3" />
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => setSelectedEpisode(ep)}
                      className="flex-1 btn-primary text-sm justify-center"
                      disabled={!ep.is_published}
                    >
                      <Play size={14} className="mr-1.5" /> {ep.is_published ? 'Watch' : 'Coming Soon'}
                    </button>
                    <button
                      onClick={() => setSelectedEpisode(ep)}
                      className="btn-ghost text-sm px-3"
                      title="Episode Details"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'characters' && (
        <div className="space-y-4">
          <ManjiGuide
            expression="excited"
            size="md"
            animated="bounce"
            title="Characters coming soon"
            body="Character profiles from The World Beyond will appear here."
          />
        </div>
      )}

      {/* Chapter Reading Modal */}
      {selectedChapter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true" onClick={() => setSelectedChapter(null)}>
          <div className="relative w-full max-w-3xl max-h-[90vh] rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-orange-400">Ch. {selectedChapter.chapter?.chapter_number || selectedChapter.order}</span>
                <h3 className="text-white font-semibold">{selectedChapter.chapter?.title || selectedChapter.title}</h3>
              </div>
              <button onClick={() => setSelectedChapter(null)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-white/90 leading-relaxed">
                {selectedChapter.chapter?.content || selectedChapter.chapter?.description || 'Content coming soon...'}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-[var(--color-border)]">
              <Link to={`/chapters/${selectedChapter.chapter?.id || selectedChapter.id}`} className="btn-primary inline-flex justify-center">
                <BookOpen size={16} className="mr-1.5" /> Continue Reading on Story Page
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Episode Watch/Details Modal */}
      {selectedEpisode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true" onClick={() => setSelectedEpisode(null)}>
          <div className="relative w-full max-w-3xl max-h-[90vh] rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-orange-400">EP. {selectedEpisode.episode_number}</span>
                <Badge variant={selectedEpisode.is_published ? 'success' : 'default'}>
                  {selectedEpisode.is_published ? 'Published' : 'Coming Soon'}
                </Badge>
              </div>
              <button onClick={() => setSelectedEpisode(null)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedEpisode.video_url || selectedEpisode.video_file ? (
                <VideoPlayer
                  src={selectedEpisode.video_url || selectedEpisode.video_file}
                  poster={selectedEpisode.thumbnail}
                  title={selectedEpisode.title}
                  duration={selectedEpisode.duration}
                />
              ) : (
                <div className="relative w-full rounded-xl border border-dashed border-white/20 bg-white/5 aspect-video flex flex-col items-center justify-center gap-3 text-center">
                  <Play size={32} className="text-orange-400" />
                  <p className="text-white/70 text-sm font-medium">Video preview is not available yet.</p>
                  <p className="text-white/40 text-xs">The episode will appear here when its video is published.</p>
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-white font-semibold text-lg">{selectedEpisode.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{selectedEpisode.description}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                  <span>Duration: {selectedEpisode.duration ? `${selectedEpisode.duration}s` : 'TBD'}</span>
                  <span>•</span>
                  <span>Status: {selectedEpisode.is_published ? 'Published' : 'Coming Soon'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
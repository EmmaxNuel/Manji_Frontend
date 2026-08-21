/**
 * StoryDetailPage.jsx
 *
 * Full story detail page: cover, metadata, actions (like/bookmark/follow),
 * genre/tag chips, and the chapter list (table of contents).
 *
 * Route: /stories/:slug
 */

import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Heart, Bookmark, Bell, BellOff, Eye, BookOpen, Calendar,
  Clock, Globe, Edit3, ChevronLeft, ChevronRight, List,
  Share2, AlertCircle, Users, Sparkles,
} from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../context/AuthContext'
import { storyService } from '../../services/storyService'
import { Spinner, Avatar } from '../../components/ui'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n ?? 0)
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const STATUS_STYLE = {
  published:    'bg-green-500/20 text-green-400 border-green-500/30',
  completed:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  draft:        'bg-gray-500/20 text-gray-400 border-gray-500/30',
  hiatus:       'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  discontinued: 'bg-red-500/20 text-red-400 border-red-500/30',
}

function StatusBadge({ status }) {
  const cls = STATUS_STYLE[status] || STATUS_STYLE.draft
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${cls} capitalize`}>
      {status?.replace('_', ' ') || 'Unknown'}
    </span>
  )
}

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-white/60 text-sm">
      <Icon size={15} className="flex-shrink-0 text-white/40" />
      <span className="text-white/40">{label}:</span>
      <span className="text-white/80">{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chapter row in the ToC
// ---------------------------------------------------------------------------
function ChapterRow({ chapter, index }) {
  return (
    <Link
      to={`/chapters/${chapter.id}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
    >
      <span className="text-white/30 text-xs w-8 text-right flex-shrink-0">
        {chapter.chapter_number}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white/80 group-hover:text-white transition-colors text-sm truncate">
          {chapter.title}
        </p>
      </div>
      <div className="flex items-center gap-3 text-white/30 text-xs flex-shrink-0">
        {chapter.word_count > 0 && (
          <span>{fmt(chapter.word_count)} words</span>
        )}
        <span>{fmtDate(chapter.published_at)}</span>
        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function StoryDetailPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [story, setStory]       = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading]   = useState(true)
  const [chaptersLoading, setChaptersLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Optimistic action states
  const [liked,     setLiked]     = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [following,  setFollowing]  = useState(false)
  const [actioning,  setActioning]  = useState(null) // 'like'|'bookmark'|'follow'

  useEffect(() => {
    async function loadStory() {
      setLoading(true)
      try {
        const res = await storyService.getStory(slug)
        const s = res.data
        setStory(s)
        setLiked(s.is_liked)
        setLikesCount(s.likes_count)
        setBookmarked(s.is_bookmarked)
        setFollowing(s.is_following)
      } catch (err) {
        if (err?.response?.status === 404) setNotFound(true)
        else toast.error('Failed to load story.')
      } finally {
        setLoading(false)
      }
    }

    async function loadChapters() {
      setChaptersLoading(true)
      try {
        const res = await storyService.getChapters(slug)
        setChapters(res.data || [])
      } catch {
        // non-fatal
      } finally {
        setChaptersLoading(false)
      }
    }

    loadStory()
    loadChapters()
  }, [slug])

  async function handleLike() {
    if (!user) { toast.error('Sign in to like stories.'); return }
    setActioning('like')
    const prev = liked
    setLiked(!liked)
    setLikesCount((n) => n + (liked ? -1 : 1))
    try {
      await storyService.likeStory(slug)
    } catch {
      setLiked(prev)
      setLikesCount((n) => n + (prev ? 1 : -1))
      toast.error('Action failed.')
    } finally {
      setActioning(null)
    }
  }

  async function handleBookmark() {
    if (!user) { toast.error('Sign in to bookmark stories.'); return }
    setActioning('bookmark')
    const prev = bookmarked
    setBookmarked(!bookmarked)
    try {
      await storyService.bookmarkStory(slug)
      toast.success(prev ? 'Removed from bookmarks.' : 'Bookmarked!')
    } catch {
      setBookmarked(prev)
      toast.error('Action failed.')
    } finally {
      setActioning(null)
    }
  }

  async function handleFollow() {
    if (!user) { toast.error('Sign in to follow stories.'); return }
    setActioning('follow')
    const prev = following
    setFollowing(!following)
    try {
      await storyService.followStory(slug)
      toast.success(prev ? 'Unfollowed.' : 'Following! You will be notified of new chapters.')
    } catch {
      setFollowing(prev)
      toast.error('Action failed.')
    } finally {
      setActioning(null)
    }
  }

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  const firstChapterId = chapters[0]?.id

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-32">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (notFound || !story) {
    return (
      <MainLayout>
        <div className="page-container py-32 text-center">
          <AlertCircle size={48} className="text-white/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Story Not Found</h2>
          <p className="text-white/50 mb-6">This story doesn't exist or has been removed.</p>
          <Link to="/discover" className="btn-primary">Browse Stories</Link>
        </div>
      </MainLayout>
    )
  }

  const isAuthor = user?.id === story.author?.id || user?.id === story.author?.id

  return (
    <MainLayout>
      {/* Hero banner */}
      <div className="relative overflow-hidden">
        {/* Background blur from cover */}
        {story.cover && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-20"
            style={{ backgroundImage: `url(${story.cover})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />

        <div className="relative page-container py-12">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-white/50 hover:text-white text-sm mb-8 transition-colors"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover */}
            <div className="flex-shrink-0">
              <div className="w-44 h-60 md:w-52 md:h-72 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10">
                {story.cover ? (
                  <img src={story.cover} alt={story.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-500/30 to-purple-600/30 flex items-center justify-center">
                    <BookOpen size={40} className="text-white/40" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Content type + status */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {story.is_official && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <Sparkles size={12} /> Official Manji Story
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium border border-orange-500/30 capitalize">
                  {story.content_type?.replace('_', ' ')}
                </span>
                <StatusBadge status={story.status} />
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
                {story.title}
              </h1>

              {/* Author */}
              <Link
                to={`/profile/${story.author?.username}`}
                className="flex items-center gap-2 group w-fit mb-5"
              >
                <Avatar
                  src={story.author?.avatar}
                  username={story.author?.username}
                  size="sm"
                />
                <span className="text-white/70 group-hover:text-white text-sm transition-colors">
                  by <strong>{story.author?.username}</strong>
                </span>
              </Link>

              {/* Stats row */}
              <div className="flex items-center gap-5 mb-5 flex-wrap">
                <span className="flex items-center gap-1.5 text-white/60 text-sm">
                  <Eye size={15} /> {fmt(story.views_count)} views
                </span>
                <span className="flex items-center gap-1.5 text-white/60 text-sm">
                  <Heart size={15} /> {fmt(likesCount)} likes
                </span>
                <span className="flex items-center gap-1.5 text-white/60 text-sm">
                  <Users size={15} /> {fmt(story.followers_count)} followers
                </span>
                <span className="flex items-center gap-1.5 text-white/60 text-sm">
                  <BookOpen size={15} /> {story.chapters_count} chapters
                </span>
              </div>

              {/* Description */}
              <p className="text-white/70 leading-relaxed text-sm mb-6 max-w-2xl">
                {story.description}
              </p>

              {/* Genres */}
              {story.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {story.genres.map((g) => (
                    <span
                      key={g.id}
                      className="px-2.5 py-1 rounded-full text-xs font-medium text-white border"
                      style={{ background: g.color + '33', borderColor: g.color + '55', color: g.color }}
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {firstChapterId ? (
                  <Link to={`/chapters/${firstChapterId}`} className="btn-primary gap-2">
                    <BookOpen size={18} />
                    Start Reading
                  </Link>
                ) : (
                  <button disabled className="btn-primary opacity-50 cursor-not-allowed gap-2">
                    <BookOpen size={18} />
                    No Chapters Yet
                  </button>
                )}

                <button
                  onClick={handleLike}
                  disabled={actioning === 'like'}
                  className={`btn-secondary gap-2 ${liked ? 'border-pink-500/50 text-pink-400' : ''}`}
                >
                  <Heart size={16} className={liked ? 'fill-pink-400' : ''} />
                  {fmt(likesCount)}
                </button>

                <button
                  onClick={handleBookmark}
                  disabled={actioning === 'bookmark'}
                  className={`btn-secondary gap-2 ${bookmarked ? 'border-yellow-500/50 text-yellow-400' : ''}`}
                >
                  <Bookmark size={16} className={bookmarked ? 'fill-yellow-400' : ''} />
                  {bookmarked ? 'Saved' : 'Save'}
                </button>

                <button
                  onClick={handleFollow}
                  disabled={actioning === 'follow'}
                  className={`btn-secondary gap-2 ${following ? 'border-green-500/50 text-green-400' : ''}`}
                >
                  {following ? <BellOff size={16} /> : <Bell size={16} />}
                  {following ? 'Following' : 'Follow'}
                </button>

                <button onClick={handleShare} className="btn-ghost p-2.5">
                  <Share2 size={16} />
                </button>

                {isAuthor && (
                  <Link to={`/create/${story.slug}/edit`} className="btn-ghost gap-2">
                    <Edit3 size={16} />
                    Edit
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="page-container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Chapter list */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <List size={18} className="text-orange-400" />
                Chapters
                <span className="text-white/30 text-sm font-normal">({story.chapters_count})</span>
              </h2>
              {isAuthor && (
                <Link to={`/create/${story.slug}/chapters`} className="text-orange-400 hover:text-orange-300 text-sm transition-colors">
                  + Add Chapter
                </Link>
              )}
            </div>

            {chaptersLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : chapters.length === 0 ? (
              <div className="text-center py-12 glass-dark rounded-xl border border-white/5">
                <BookOpen size={32} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No chapters published yet.</p>
              </div>
            ) : (
              <div className="glass-dark rounded-xl border border-white/10 divide-y divide-white/5 overflow-hidden">
                {chapters.map((ch, i) => (
                  <ChapterRow key={ch.id} chapter={ch} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar – story info */}
          <div className="space-y-6">
            <div className="glass-dark rounded-xl border border-white/10 p-5">
              <h3 className="text-white font-semibold mb-4">Story Info</h3>
              <div className="space-y-3">
                <MetaItem icon={BookOpen} label="Type"     value={story.content_type?.replace('_', ' ')} />
                <MetaItem icon={Globe}    label="Language" value={story.language?.toUpperCase()} />
                <MetaItem icon={Calendar} label="Published" value={fmtDate(story.published_at)} />
                <MetaItem icon={Calendar} label="Updated"   value={fmtDate(story.updated_at)} />
                {story.word_count > 0 && (
                  <MetaItem icon={FileTextIcon} label="Words" value={story.word_count.toLocaleString()} />
                )}
              </div>
            </div>

            {/* Tags */}
            {story.tags?.length > 0 && (
              <div className="glass-dark rounded-xl border border-white/10 p-5">
                <h3 className="text-white font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {story.tags.map((t) => (
                    <span
                      key={t.id}
                      className="px-2.5 py-1 rounded-full bg-white/5 text-white/50 text-xs border border-white/10 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
                    >
                      #{t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </MainLayout>
  )
}

// little alias so we don't need another import
function FileTextIcon(props) {
  return <BookOpen {...props} />
}

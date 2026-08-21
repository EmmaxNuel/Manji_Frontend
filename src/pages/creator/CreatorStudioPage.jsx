/**
 * CreatorStudioPage.jsx
 *
 * The creator dashboard. Shows the user's stories, stats, and quick actions.
 * Requires the user to have the "creator" or "admin" role; readers see an
 * upgrade prompt instead.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  BookOpen, PenSquare, Eye, Heart, Users, BarChart2,
  Plus, Edit3, Trash2, Globe, Lock, Clock, ChevronRight,
  TrendingUp, FileText, AlertCircle, Sparkles, Send, RotateCcw,
} from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../context/AuthContext'
import { storyService } from '../../services/storyService'
import { userService } from '../../services/userService'
import { Spinner, Badge } from '../../components/ui'
import { AreaChart, ProgressBar } from '../../components/ui/charts'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatCard({ icon: Icon, label, value, color = 'text-orange-400' }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-white/50 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-white text-2xl font-bold">{value ?? '—'}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    draft:        { label: 'Draft',     cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    published:    { label: 'Published', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
    completed:    { label: 'Completed', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    hiatus:       { label: 'Hiatus',    cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    discontinued: { label: 'Discontinued', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  }
  const s = map[status] || map.draft
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${s.cls}`}>
      {s.label}
    </span>
  )
}

function formatDayLabels(days = []) {
  return days.map((d) => {
    const date = new Date(`${d}T00:00:00`)
    if (Number.isNaN(date.getTime())) return d
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  })
}

// ---------------------------------------------------------------------------
// Performance chart card
// ---------------------------------------------------------------------------

function AnalyticsCard({ icon: Icon, label, points, labels, color, accent }) {
  const total = (points || []).reduce((sum, n) => sum + n, 0)
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-white/5 ${accent}`}>
            <Icon size={16} />
          </div>
          <span className="text-white/60 text-sm font-medium">{label}</span>
        </div>
        <span className="text-white font-bold text-lg">{total.toLocaleString()}</span>
      </div>
      <AreaChart points={points} labels={labels} color={color} compact />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Per-story performance table
// ---------------------------------------------------------------------------

function StoryPerformanceTable({ stories }) {
  if (!stories?.length) return null
  const maxViews = Math.max(...stories.map((s) => s.views_count), 1)
  const maxLikes = Math.max(...stories.map((s) => s.likes_count), 1)
  const maxFollowers = Math.max(...stories.map((s) => s.followers_count), 1)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Story Performance</h3>
        <span className="text-white/40 text-xs">{stories.length} stories</span>
      </div>
      <div className="space-y-4">
        {stories.map((story) => (
          <div key={story.id} className="flex items-center gap-4">
            <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
              {story.cover ? (
                <img src={story.cover} alt={story.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen size={16} className="text-white/30" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-white font-medium text-sm truncate">{story.title}</p>
                <span className="text-white/50 text-xs whitespace-nowrap">
                  <Eye size={12} className="inline mr-0.5 -mt-0.5" /> {story.views_count.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-white/40">
                <span className="flex items-center gap-1.5 flex-1">
                  <Heart size={12} className="text-pink-400" />
                  <ProgressBar value={maxLikes ? (story.likes_count / maxLikes) * 100 : 0} color="bg-pink-500" className="flex-1" />
                  <span className="w-8 text-right">{story.likes_count}</span>
                </span>
                <span className="flex items-center gap-1.5 flex-1">
                  <Users size={12} className="text-green-400" />
                  <ProgressBar value={maxFollowers ? (story.followers_count / maxFollowers) * 100 : 0} color="bg-green-500" className="flex-1" />
                  <span className="w-8 text-right">{story.followers_count}</span>
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/40">
                <Eye size={12} className="text-blue-400" />
                <ProgressBar value={maxViews ? (story.views_count / maxViews) * 100 : 0} color="bg-blue-500" className="flex-1" />
                <span className="w-8 text-right">{story.views_count.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Upgrade prompt for readers
// ---------------------------------------------------------------------------
function UpgradePrompt({ onUpgrade, upgrading }) {
  return (
    <MainLayout>
      <div className="page-container py-24">
        <div className="max-w-lg mx-auto text-center">
          <div className="glass-dark rounded-2xl p-10 border border-orange-500/20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-orange-500/20 flex items-center justify-center">
              <PenSquare size={32} className="text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Become a Creator</h1>
            <p className="text-white/60 leading-relaxed mb-8">
              Upgrade your account to unlock Creator Studio and start publishing
              your stories, novels, and manga on Manji.
            </p>
            <ul className="text-left text-white/70 text-sm space-y-2 mb-8">
              {[
                'Create and publish unlimited stories',
                'Track views, likes, and followers',
                'Upload covers and manage chapters',
                'Build your reader community',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={onUpgrade}
              disabled={upgrading}
              className="btn-primary w-full justify-center"
            >
              {upgrading ? <Spinner size="sm" /> : null}
              {upgrading ? 'Upgrading…' : 'Upgrade to Creator — Free'}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

// ---------------------------------------------------------------------------
// Story row in the table
// ---------------------------------------------------------------------------
function StoryRow({ story, onDelete, onStatusChange }) {
  const [deleting, setDeleting] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const isPublished = story.status === 'published' || story.status === 'completed'

  async function handleDelete() {
    if (!window.confirm(`Delete "${story.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await storyService.deleteStory(story.slug)
      toast.success('Story deleted.')
      onDelete(story.id)
    } catch {
      toast.error('Failed to delete story.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleTogglePublish() {
    const verb = isPublished ? 'Unpublish' : 'Publish'
    if (!window.confirm(`${verb} "${story.title}"?`)) return
    setPublishing(true)
    try {
      if (isPublished) {
        await storyService.unpublishStory(story.slug)
        toast.success('Story unpublished and saved as a draft.')
        onStatusChange(story.id, 'draft')
      } else {
        await storyService.publishStory(story.slug)
        toast.success('Story published! 🎉')
        onStatusChange(story.id, 'published')
      }
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update story status.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors border border-white/5 group">
      {/* Cover thumbnail */}
      <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
        {story.cover ? (
          <img src={story.cover} alt={story.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={20} className="text-white/30" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-semibold truncate">{story.title}</p>
          <StatusBadge status={story.status} />
        </div>
        <div className="flex items-center gap-4 mt-1 text-white/40 text-xs">
          <span className="capitalize">{story.content_type?.replace('_', ' ')}</span>
          <span className="flex items-center gap-1"><Eye size={12} /> {story.views_count}</span>
          <span className="flex items-center gap-1"><Heart size={12} /> {story.likes_count}</span>
          <span className="flex items-center gap-1"><BookOpen size={12} /> {story.chapters_count} ch</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={handleTogglePublish}
          disabled={publishing}
          className={`p-2 rounded-lg transition-colors ${
            isPublished
              ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
          }`}
          title={isPublished ? 'Unpublish story' : 'Publish story'}
        >
          {publishing ? <Spinner size="sm" /> : isPublished ? <RotateCcw size={16} /> : <Send size={16} />}
        </button>
        <Link
          to={`/create/${story.slug}/chapters`}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          title="Manage chapters"
        >
          <FileText size={16} />
        </Link>
        <Link
          to={`/create/${story.slug}/edit`}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          title="Edit story"
        >
          <Edit3 size={16} />
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
          title="Delete story"
        >
          {deleting ? <Spinner size="sm" /> : <Trash2 size={16} />}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function CreatorStudioPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [stories, setStories] = useState([])
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  const isCreator = user?.role === 'creator' || user?.role === 'admin'

  useEffect(() => {
    if (!isCreator) return
    fetchData()
  }, [isCreator])

  async function fetchData() {
    setLoading(true)
    try {
      const [storiesRes, statsRes, analyticsRes] = await Promise.all([
        storyService.getMyStories(),
        storyService.getMyStats(),
        storyService.getMyAnalytics(),
      ])
      setStories(storiesRes.results ?? storiesRes.data ?? [])
      setStats(statsRes)
      setAnalytics(analyticsRes)
    } catch {
      toast.error('Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const res = await userService.becomeCreator()
      updateUser(res.data)
      toast.success('You are now a creator! Welcome to Creator Studio. 🎉')
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Upgrade failed.'
      toast.error(msg)
    } finally {
      setUpgrading(false)
    }
  }

  function handleStoryDeleted(storyId) {
    setStories((prev) => prev.filter((s) => s.id !== storyId))
  }

  function handleStatusChange(storyId, status) {
    setStories((prev) => prev.map((s) => (s.id === storyId ? { ...s, status } : s)))
  }

  // Reader sees upgrade prompt
  if (!isCreator) {
    return <UpgradePrompt onUpgrade={handleUpgrade} upgrading={upgrading} />
  }

  const totalViews = stats?.total_views ?? 0
  const totalLikes = stats?.total_likes ?? 0
  const totalFollowers = stats?.total_followers ?? 0
  const totalChapters = stats?.total_chapters ?? 0

  return (
    <MainLayout>
      <div className="page-container py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Creator Studio</h1>
            <p className="text-white/50 mt-1">Manage your stories and track performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/create/ai" className="btn-secondary gap-2">
              <Sparkles size={18} className="text-orange-400" />
              AI Studio
            </Link>
            <Link to="/create/new" className="btn-primary gap-2">
              <Plus size={18} />
              New Story
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={BookOpen}  label="Stories"   value={stats?.total_stories ?? stories.length}   color="text-orange-400" />
          <StatCard icon={Eye}       label="Views"     value={totalViews.toLocaleString()}     color="text-blue-400" />
          <StatCard icon={Heart}     label="Likes"     value={totalLikes.toLocaleString()}     color="text-pink-400" />
          <StatCard icon={Users}     label="Followers" value={totalFollowers.toLocaleString()} color="text-green-400" />
        </div>

        {/* Analytics / performance */}
        {analytics && (
          <div className="mb-10">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart2 size={20} className="text-orange-400" />
                  Performance
                </h2>
                <p className="text-white/40 text-sm mt-1">Views, likes, and followers over the last 14 days</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <AnalyticsCard
                icon={Eye}
                label="Views"
                points={analytics.views}
                labels={formatDayLabels(analytics.days)}
                color="#3b82f6"
                accent="text-blue-400"
              />
              <AnalyticsCard
                icon={Heart}
                label="Likes"
                points={analytics.likes}
                labels={formatDayLabels(analytics.days)}
                color="#ec4899"
                accent="text-pink-400"
              />
              <AnalyticsCard
                icon={Users}
                label="Followers"
                points={analytics.followers}
                labels={formatDayLabels(analytics.days)}
                color="#22c55e"
                accent="text-green-400"
              />
            </div>

            <StoryPerformanceTable stories={analytics.stories} />
          </div>
        )}

        {/* Stories list */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Your Stories</h2>
          <span className="text-white/40 text-sm">{stories.length} total · {totalChapters} chapters</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20 glass-dark rounded-2xl border border-white/5">
            <PenSquare size={40} className="text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No stories yet</h3>
            <p className="text-white/40 text-sm mb-6">Create your first story and start building your audience.</p>
            <Link to="/create/new" className="btn-primary gap-2 inline-flex">
              <Plus size={16} />
              Create Your First Story
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stories.map((story) => (
              <StoryRow key={story.id} story={story} onDelete={handleStoryDeleted} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

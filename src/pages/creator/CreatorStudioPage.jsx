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
  const iconBgStyle = {
    background: 'var(--color-input-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.75rem',
    padding: '0.75rem',
    color: color.replace('text-', ''),
  }
  return (
    <div className="card p-5 flex items-center gap-4">
      <div style={iconBgStyle}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-secondary">{label}</p>
        <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{value ?? '—'}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    draft:        { label: 'Draft',     cls: 'badge-default' },
    published:    { label: 'Published', cls: 'badge-success' },
    completed:    { label: 'Completed', cls: 'badge-primary' },
    hiatus:       { label: 'Hiatus',    cls: 'badge-warning' },
    discontinued: { label: 'Discontinued', cls: 'badge-danger' },
  }
  const s = map[status] || map.draft
  return <Badge variant={s.cls}>{s.label}</Badge>
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
  const iconBgStyle = {
    background: 'var(--color-input-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    padding: '0.5rem',
    color: accent.replace('text-', ''),
  }
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div style={iconBgStyle}>
            <Icon size={16} />
          </div>
          <span className="text-sm font-medium text-secondary">{label}</span>
        </div>
        <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>{total.toLocaleString()}</span>
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
        <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Story Performance</h3>
        <span className="text-xs text-secondary">{stories.length} stories</span>
      </div>
      <div className="space-y-4">
        {stories.map((story) => (
          <div key={story.id} className="flex items-center gap-4">
            <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--color-input-bg)' }}>
              {story.cover ? (
                <img src={story.cover} alt={story.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen size={16} style={{ color: 'var(--color-text-muted)' }} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>{story.title}</p>
                <span className="text-xs whitespace-nowrap text-secondary">
                  <Eye size={12} style={{ color: '#ef4444' }} className="inline mr-0.5 -mt-0.5" /> {story.views_count.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-secondary">
                <span className="flex items-center gap-1.5 flex-1">
                  <Heart size={12} style={{ color: '#ec4899' }} />
                  <ProgressBar value={maxLikes ? (story.likes_count / maxLikes) * 100 : 0} color="bg-pink-500" className="flex-1" />
                  <span className="w-8 text-right">{story.likes_count}</span>
                </span>
                <span className="flex items-center gap-1.5 flex-1">
                  <Users size={12} style={{ color: '#22c55e' }} />
                  <ProgressBar value={maxFollowers ? (story.followers_count / maxFollowers) * 100 : 0} color="bg-green-500" className="flex-1" />
                  <span className="w-8 text-right">{story.followers_count}</span>
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-secondary">
                <Eye size={12} style={{ color: '#3b82f6' }} />
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
          <div className="rounded-2xl p-10" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
              <PenSquare size={32} style={{ color: 'var(--color-primary)' }} />
            </div>
            <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Become a Creator</h1>
            <p className="text-secondary leading-relaxed mb-8">
              Upgrade your account to unlock Creator Studio and start publishing
              your stories, novels, and manga on Manji.
            </p>
            <ul className="text-left text-sm space-y-2 mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              {[
                'Create and publish unlimited stories',
                'Track views, likes, and followers',
                'Upload covers and manage chapters',
                'Build your reader community',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--color-primary)' }} />
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

  const rowStyle = {
    background: 'var(--color-input-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.75rem',
    padding: '1rem',
    transition: 'all 0.2s',
  }
  const coverStyle = {
    background: 'var(--color-input-bg)',
    borderRadius: '0.5rem',
    width: '3rem',
    height: '4rem',
    overflow: 'hidden',
    flexShrink: 0,
  }
  const actionBtnStyle = (bgColor, textColor) => ({
    background: `color-mix(in srgb, ${bgColor} 10%, transparent)`,
    color: textColor,
    borderRadius: '0.5rem',
    padding: '0.5rem',
    transition: 'all 0.2s',
  })
  const actionBtnHover = (bgColor) => ({
    background: `color-mix(in srgb, ${bgColor} 20%, transparent)`,
  })

  return (
    <div style={rowStyle} className="flex items-center gap-4 group" onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-input-bg)'}>
      {/* Cover thumbnail */}
      <div style={coverStyle}>
        {story.cover ? (
          <img src={story.cover} alt={story.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={20} style={{ color: 'var(--color-text-muted)' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{story.title}</p>
          <StatusBadge status={story.status} />
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-secondary">
          <span className="capitalize">{story.content_type?.replace('_', ' ')}</span>
          <span className="flex items-center gap-1"><Eye size={12} style={{ color: '#ef4444' }} /> {story.views_count}</span>
          <span className="flex items-center gap-1"><Heart size={12} style={{ color: '#ec4899' }} /> {story.likes_count}</span>
          <span className="flex items-center gap-1"><BookOpen size={12} style={{ color: '#3b82f6' }} /> {story.chapters_count} ch</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={handleTogglePublish}
          disabled={publishing}
          style={isPublished ? actionBtnStyle('#f59e0b', '#f59e0b') : actionBtnStyle('#22c55e', '#22c55e')}
          onMouseEnter={(e) => {
            if (isPublished) e.currentTarget.style.background = 'color-mix(in srgb, #f59e0b 20%, transparent)'
            else e.currentTarget.style.background = 'color-mix(in srgb, #22c55e 20%, transparent)'
          }}
          onMouseLeave={(e) => {
            if (isPublished) e.currentTarget.style.background = 'color-mix(in srgb, #f59e0b 10%, transparent)'
            else e.currentTarget.style.background = 'color-mix(in srgb, #22c55e 10%, transparent)'
          }}
          title={isPublished ? 'Unpublish story' : 'Publish story'}
        >
          {publishing ? <Spinner size="sm" /> : isPublished ? <RotateCcw size={16} /> : <Send size={16} />}
        </button>
        <Link
          to={`/create/${story.slug}/chapters`}
          style={actionBtnStyle('var(--color-border)', 'var(--color-text-secondary)')}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.background = 'var(--color-bg-tertiary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--color-border) 10%, transparent)' }}
          title="Manage chapters"
        >
          <FileText size={16} />
        </Link>
        <Link
          to={`/create/${story.slug}/edit`}
          style={actionBtnStyle('var(--color-border)', 'var(--color-text-secondary)')}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.background = 'var(--color-bg-tertiary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--color-border) 10%, transparent)' }}
          title="Edit story"
        >
          <Edit3 size={16} />
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={actionBtnStyle('#ef4444', '#ef4444')}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, #ef4444 20%, transparent)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, #ef4444 10%, transparent)' }}
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
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Creator Studio</h1>
            <p className="text-secondary mt-1">Manage your stories and track performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/create/ai" className="btn-secondary gap-2">
              <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
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
          <StatCard icon={BookOpen}  label="Stories"   value={stats?.total_stories ?? stories.length}   color="var(--color-primary)" />
          <StatCard icon={Eye}       label="Views"     value={totalViews.toLocaleString()}     color="#3b82f6" />
          <StatCard icon={Heart}     label="Likes"     value={totalLikes.toLocaleString()}     color="#ec4899" />
          <StatCard icon={Users}     label="Followers" value={totalFollowers.toLocaleString()} color="#22c55e" />
        </div>

        {/* Analytics / performance */}
        {analytics && (
          <div className="mb-10">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <BarChart2 size={20} style={{ color: 'var(--color-primary)' }} />
                  Performance
                </h2>
                <p className="text-sm text-secondary mt-1">Views, likes, and followers over the last 14 days</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <AnalyticsCard
                icon={Eye}
                label="Views"
                points={analytics.views}
                labels={formatDayLabels(analytics.days)}
                color="#3b82f6"
                accent="#3b82f6"
              />
              <AnalyticsCard
                icon={Heart}
                label="Likes"
                points={analytics.likes}
                labels={formatDayLabels(analytics.days)}
                color="#ec4899"
                accent="#ec4899"
              />
              <AnalyticsCard
                icon={Users}
                label="Followers"
                points={analytics.followers}
                labels={formatDayLabels(analytics.days)}
                color="#22c55e"
                accent="#22c55e"
              />
            </div>

            <StoryPerformanceTable stories={analytics.stories} />
          </div>
        )}

        {/* Stories list */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Your Stories</h2>
          <span className="text-sm text-secondary">{stories.length} total · {totalChapters} chapters</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '1.5rem' }}>
            <PenSquare size={40} style={{ color: 'var(--color-text-muted)' }} className="mx-auto mb-4" />
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>No stories yet</h3>
            <p className="text-sm text-secondary mb-6">Create your first story and start building your audience.</p>
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
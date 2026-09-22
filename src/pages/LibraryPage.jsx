/**
 * LibraryPage.jsx
 *
 * User's personal library with tabs:
 * - Currently Reading
 * - Bookmarked
 * - Following
 * - Completed
 * - History
 */

import { useEffect, useState } from 'react'
import { BookOpen, Bookmark, Bell, CheckCircle, Clock, Library } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import { useAuth } from '../context/AuthContext'
import { storyService } from '../services/storyService'
import StoryCard from '../components/ui/StoryCard'
import { Spinner } from '../components/ui'

const TABS = [
  { key: 'reading', label: 'Reading', icon: BookOpen },
  { key: 'bookmarks', label: 'Bookmarked', icon: Bookmark },
  { key: 'following', label: 'Following', icon: Bell },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
  { key: 'history', label: 'History', icon: Clock },
]

export default function LibraryPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('reading')
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadTab(activeTab)
  }, [activeTab, user])

  async function loadTab(tab) {
    setLoading(true)
    try {
      let res
      switch (tab) {
        case 'reading':
          res = await storyService.getLibraryReading()
          break
        case 'bookmarks':
          res = await storyService.getLibraryBookmarks()
          break
        case 'following':
          res = await storyService.getLibraryFollowing()
          break
        case 'completed':
          res = await storyService.getLibraryCompleted()
          break
        case 'history':
          res = await storyService.getLibraryHistory()
          break
        default:
          res = { results: [] }
      }
      setStories(res.results || res.data || [])
    } catch {
      // silent fail for now
    } finally {
      setLoading(false)
    }
  }

  const activeTabInfo = TABS.find((t) => t.key === activeTab)

  const tabActiveStyle = {
    background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
    color: 'var(--color-primary)',
    borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
  }
  const tabInactiveStyle = {
    background: 'var(--color-input-bg)',
    color: 'var(--color-text-secondary)',
    borderColor: 'var(--color-border)',
  }
  const tabInactiveHover = {
    color: 'var(--color-text)',
    background: 'var(--color-bg-tertiary)',
  }

  return (
    <MainLayout>
      <div className="page-container py-10">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>My Library</h1>
        <p className="text-secondary mb-8">Your reading list, bookmarks, and history.</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={isActive ? tabActiveStyle : tabInactiveStyle}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--color-text)'
                    e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--color-text-secondary)'
                    e.currentTarget.style.background = 'var(--color-input-bg)'
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border"
              >
                <Icon size={16} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '1rem' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-input-bg)' }}>
              {activeTabInfo && <activeTabInfo.icon size={28} style={{ color: 'var(--color-text-muted)' }} />}
            </div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>No stories here yet</h3>
            <p className="text-sm text-secondary mb-6">
              {activeTab === 'reading' && 'Start reading a story and it will appear here.'}
              {activeTab === 'bookmarks' && 'Bookmark stories you want to save for later.'}
              {activeTab === 'following' && 'Follow stories to get notified of new chapters.'}
              {activeTab === 'completed' && 'Stories you finish reading will show up here.'}
              {activeTab === 'history' && 'Your reading history will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
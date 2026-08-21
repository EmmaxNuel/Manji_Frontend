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

  return (
    <MainLayout>
      <div className="page-container py-10">
        <h1 className="text-3xl font-bold text-white mb-2">My Library</h1>
        <p className="text-white/50 mb-8">Your reading list, bookmarks, and history.</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-white/5 text-white/60 border border-white/5 hover:text-white hover:bg-white/10'
                }`}
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
          <div className="text-center py-20 glass-dark rounded-2xl border border-white/5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              {activeTabInfo && <activeTabInfo.icon size={28} className="text-white/20" />}
            </div>
            <h3 className="text-white font-semibold mb-2">No stories here yet</h3>
            <p className="text-white/40 text-sm mb-6">
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

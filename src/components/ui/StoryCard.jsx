/**
 * StoryCard.jsx
 *
 * Reusable card for displaying a story in lists and grids.
 */

import { Link } from 'react-router-dom'
import { BookOpen, Eye, Heart, Bookmark, Bell } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { storyService } from '../../services/storyService'
import { useAuth } from '../../context/AuthContext'
import { Avatar, Badge } from './index.jsx'

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n ?? 0)
}

export default function StoryCard({ story, variant = 'default' }) {
  const { user, updateUser } = useAuth()
  const [liked, setLiked] = useState(story.is_liked)
  const [likesCount, setLikesCount] = useState(story.likes_count)
  const [bookmarked, setBookmarked] = useState(story.is_bookmarked)
  const [following, setFollowing] = useState(story.is_following)
  const [actioning, setActioning] = useState(null)

  async function handleLike(e) {
    e.preventDefault()
    if (!user) { toast.error('Sign in to like.'); return }
    setActioning('like')
    const prev = liked
    setLiked(!liked)
    setLikesCount((n) => n + (liked ? -1 : 1))
    try {
      await storyService.likeStory(story.slug)
    } catch {
      setLiked(prev)
      setLikesCount((n) => n + (prev ? 1 : -1))
    } finally {
      setActioning(null)
    }
  }

  async function handleBookmark(e) {
    e.preventDefault()
    if (!user) { toast.error('Sign in to bookmark.'); return }
    setActioning('bookmark')
    const prev = bookmarked
    setBookmarked(!bookmarked)
    try {
      await storyService.bookmarkStory(story.slug)
    } catch {
      setBookmarked(prev)
    } finally {
      setActioning(null)
    }
  }

  async function handleFollow(e) {
    e.preventDefault()
    if (!user) { toast.error('Sign in to follow.'); return }
    setActioning('follow')
    const prev = following
    setFollowing(!following)
    try {
      await storyService.followStory(story.slug)
    } catch {
      setFollowing(prev)
    } finally {
      setActioning(null)
    }
  }

  const isCompact = variant === 'compact'

  return (
    <div className={`group relative flex flex-col rounded-xl bg-white/5 border border-white/5 overflow-hidden hover:border-white/15 transition-all duration-200 ${isCompact ? 'h-full' : ''}`}>
      {/* Cover */}
      <Link to={`/stories/${story.slug}`} className="block relative overflow-hidden">
        <div className={`${isCompact ? 'aspect-[3/4]' : 'aspect-[3/4]'} bg-white/10`}>
          {story.cover ? (
            <img
              src={story.cover}
              alt={story.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen size={32} className="text-white/20" />
            </div>
          )}
        </div>

        {/* Content type badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="default" className="bg-black/60 text-white/90 border-white/10 backdrop-blur-sm">
            {story.content_type?.replace('_', ' ')}
          </Badge>
        </div>

        {/* Official badge */}
        {story.is_official && (
          <div className="absolute bottom-2 left-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
              Official
            </span>
          </div>
        )}

        {/* Status badge */}
        {story.status !== 'draft' && (
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border backdrop-blur-sm ${
              story.status === 'published' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
              story.status === 'completed' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
              'bg-gray-500/20 text-gray-300 border-gray-500/30'
            }`}>
              {story.status}
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3">
        <Link to={`/stories/${story.slug}`} className="block">
          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 group-hover:text-orange-400 transition-colors">
            {story.title}
          </h3>
        </Link>

        <Link
          to={`/profile/${story.author?.username}`}
          className="flex items-center gap-1.5 mt-2 text-white/50 hover:text-white/80 transition-colors"
        >
          <Avatar src={story.author?.avatar} username={story.author?.username} size="xs" />
          <span className="text-xs truncate">{story.author?.username}</span>
        </Link>

        <div className="flex items-center gap-3 mt-2 text-white/40 text-xs">
          <span className="flex items-center gap-1"><Eye size={12} /> {fmt(story.views_count)}</span>
          <span className="flex items-center gap-1"><Heart size={12} /> {fmt(story.likes_count)}</span>
          <span className="flex items-center gap-1"><BookOpen size={12} /> {story.chapters_count}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
          <button
            onClick={handleLike}
            disabled={actioning === 'like'}
            className={`p-1.5 rounded-lg transition-colors ${liked ? 'text-pink-400 bg-pink-500/10' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            title="Like"
          >
            <Heart size={14} className={liked ? 'fill-pink-400' : ''} />
          </button>
          <button
            onClick={handleBookmark}
            disabled={actioning === 'bookmark'}
            className={`p-1.5 rounded-lg transition-colors ${bookmarked ? 'text-yellow-400 bg-yellow-500/10' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            title="Bookmark"
          >
            <Bookmark size={14} className={bookmarked ? 'fill-yellow-400' : ''} />
          </button>
          <button
            onClick={handleFollow}
            disabled={actioning === 'follow'}
            className={`p-1.5 rounded-lg transition-colors ${following ? 'text-green-400 bg-green-500/10' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            title="Follow"
          >
            <Bell size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

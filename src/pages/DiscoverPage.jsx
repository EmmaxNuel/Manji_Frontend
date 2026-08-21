/**
 * DiscoverPage.jsx
 *
 * The main discovery/explore page. Shows:
 * - Featured stories
 * - Trending (most liked)
 * - Popular (most viewed)
 * - Recently updated
 * - New releases
 *
 * Includes filters for content type and genre.
 */

import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Search, Filter, Flame, Eye, Clock, Sparkles, TrendingUp,
  ChevronRight, X,
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import { storyService } from '../services/storyService'
import StoryCard from '../components/ui/StoryCard'
import { Spinner, Button } from '../components/ui'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CONTENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'novel', label: 'Novels' },
  { value: 'short_story', label: 'Short Stories' },
  { value: 'web_novel', label: 'Web Novels' },
  { value: 'comic', label: 'Comics' },
  { value: 'manga', label: 'Manga' },
  { value: 'manhua', label: 'Manhua' },
]

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------
function SectionHeader({ icon: Icon, title, subtitle, linkTo, linkLabel = 'View all' }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
          <Icon size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-white/40 text-sm">{subtitle}</p>}
        </div>
      </div>
      {linkTo && (
        <Link to={linkTo} className="text-orange-400 hover:text-orange-300 text-sm font-medium flex items-center gap-1 transition-colors">
          {linkLabel} <ChevronRight size={16} />
        </Link>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Story grid
// ---------------------------------------------------------------------------
function StoryGrid({ stories, loading, emptyMessage = 'No stories found.' }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!stories.length) {
    return (
      <div className="text-center py-16 glass-dark rounded-2xl border border-white/5">
        <p className="text-white/40 text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------
function FilterBar({ contentType, onContentTypeChange, genres, selectedGenre, onGenreChange, searchQuery, onSearchChange, onClearFilters }) {
  const hasFilters = contentType || selectedGenre || searchQuery

  return (
    <div className="glass-dark rounded-2xl border border-white/10 p-4 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search stories, authors, tags..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          />
        </div>

        {/* Content type filter */}
        <select
          value={contentType}
          onChange={(e) => onContentTypeChange(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Genre filter */}
        <select
          value={selectedGenre}
          onChange={(e) => onGenreChange(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g.id} value={g.slug}>{g.name}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            <X size={16} /> Clear
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function DiscoverPage() {
  const [stories, setStories] = useState([])
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [genresLoading, setGenresLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [contentType, setContentType] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')

  // Section loading states
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [popularLoading, setPopularLoading] = useState(true)
  const [recentLoading, setRecentLoading] = useState(true)
  const [newLoading, setNewLoading] = useState(true)

  const [featured, setFeatured] = useState([])
  const [trending, setTrending] = useState([])
  const [popular, setPopular] = useState([])
  const [recent, setRecent] = useState([])
  const [newReleases, setNewReleases] = useState([])

  // Load genres on mount
  useEffect(() => {
    async function loadGenres() {
      setGenresLoading(true)
      try {
        const res = await storyService.getGenres()
        setGenres(res.data || [])
      } catch {
        // non-fatal
      } finally {
        setGenresLoading(false)
      }
    }
    loadGenres()
  }, [])

  // Load all sections when filters change
  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const baseParams = {
        content_type: contentType || undefined,
        genre: selectedGenre || undefined,
        status: 'published',
      }

      // If searching, just do one search query
      if (searchQuery.trim()) {
        setFeaturedLoading(true)
        setTrendingLoading(true)
        setPopularLoading(true)
        setRecentLoading(true)
        setNewLoading(true)
        try {
          const res = await storyService.getStories({
            ...baseParams,
            search: searchQuery.trim(),
            ordering: '-published_at',
          })
          const results = res.results || res.data || []
          setFeatured(results.slice(0, 6))
          setTrending([])
          setPopular([])
          setRecent([])
          setNewReleases([])
        } catch {
          toast.error('Search failed.')
        } finally {
          setFeaturedLoading(false)
          setTrendingLoading(false)
          setPopularLoading(false)
          setRecentLoading(false)
          setNewLoading(false)
          setLoading(false)
        }
        return
      }

      // Load all sections in parallel
      const [
        featuredRes,
        trendingRes,
        popularRes,
        recentRes,
        newRes,
      ] = await Promise.all([
        storyService.getStories({ ...baseParams, is_featured: 'true', ordering: '-published_at' }),
        storyService.getStories({ ...baseParams, ordering: '-likes_count' }),
        storyService.getStories({ ...baseParams, ordering: '-views_count' }),
        storyService.getStories({ ...baseParams, ordering: '-updated_at' }),
        storyService.getStories({ ...baseParams, ordering: '-published_at' }),
      ])

      setFeatured(featuredRes.results || featuredRes.data || [])
      setTrending(trendingRes.results || trendingRes.data || [])
      setPopular(popularRes.results || popularRes.data || [])
      setRecent(recentRes.results || recentRes.data || [])
      setNewReleases(newRes.results || newRes.data || [])

      setFeaturedLoading(false)
      setTrendingLoading(false)
      setPopularLoading(false)
      setRecentLoading(false)
      setNewLoading(false)
      setLoading(false)
    }

    loadAll()
  }, [searchQuery, contentType, selectedGenre])

  function handleClearFilters() {
    setSearchQuery('')
    setContentType('')
    setSelectedGenre('')
  }

  const isSearching = searchQuery.trim().length > 0

  return (
    <MainLayout>
      <div className="page-container py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Discover</h1>
          <p className="text-white/50">Explore stories from creators worldwide</p>
        </div>

        {/* Filters */}
        <FilterBar
          contentType={contentType}
          onContentTypeChange={setContentType}
          genres={genres}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearFilters={handleClearFilters}
        />

        {/* Search results */}
        {isSearching && (
          <section className="mb-12">
            <SectionHeader
              icon={Search}
              title={`Search results for "${searchQuery}"`}
              subtitle={`${featured.length} stories found`}
            />
            <StoryGrid stories={featured} loading={featuredLoading} />
          </section>
        )}

        {/* Featured */}
        {!isSearching && (
          <section className="mb-12">
            <SectionHeader
              icon={Sparkles}
              title="Featured"
              subtitle="Handpicked stories by our team"
              linkTo="/discover?is_featured=true"
            />
            <StoryGrid stories={featured} loading={featuredLoading} emptyMessage="No featured stories yet." />
          </section>
        )}

        {/* Trending */}
        {!isSearching && (
          <section className="mb-12">
            <SectionHeader
              icon={TrendingUp}
              title="Trending"
              subtitle="Most liked this week"
              linkTo="/discover?ordering=-likes_count"
            />
            <StoryGrid stories={trending} loading={trendingLoading} emptyMessage="No trending stories yet." />
          </section>
        )}

        {/* Popular */}
        {!isSearching && (
          <section className="mb-12">
            <SectionHeader
              icon={Flame}
              title="Popular"
              subtitle="Most viewed of all time"
              linkTo="/discover?ordering=-views_count"
            />
            <StoryGrid stories={popular} loading={popularLoading} emptyMessage="No popular stories yet." />
          </section>
        )}

        {/* Recently updated */}
        {!isSearching && (
          <section className="mb-12">
            <SectionHeader
              icon={Clock}
              title="Recently Updated"
              subtitle="Fresh chapters just dropped"
              linkTo="/discover?ordering=-updated_at"
            />
            <StoryGrid stories={recent} loading={recentLoading} emptyMessage="No recently updated stories." />
          </section>
        )}

        {/* New releases */}
        {!isSearching && (
          <section className="mb-12">
            <SectionHeader
              icon={Sparkles}
              title="New Releases"
              subtitle="Brand new stories to start reading"
              linkTo="/discover?ordering=-published_at"
            />
            <StoryGrid stories={newReleases} loading={newLoading} emptyMessage="No new releases yet." />
          </section>
        )}
      </div>
    </MainLayout>
  )
}

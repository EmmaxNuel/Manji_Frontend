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
        <div className="p-2 rounded-xl" style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}>
          <Icon size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{title}</h2>
          {subtitle && <p className="text-sm text-secondary">{subtitle}</p>}
        </div>
      </div>
      {linkTo && (
        <Link to={linkTo} className="text-sm font-medium flex items-center gap-1 transition-colors" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
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
      <div className="text-center py-16" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '1.5rem' }}>
        <p className="text-sm text-secondary">{emptyMessage}</p>
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

  const filterContainerStyle = {
    background: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '1.5rem',
    padding: '1rem',
  }
  const inputStyle = {
    background: 'var(--color-input-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    padding: '0.625rem 1rem 0.625rem 2.5rem',
    color: 'var(--color-text)',
    width: '100%',
    fontSize: '0.875rem',
  }
  const selectStyle = {
    background: 'var(--color-input-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    padding: '0.625rem 1rem',
    color: 'var(--color-text)',
    fontSize: '0.875rem',
  }
  const clearBtnStyle = {
    background: 'var(--color-input-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    padding: '0.625rem 1rem',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    transition: 'all 0.2s',
  }
  const iconColor = { color: 'var(--color-text-muted)' }
  const placeholderColor = { color: 'var(--color-input-placeholder)' }

  return (
    <div style={filterContainerStyle}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={18} style={{ ...iconColor, position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search stories, authors, tags..."
            style={{ ...inputStyle, placeholderColor }}
          />
        </div>

        {/* Content type filter */}
        <select
          value={contentType}
          onChange={(e) => onContentTypeChange(e.target.value)}
          style={selectStyle}
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Genre filter */}
        <select
          value={selectedGenre}
          onChange={(e) => onGenreChange(e.target.value)}
          style={selectStyle}
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
            style={clearBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text)'
              e.currentTarget.style.background = 'var(--color-bg-tertiary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)'
              e.currentTarget.style.background = 'var(--color-input-bg)'
            }}
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
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Discover</h1>
          <p className="text-secondary">Explore stories from creators worldwide</p>
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
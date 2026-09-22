/**
 * Home / Landing page – the discovery feed.
 *
 * Shows:
 * - Hero
 * - Featured story hero (official MANJI story takes priority)
 * - Content type grid
 * - Trending chart (this week)
 * - Featured stories
 * - Creator spotlights
 * - Recommended for you
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Flame, Sparkles, TrendingUp, User, Users, ArrowRight, Eye, Heart,
  BookOpen, Play, Star
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import { useAuth } from '../context/AuthContext'
import { storyService } from '../services/storyService'
import officialService from '../services/officialService'
import StoryCard from '../components/ui/StoryCard'
import { Spinner, Avatar, Badge } from '../components/ui'
import { BarChart } from '../components/ui/charts'

// ---------------------------------------------------------------------------
// Official Content Section
// ---------------------------------------------------------------------------

function OfficialContentSection({ series, story, chapters, animation, episodes }) {
  if (!series || !story) return null

  return (
    <section className="page-container py-20">
      <div className="relative overflow-hidden rounded-3xl border border-orange-500/25 bg-gradient-to-r from-orange-900/20 via-black to-purple-900/20 p-8 md:p-12">
        {/* Accent glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-purple-500/5" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 md:items-center">
          <div className="flex-shrink-0">
            {story.cover ? (
              <img
                src={story.cover}
                alt={story.title}
                className="w-24 h-32 md:w-32 md:h-44 object-cover rounded-xl shadow-2xl shadow-orange-500/30 ring-1 ring-orange-500/40"
              />
            ) : (
              <div className="w-24 h-32 md:w-32 md:h-44 rounded-xl bg-gradient-to-br from-orange-600/30 to-purple-600/30 flex items-center justify-center border border-orange-500/20">
                <BookOpen size={32} className="text-orange-400/60" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <Badge variant="accent" className="text-xs font-bold uppercase tracking-widest">
                MANJI ORIGINAL
              </Badge>
              <Badge variant="primary" className="text-xs">
                Season 1: Awakening
              </Badge>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 font-serif">
              {story.title}
            </h2>
            <p className="text-white/70 text-base md:text-lg mb-6 max-w-2xl leading-relaxed mx-auto md:mx-0">
              {story.description}
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
              <span className="flex items-center gap-1.5 text-white/50 text-sm">
                <BookOpen size={14} /> {chapters?.length || 0} Chapters
              </span>
              <span className="flex items-center gap-1.5 text-white/50 text-sm">
                <Star size={14} className="text-orange-400" /> Official Canon
              </span>
              {animation && episodes.length > 0 && (
                <span className="flex items-center gap-1.5 text-white/50 text-sm">
                  <Play size={14} className="text-orange-400" /> {episodes.length} Episodes
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <Link to="/official" className="btn-primary text-base px-8 py-3 shadow-2xl shadow-orange-500/30">
                <BookOpen size={16} className="mr-1.5" /> Read Story
              </Link>
              <Link to="/official" className="btn-ghost text-base px-8 py-3 border border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                <Play size={16} className="mr-1.5" /> View on Official Page
              </Link>
            </div>
          </div>
          
          {/* Chapter preview cards */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Recent Chapters</p>
            <div className="space-y-2">
              {chapters?.slice(0, 3).map((chapter, idx) => (
                <Link
                  key={chapter.chapter?.id || chapter.id}
                  to={`/chapters/${chapter.chapter?.id || chapter.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <span className="text-orange-400 font-mono text-xs w-8">Ch. {chapter.chapter?.chapter_number || chapter.order}</span>
                  <span className="text-white/80 text-sm truncate group-hover:text-orange-400 transition-colors">
                    {chapter.chapter?.title || chapter.title}
                  </span>
                </Link>
              ))}
              {chapters?.length > 3 && (
                <Link
                  to="/official"
                  className="flex items-center justify-center gap-1 text-orange-400 text-xs hover:text-orange-300 mt-2"
                >
                  +{chapters.length - 3} more chapters <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturedHero({ story }) {
  if (!story) return null
  const isWelcome = story.is_official
  return (
    <section className="page-container pt-14">
      <div className="relative overflow-hidden rounded-3xl border border-orange-500/25 bg-gradient-to-r from-black via-gray-900 to-black">
        {/* backdrop */}
        {story.cover && (
          <div className="absolute inset-0 opacity-25">
            <img src={story.cover} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

        <div className="relative z-10 p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center gap-8">
          {story.cover && (
            <img
              src={story.cover}
              alt={story.title}
              className={`w-40 sm:w-48 h-56 sm:h-64 object-cover rounded-2xl shadow-2xl flex-shrink-0 ${
                isWelcome ? 'shadow-orange-500/30 ring-1 ring-orange-500/40' : 'shadow-orange-500/20'
              }`}
            />
          )}
          <div className="flex-1">
            {isWelcome && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-orange-500 to-red-500 text-white mb-4">
                <Sparkles size={13} /> Official Manji Story
              </span>
            )}
            <h2 className={`text-3xl sm:text-5xl font-black text-white mb-3 ${isWelcome ? 'font-serif' : ''}`}>
              {story.title}
            </h2>
            <p className="text-white/70 text-base sm:text-lg mb-6 max-w-2xl leading-relaxed">
              {story.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-white/50 text-sm mb-8">
              <span className="flex items-center gap-1.5"><User size={15} /> {story.author?.username ?? 'Manji'}</span>
              <span className="flex items-center gap-1.5"><Eye size={15} /> {story.views_count ?? 0}</span>
              <span className="flex items-center gap-1.5"><Heart size={15} /> {story.likes_count ?? 0}</span>
              {story.chapters_count != null && <span>{story.chapters_count} chapters</span>}
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to={`/stories/${story.slug}`} className="btn-primary text-lg px-8 py-3.5 shadow-2xl shadow-orange-500/30">
                Start Reading
              </Link>
              <Link to={`/stories/${story.slug}`} className="btn-secondary text-lg px-8 py-3.5">
                View Story
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Trending chart card
// ---------------------------------------------------------------------------

function TrendingChart({ stories }) {
  if (!stories?.length) return null
  const top = stories.slice(0, 6)
  const bars = top.map((s) => s.likes_count ?? 0)
  const labels = top.map((s) => (s.title.length > 10 ? `${s.title.slice(0, 10)}…` : s.title))

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} style={{ color: 'var(--color-primary)' }} />
        <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Trending this week</h3>
        <span className="ml-auto text-xs text-secondary">sorted by likes</span>
      </div>
      <BarChart bars={bars} labels={labels} color="#f97316" height={160} />
      <div className="mt-4 flex items-center justify-between text-xs text-secondary">
        <span>Top story: <span className="font-medium" style={{ color: 'var(--color-primary)' }}>{top[0].title}</span></span>
        <Link to="/discover" className="font-medium flex items-center gap-1 transition-colors" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
          Explore <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Creator spotlight card
// ---------------------------------------------------------------------------

function CreatorSpotlightCard({ creator }) {
  return (
    <Link
      to={`/profile/${creator.username}`}
      className="card p-5 hover:border-orange-500/30 transition-colors group"
    >
      <div className="flex items-center gap-3 mb-4">
        <Avatar src={creator.avatar} username={creator.username} size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{creator.username}</p>
            {creator.is_official && (
              <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold">
                Official
              </span>
            )}
          </div>
          <p className="text-xs text-secondary">{creator.bio || 'Storyteller on Manji'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-secondary mb-4">
        <span className="flex items-center gap-1"><Users size={13} style={{ color: 'var(--color-text-secondary)' }} /> {creator.total_story_followers?.toLocaleString()} followers</span>
        <span className="flex items-center gap-1"><Eye size={13} style={{ color: 'var(--color-text-secondary)' }} /> {creator.total_views?.toLocaleString()} views</span>
      </div>
      {creator.top_story ? (
        <div className="rounded-xl p-3 transition-colors group" style={{ background: 'var(--color-input-bg)' }}>
          <p className="text-[11px] text-secondary mb-1">Top story</p>
          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{creator.top_story.title}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-primary)' }}>Read now →</p>
        </div>
      ) : (
        <div className="rounded-xl p-3 text-xs text-secondary" style={{ background: 'var(--color-input-bg)' }}>No published stories yet</div>
      )}
    </Link>
  )
}

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
          {linkLabel} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()

  const [featured, setFeatured] = useState([])
  const [trending, setTrending] = useState([])
  const [creators, setCreators] = useState([])
  const [recommended, setRecommended] = useState([])
  const [officialSeries, setOfficialSeries] = useState(null)
  const [officialStory, setOfficialStory] = useState(null)
  const [officialChapters, setOfficialChapters] = useState([])
  const [officialAnimation, setOfficialAnimation] = useState(null)
  const [officialEpisodes, setOfficialEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [officialLoading, setOfficialLoading] = useState(true)

  useEffect(() => {
    async function loadFeed() {
      setLoading(true)
      try {
        const [featuredRes, trendingRes, creatorsRes, recommendedRes] = await Promise.all([
          storyService.getStories({ is_featured: 'true', status: 'published', ordering: '-published_at' }),
          storyService.getStories({ status: 'published', ordering: '-likes_count' }),
          storyService.getCreators(),
          storyService.getRecommended(),
        ])
        setFeatured(featuredRes.results || featuredRes.data || [])
        setTrending(trendingRes.results || trendingRes.data || [])
        setCreators(creatorsRes || [])
        setRecommended(recommendedRes || [])
      } catch {
        // non-fatal – home feed is best effort
      } finally {
        setLoading(false)
      }
    }
    loadFeed()
  }, [])

  useEffect(() => {
    async function loadOfficial() {
      setOfficialLoading(true)
      try {
        const seriesRes = await officialService.getSeries()
        const seriesData = seriesRes.data.results || seriesRes.data
        const manjiSeries = Array.isArray(seriesData) ? seriesData.find(s => s.slug === 'manji') : seriesData
        if (manjiSeries) {
          setOfficialSeries(manjiSeries)
          
          const seasonsRes = await officialService.getSeasons(manjiSeries.slug)
          const seasonsData = seasonsRes.data.results || seasonsRes.data
          const seasonData = Array.isArray(seasonsData) ? seasonsData[0] : seasonsData
          
          if (seasonData) {
            const arcsRes = await officialService.getArcs(seasonData.id)
            const arcsData = arcsRes.data.results || arcsRes.data
            const arcData = Array.isArray(arcsData) ? arcsData.find(a => a.slug === 'the-world-beyond') : arcsData
            
            if (arcData) {
              const storiesRes = await officialService.getStories(arcData.id)
              const storiesData = storiesRes.data.results || storiesRes.data
              const storyData = Array.isArray(storiesData) ? storiesData[0] : storiesData
              
              if (storyData) {
                setOfficialStory(storyData)
                
                const chaptersRes = await officialService.getChapters(storyData.id)
                const chaptersData = chaptersRes.data.results || chaptersRes.data
                setOfficialChapters(Array.isArray(chaptersData) ? chaptersData : [])
              }
            }
          }
        }
        
        // Load animation
        const animRes = await officialService.getAnimations()
        const animData = animRes.data.results || animRes.data
        const manjiAnim = Array.isArray(animData) ? animData[0] : animData
        if (manjiAnim) {
          setOfficialAnimation(manjiAnim)
          const epRes = await officialService.getEpisodes(manjiAnim.id)
          const epData = epRes.data.results || epRes.data
          setOfficialEpisodes(Array.isArray(epData) ? epData : [])
        }
      } catch {
        // non-fatal
      } finally {
        setOfficialLoading(false)
      }
    }
    loadOfficial()
  }, [])

  const homeFeaturedStory =
    featured.find((s) => s.is_official) || featured[0] || null

  return (
    <MainLayout>
      {/* Hero Section - MovieBox Style */}
      <section className="hero-section">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-10"></div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 h-full">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border-r border-white/10"></div>
            ))}
          </div>
        </div>

        <div className="page-container relative z-20 py-32 text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">
                Manji
              </span>
            </h1>
            <p className="text-xl sm:text-2xl font-light text-white/80 mb-4 tracking-wide">
               Manji — Write. Ignite.
            </p>
            <p className="text-lg text-white/60 mb-12 max-w-3xl mx-auto leading-relaxed">
              Discover premium novels, manga, comics, and original fiction.
              <br className="hidden sm:block" />
              Read, write, and connect with creators worldwide.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/discover" className="btn-primary text-lg px-10 py-4 shadow-2xl shadow-orange-500/30">
                Start Reading
              </Link>
              {isAuthenticated ? (
                <Link to="/create" className="btn-secondary text-lg px-10 py-4">
                  Start Writing
                </Link>
              ) : (
                <Link to="/register" className="btn-secondary text-lg px-10 py-4">
                  Join as Creator
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-orange-500 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-white rounded-full animate-ping opacity-40"></div>
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full animate-pulse opacity-50"></div>
      </section>

      {/* Featured story hero */}
      <FeaturedHero story={officialStory} />

      {/* Official MANJI Content Section */}
      {!officialLoading && officialSeries && officialStory && (
        <OfficialContentSection
          series={officialSeries}
          story={officialStory}
          chapters={officialChapters}
          animation={officialAnimation}
          episodes={officialEpisodes}
        />
      )}

      {/* Content Types - Premium Grid */}
      <section className="page-container py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 text-white">Your Universe of Stories</h2>
          <p className="text-white/60 max-w-3xl mx-auto text-lg leading-relaxed">
            Manji is the premium destination for storytellers and readers. Create and share novels,
            short stories, web novels, comics, manga, and manhua. Build an audience, connect with readers,
            and grow your craft in our exclusive creator community.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { type: 'Novels', color: 'from-blue-500 to-purple-600' },
            { type: 'Short Stories', color: 'from-green-500 to-blue-500' },
            { type: 'Web Novels', color: 'from-purple-500 to-pink-500' },
            { type: 'Comics', color: 'from-yellow-500 to-orange-500' },
            { type: 'Manga', color: 'from-red-500 to-pink-500' },
            { type: 'Manhua', color: 'from-orange-500 to-red-500' }
          ].map(({ type, color }) => (
            <div
              key={type}
              className={`story-card group p-6 h-32 bg-gradient-to-br ${color} relative overflow-hidden`}
            >
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
                <p className="font-bold text-white text-lg mb-2">{type}</p>
                <div className="w-8 h-1 bg-white/50 rounded-full group-hover:bg-white transition-colors duration-300"></div>
              </div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Discovery feed */}
      <section className="bg-gradient-to-r from-black via-gray-900 to-black border-t border-white/10">
        <div className="page-container py-20">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="space-y-16">
              {/* Trending chart + top trending */}
              <div>
                <SectionHeader
                  icon={TrendingUp}
                  title="Trending"
                  subtitle="What readers are loving right now"
                  linkTo="/discover?ordering=-likes_count"
                />
                <div className="grid lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-2">
                    <TrendingChart stories={trending} />
                  </div>
                  <div className="lg:col-span-3">
                    {trending.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                        {trending.slice(0, 4).map((story) => (
                          <StoryCard key={story.id} story={story} />
                        ))}
                      </div>
                    ) : (
                      <div className="card p-8 text-center text-muted">No trending stories yet.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Featured */}
              <div>
                <SectionHeader
                  icon={Sparkles}
                  title="Featured"
                  subtitle="Handpicked stories by our team"
                  linkTo="/discover?is_featured=true"
                />
                {featured.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                    {featured.slice(0, 6).map((story) => (
                      <StoryCard key={story.id} story={story} />
                    ))}
                  </div>
                ) : (
                  <div className="card p-8 text-center text-muted">No featured stories yet.</div>
                )}
              </div>

              {/* Creator spotlights */}
              <div>
                <SectionHeader
                  icon={User}
                  title="Creator Spotlights"
                  subtitle="Talented storytellers to follow"
                  linkTo="/discover"
                />
                {creators.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {creators.slice(0, 4).map((creator) => (
                      <CreatorSpotlightCard key={creator.id} creator={creator} />
                    ))}
                  </div>
                ) : (
                  <div className="card p-8 text-center text-muted">No creators spotlighted yet.</div>
                )}
              </div>

              {/* Recommended for you */}
              <div>
                <SectionHeader
                  icon={TrendingUp}
                  title={user ? 'Recommended for You' : 'Popular Stories'}
                  subtitle={
                    user
                      ? 'Based on stories you like and follow'
                      : 'Stories readers keep coming back to'
                  }
                  linkTo="/discover"
                />
                {recommended.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                    {recommended.slice(0, 6).map((story) => (
                      <StoryCard key={story.id} story={story} />
                    ))}
                  </div>
                ) : (
                  <div className="card p-8 text-center text-muted">No recommendations yet — start reading to get some!</div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  )
}
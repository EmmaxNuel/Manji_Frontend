import { useCallback, useEffect, useRef, useState } from 'react'
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react'

function getEmbedUrl(url) {
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop()
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : null
    }
    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.split('/').filter(Boolean).pop()
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : null
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const videoId = parsed.pathname.split('/').filter(Boolean).pop()
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null
    }
  } catch {
    return null
  }

  return null
}

function formatTime(seconds) {
  if (!seconds || !Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function VideoPlayer({ src, poster, title, duration }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const embedUrl = getEmbedUrl(src)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(duration || 0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(src) && !embedUrl)
  const [hasError, setHasError] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const resetSource = useCallback(() => {
    setCurrentTime(0)
    setVideoDuration(duration || 0)
    setIsPlaying(false)
    setIsLoading(Boolean(src) && !embedUrl)
    setHasError(false)
    if (videoRef.current && src && !embedUrl) {
      videoRef.current.load()
    }
  }, [duration, embedUrl, src])

  useEffect(() => {
    resetSource()
  }, [resetSource])

  const togglePlay = useCallback(() => {
    if (!videoRef.current || embedUrl) return
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false)
        setHasError(true)
      })
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [embedUrl])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
      setVideoDuration(videoRef.current.duration)
    }
    setIsLoading(false)
    setHasError(false)
  }, [])

  const handleCanPlay = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleWaiting = useCallback(() => {
    if (src && !embedUrl) setIsLoading(true)
  }, [embedUrl, src])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setIsPlaying(false)
    setHasError(true)
  }, [])

  const handleSeek = useCallback((event) => {
    if (!videoRef.current) return
    const totalDuration = videoRef.current.duration || videoDuration
    if (!totalDuration) return
    const rect = event.currentTarget.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    videoRef.current.currentTime = percent * totalDuration
    setCurrentTime(videoRef.current.currentTime)
  }, [videoDuration])

  const handleVolumeChange = useCallback((event) => {
    if (!videoRef.current) return
    const nextVolume = Number(event.target.value)
    videoRef.current.volume = nextVolume
    videoRef.current.muted = nextVolume === 0
    setVolume(nextVolume)
    setIsMuted(nextVolume === 0)
  }, [])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    const nextMuted = !isMuted
    videoRef.current.muted = nextMuted
    setIsMuted(nextMuted)
  }, [isMuted])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => setIsFullscreen(false))
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => setIsFullscreen(false))
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handleKey = (event) => {
      if (!videoRef.current || embedUrl || event.target instanceof HTMLInputElement) return
      switch (event.key) {
        case ' ':
        case 'k':
          event.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
          break
        case 'ArrowRight': {
          const totalDuration = videoRef.current.duration || videoDuration
          videoRef.current.currentTime = Math.min(totalDuration || 0, videoRef.current.currentTime + 5)
          break
        }
        case 'ArrowUp':
          event.preventDefault()
          videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1)
          setVolume(videoRef.current.volume)
          setIsMuted(videoRef.current.volume === 0)
          break
        case 'ArrowDown':
          event.preventDefault()
          videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1)
          setVolume(videoRef.current.volume)
          setIsMuted(videoRef.current.volume === 0)
          break
        case 'f':
          toggleFullscreen()
          break
        case 'm':
          toggleMute()
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [embedUrl, toggleFullscreen, toggleMute, togglePlay, videoDuration])

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const progressPercent = videoDuration
    ? Math.max(0, Math.min(100, (currentTime / videoDuration) * 100))
    : 0

  if (embedUrl) {
    return (
      <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: '16/9' }}>
        <iframe
          src={embedUrl}
          title={title || 'Video'}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    )
  }

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-center">
        <p className="text-white/50 text-sm">Video preview is not available yet.</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl bg-black group"
      style={{ aspectRatio: '16/9' }}
    >
      <video
        ref={videoRef}
        className="h-full w-full"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onError={handleError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        playsInline
        preload="metadata"
      >
        <source src={src} type="video/mp4" />
      </video>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-orange-400" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 text-center">
          <p className="text-white/70 text-sm">This video could not be loaded.</p>
        </div>
      )}

      {!isPlaying && !isLoading && !hasError && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center bg-black/30"
          onClick={togglePlay}
          aria-label={`Play ${title || 'video'}`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/80 text-white transition-colors hover:bg-orange-500">
            <Play size={28} className="ml-1" />
          </span>
        </button>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => {
          if (isPlaying) setShowControls(false)
        }}
      >
        <div
          className="mb-3 h-1.5 w-full cursor-pointer rounded-full bg-white/20 group/prog"
          onClick={handleSeek}
          role="slider"
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={Math.round(videoDuration)}
          aria-valuenow={Math.round(currentTime)}
          tabIndex={0}
        >
          <div
            className="relative h-full rounded-full bg-orange-400 transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          >
            <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-orange-400 opacity-0 transition-opacity group-hover/prog:opacity-100" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" className="text-white transition-colors hover:text-orange-400" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button type="button" className="text-white transition-colors hover:text-orange-400" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="hidden w-20 cursor-pointer appearance-none rounded-lg bg-white/20 accent-orange-400 sm:block"
            aria-label="Volume"
          />
          <span className="flex-1 font-mono text-xs text-white/70">
            {formatTime(currentTime)} / {formatTime(videoDuration)}
          </span>
          <button type="button" className="text-white transition-colors hover:text-orange-400" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {title && (
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
      )}
    </div>
  )
}

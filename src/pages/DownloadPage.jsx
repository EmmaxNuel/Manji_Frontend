import { useEffect, useState } from 'react'
import { Download, Monitor, CheckCircle, FileText, Github, Twitter, Mail } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import MainLayout from '../layouts/MainLayout'
import { Spinner, Badge } from '../components/ui'

export default function DownloadPage() {
  const [release, setRelease] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function fetchRelease() {
      setLoading(true)
      try {
        const res = await fetch('/releases/latest/')
        if (!res.ok) throw new Error('Release not configured')
        const data = await res.json()
        if (data.success) {
          setRelease(data.data)
        } else {
          setError(data.error?.message || 'Failed to load release info')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchRelease()
  }, [])

  const handleDownload = async () => {
    if (!release?.download_url) return
    setDownloading(true)
    try {
      const link = document.createElement('a')
      link.href = release.download_url
      link.download = `MANJI-Setup-${release.version}.exe`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      window.open(release.download_url, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '—'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center card p-10 max-w-md">
            <div className="text-red-400 text-6xl mb-4">⚠</div>
            <h1 className="text-2xl font-bold text-white mb-2">Download Unavailable</h1>
            <p className="text-white/60">{error}</p>
            <p className="text-white/40 text-sm mt-4">The Windows installer has not been published yet.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="page-container py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 rounded-full px-4 py-2 mb-6">
              <Download size={18} className="text-orange-400" />
              <span className="text-orange-400 font-semibold text-sm">MANJI for Windows</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Create. Write. Draw. Animate. Publish.
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
              The complete AI-powered creative studio for stories, comics, manga, and animation.
              Download the native Windows app and start building your world today.
            </p>
            
            {release && (
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn-primary text-lg px-8 py-4 justify-center gap-2 group"
                >
                  <Download size={22} />
                  <span>Download for Windows {downloading ? '…' : ''}</span>
                </button>
                <a
                  href="#changelog"
                  className="btn-secondary text-lg px-8 py-4 justify-center"
                >
                  <FileText size={20} className="mr-2" /> View Changelog
                </a>
              </div>
            )}
          </div>

          {/* Version Info Card */}
          {release && (
            <div className="card p-6 mb-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-3xl font-bold text-orange-400 mb-1">v{release.version}</div>
                  <div className="text-white/50 text-sm">Current Version</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-3xl font-bold text-white mb-1">{formatDate(release.release_date)}</div>
                  <div className="text-white/50 text-sm">Release Date</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <div className="text-3xl font-bold text-white mb-1">{formatBytes(release.installer_size_bytes)}</div>
                  <div className="text-white/50 text-sm">Installer Size</div>
                </div>
              </div>
            </div>
          )}

          {/* Features Grid */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-10">Everything You Need to Create</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: '📖', title: 'Story Studio', desc: 'Write novels, comics, manga, and manhua with AI-assisted chapter planning and character development.' },
                { icon: '🎭', title: 'Character Designer', desc: 'Create detailed character profiles with visual references, relationships, and consistent AI-generated art.' },
                { icon: '🎬', title: 'Animation Studio', desc: 'Frame-by-frame 2D animation with onion skinning, layers, timeline, and camera controls.' },
                { icon: '🎨', title: 'Storyboard & Art', desc: 'Visual shot planning with camera types, aspect ratios, and AI image generation for concepts.' },
                { icon: '🎙️', title: 'Voice & Audio', desc: 'Record dialogue, add music and SFX, sync with animation timeline.' },
                { icon: '🤖', title: 'Manji AI Co-Author', desc: 'Context-aware AI that understands your project, characters, and scenes to help you create.' },
              ].map((feature, i) => (
                <div key={i} className="card p-6 hover:border-orange-500/30 transition-colors">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/60">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* System Requirements */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-10">System Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <Monitor size={20} className="text-orange-400" /> Minimum
                </h3>
                <ul className="space-y-3 text-white/70">
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> Windows 10 version 1903+ (64-bit)</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> Intel Core i5 / AMD Ryzen 5 or equivalent</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> 8 GB RAM</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> 2 GB available storage</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> DirectX 11 compatible GPU</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> Internet connection for AI features</li>
                </ul>
              </div>
              <div className="card p-6 border-orange-500/30">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <Monitor size={20} className="text-orange-400" /> Recommended
                </h3>
                <ul className="space-y-3 text-white/70">
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> Windows 11 (64-bit)</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> Intel Core i7 / AMD Ryzen 7 or better</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> 16 GB RAM or more</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> 10 GB available storage (SSD)</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> Dedicated GPU (NVIDIA RTX / AMD RX)</li>
                  <li className="flex items-center gap-2"><CheckCircle size={18} className="text-green-400 flex-shrink-0" /> Stable broadband for cloud sync</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Changelog */}
          {release && release.changelog?.length && (
            <section id="changelog" className="mb-16">
              <h2 className="text-2xl font-bold text-white text-center mb-10">Changelog</h2>
              <div className="card p-6 max-w-3xl mx-auto">
                <ul className="space-y-4">
                  {release.changelog.map((item, i) => (
                    <li key={i} className="flex gap-3 text-white/80 border-l-2 border-orange-500 pl-4">
                      <span className="text-white/40 text-sm mt-1">{formatDate(release.release_date)}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Portable Version */}
          {release && release.portable_download_url && (
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-white text-center mb-10">Portable Version</h2>
              <div className="card p-6 max-w-md mx-auto text-center">
                <p className="text-white/70 mb-4">No installation required — run directly from USB or any folder.</p>
                <a
                  href={release.portable_download_url}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Download size={18} /> Download Portable ({formatBytes(release.portable_size_bytes)})
                </a>
              </div>
            </section>
          )}

          {/* Installation Instructions */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-10">Installation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { step: '01', title: 'Download', desc: 'Click the download button above to get the latest installer.' },
                { step: '02', title: 'Run Installer', desc: 'Double-click MANJI-Setup-x.x.x.exe and follow the setup wizard.' },
                { step: '03', title: 'Launch & Sign In', desc: 'Start MANJI from Start Menu, sign in or create an account.' },
              ].map((item) => (
                <div key={item.step} className="card p-6 text-center relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg">
                    {item.step}
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-white/60">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Supported Windows */}
          {release && release.supported_windows && (
            <section className="mb-16">
              <div className="card p-6 max-w-2xl mx-auto text-center">
                <Badge variant="accent" className="mb-3">Supported Windows</Badge>
                <p className="text-white/70">{release.supported_windows}</p>
              </div>
            </section>
          )}

          {/* Footer Links */}
          <footer className="border-t border-white/10 pt-10">
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/50 text-sm">
              <a href="https://github.com/manji" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                <Github size={16} /> GitHub
              </a>
              <a href="https://twitter.com/manji" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                <Twitter size={16} /> Twitter
              </a>
              <a href="mailto:support@manji.io" className="flex items-center gap-1 hover:text-white transition-colors">
                <Mail size={16} /> Support
              </a>
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            </div>
            <p className="text-white/30 text-xs text-center mt-6">
              © {new Date().getFullYear()} MANJI. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </MainLayout>
  )
}
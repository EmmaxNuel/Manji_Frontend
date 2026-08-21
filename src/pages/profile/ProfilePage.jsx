/**
 * Profile page – shows a user's public profile.
 * If the viewed profile belongs to the logged-in user, shows an edit button.
 */

import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Settings, UserCheck, UserPlus } from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services/userService'
import { Avatar, Badge, Button, Spinner } from '../../components/ui'

export default function ProfilePage() {
  const { username } = useParams()
  const { user: me, updateUser } = useAuth()
  const navigate = useNavigate()
  const isOwn = me?.username === username

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ bio: '', website: '', location: '' })
  const [editLoading, setEditLoading] = useState(false)
  const avatarInputRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    userService
      .getUser(username)
      .then((res) => {
        setProfile(res.data)
        setFollowing(res.data.is_following)
        setEditForm({
          bio: res.data.bio || '',
          website: res.data.profile?.website || '',
          location: res.data.profile?.location || '',
        })
      })
      .catch(() => navigate('/404'))
      .finally(() => setLoading(false))
  }, [username, navigate])

  async function handleFollow() {
    if (!me) {
      navigate('/login')
      return
    }
    setFollowLoading(true)
    try {
      const res = await userService.follow(username)
      setFollowing(res.following)
      setProfile((prev) => ({
        ...prev,
        followers_count: res.following ? prev.followers_count + 1 : Math.max(0, prev.followers_count - 1),
      }))
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setFollowLoading(false)
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    setEditLoading(true)
    try {
      const fd = new FormData()
      if (editForm.bio !== undefined) fd.append('bio', editForm.bio)
      if (editForm.website !== undefined) fd.append('website', editForm.website)
      if (editForm.location !== undefined) fd.append('location', editForm.location)
      const res = await userService.updateMe(fd)
      updateUser(res.data)
      setProfile((prev) => ({
        ...prev,
        bio: res.data.profile.bio,
      }))
      setEditing(false)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setEditLoading(false)
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const res = await userService.updateMe(fd)
      updateUser(res.data)
      setProfile((prev) => ({ ...prev, avatar: res.data.profile.avatar }))
      toast.success('Avatar updated!')
    } catch {
      toast.error('Failed to upload avatar.')
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (!profile) return null

  const roleVariant = profile.role === 'creator' ? 'primary' : profile.role === 'admin' ? 'danger' : 'default'

  return (
    <MainLayout>
      <div className="page-container py-10 max-w-3xl">
        {/* Profile header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative group">
              <Avatar src={profile.avatar} username={profile.username} size="xl" />
              {isOwn && (
                <>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition"
                    aria-label="Change avatar"
                  >
                    Edit
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold truncate">{profile.username}</h1>
                <Badge variant={roleVariant}>{profile.role}</Badge>
              </div>
              <p className="text-[var(--color-muted)] text-sm mb-3 break-words">{profile.bio || 'No bio yet.'}</p>

              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-semibold">{profile.followers_count}</span>
                  <span className="text-[var(--color-muted)] ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-semibold">{profile.stories_count}</span>
                  <span className="text-[var(--color-muted)] ml-1">Stories</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 sm:ml-auto">
              {isOwn ? (
                <Button variant="secondary" onClick={() => setEditing((e) => !e)}>
                  <Settings size={15} />
                  Edit Profile
                </Button>
              ) : (
                <Button
                  variant={following ? 'secondary' : 'primary'}
                  loading={followLoading}
                  onClick={handleFollow}
                >
                  {following ? (
                    <>
                      <UserCheck size={15} />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Edit form */}
          {isOwn && editing && (
            <form onSubmit={handleSaveEdit} className="mt-6 space-y-4 border-t border-[var(--color-border)] pt-5">
              <div>
                <label className="label">Bio</label>
                <textarea
                  className="input-field resize-none h-24"
                  value={editForm.bio}
                  onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                  maxLength={500}
                  placeholder="Tell readers about yourself..."
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">{editForm.bio.length}/500</p>
              </div>
              <div>
                <label className="label">Website</label>
                <input
                  type="url"
                  className="input-field"
                  value={editForm.website}
                  onChange={(e) => setEditForm((p) => ({ ...p, website: e.target.value }))}
                  placeholder="https://yoursite.com"
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  className="input-field"
                  value={editForm.location}
                  onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="City, Country"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" loading={editLoading}>
                  Save changes
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Become creator CTA */}
        {isOwn && me?.role === 'reader' && (
          <div className="card p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Become a Creator</p>
              <p className="text-sm text-[var(--color-muted)]">
                Start publishing stories and build your audience.
              </p>
            </div>
            <Button
              onClick={async () => {
                try {
                  const res = await userService.becomeCreator()
                  updateUser(res.data)
                  toast.success("You're now a creator! 🎉")
                } catch {
                  toast.error('Something went wrong.')
                }
              }}
            >
              Get started
            </Button>
          </div>
        )}

        {/* Stories placeholder */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Stories</h2>
          <div className="card p-8 text-center text-[var(--color-muted)]">
            <p>No stories published yet.</p>
            {isOwn && me?.role !== 'reader' && (
              <Button className="mt-4" onClick={() => navigate('/create')}>
                Write your first story
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

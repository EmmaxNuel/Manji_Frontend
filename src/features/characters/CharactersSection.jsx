/**
 * CharactersSection – the Characters tab inside MANJI STUDIO (Phase 3).
 *
 * Manages the project's cast: identity, writing, visual reference and the
 * relationship web between characters. The form is grouped into sections and
 * every reference to another character is a picker into real Character
 * records (never free text), so the data stays structured for AI context
 * building and character consistency.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Users, Plus, Pencil, Trash2, Upload, X, UserPlus, Search, Link2, Check,
} from 'lucide-react'
import { Spinner, Badge } from '../../components/ui'
import ManjiGuide from '../../components/manji/ManjiGuide'
import { charactersService, roleLabel } from './charactersService'

const field =
  'w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm'

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="h-4 w-1 rounded-full bg-gradient-to-b from-orange-500 to-orange-600" />
      <span className="text-xs font-semibold tracking-widest uppercase text-orange-400/90">{children}</span>
    </div>
  )
}

function AvatarUpload({ file, preview, onChange, onClear }) {
  return (
    <div
      className="relative w-full h-44 rounded-xl overflow-hidden border-2 border-dashed border-white/20 hover:border-orange-500/50 transition-colors cursor-pointer flex items-center justify-center bg-white/5"
      onClick={() => document.getElementById('character-avatar-input')?.click()}
    >
      {preview ? (
        <>
          <img src={preview} alt="Character reference" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear() }}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <div className="text-center px-4">
          <Upload size={24} className="text-white/30 mx-auto mb-2" />
          <p className="text-white/40 text-xs">Upload a reference image</p>
        </div>
      )}
      <input
        id="character-avatar-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </div>
  )
}

function RelationshipRow({ row, others, onChange, onRemove }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <label className="text-xs text-white/50 mb-1 block">Character</label>
          <select
            className={`${field} bg-[var(--color-card)]`}
            value={row.character?.id || ''}
            onChange={(e) => {
              const selected = others.find((c) => c.id === e.target.value)
              if (selected) onChange({ ...row, character: { id: selected.id, name: selected.name } })
            }}
          >
            <option value="">Select a character…</option>
            {others.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="text-xs text-white/50 mb-1 block">Type</label>
          <select
            className={`${field} bg-[var(--color-card)]`}
            value={row.relationship_type || ''}
            onChange={(e) => onChange({ ...row, relationship_type: e.target.value })}
          >
            {charactersService.RELATIONSHIP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="self-end p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
          title="Remove relationship"
          aria-label="Remove relationship"
        >
          <X size={14} />
        </button>
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Description</label>
        <input
          className={field}
          value={row.description || ''}
          onChange={(e) => onChange({ ...row, description: e.target.value })}
          placeholder="e.g. Best friends since childhood"
        />
      </div>
    </div>
  )
}

function CharacterPicker({ characters, onPick, onClose }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return characters
    return characters.filter((c) => c.name.toLowerCase().includes(q))
  }, [characters, query])

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-sm rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-orange-400" />
            <h4 className="text-white font-semibold text-sm">Add a relationship</h4>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white" aria-label="Close">
            <X size={14} />
          </button>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              className={`${field} pl-9`}
              placeholder="Search characters…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-white/50 text-sm text-center py-6">
                {characters.length === 0 ? 'Add other characters first.' : 'No matches.'}
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onPick(c)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  {c.avatar ? (
                    <img src={c.avatar} alt={c.name} className="h-9 w-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {c.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">{c.name}</div>
                    <div className="text-white/40 text-xs">{roleLabel(c.role)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CharacterForm({ initial, others, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [showPicker, setShowPicker] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)

  function set(fieldName, value) {
    setForm((prev) => ({ ...prev, [fieldName]: value }))
    setErrors((prev) => ({ ...prev, [fieldName]: '' }))
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setForm((prev) => ({ ...prev, avatar: file, avatarPreview: URL.createObjectURL(file) }))
  }

  function clearAvatar() {
    setAvatarFile(null)
    setForm((prev) => ({ ...prev, avatar: null, avatarPreview: null }))
  }

  function addRelationship(character) {
    const already = form.relationships.some((r) => r.character?.id === character.id)
    if (already) { setShowPicker(false); return }
    setForm((prev) => ({
      ...prev,
      relationships: [
        ...prev.relationships,
        { character: { id: character.id, name: character.name }, relationship_type: 'neutral', description: '' },
      ],
    }))
    setShowPicker(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const localErrors = {}
    if (!form.name.trim()) localErrors.name = 'Give this character a name.'
    if (!form.role) localErrors.role = 'Choose a role.'
    const relationships = form.relationships
      .filter((r) => r.character?.id)
      .map((r) => ({
        to_character_id: r.character.id,
        relationship_type: r.relationship_type || 'neutral',
        description: r.description || '',
      }))
    const avatarCleared = avatarFile === null && form.avatarPreview === null && Boolean(initial.avatarPreview)
    onSubmit({
      ...form,
      name: form.name.trim(),
      age: form.age ? Number(form.age) : null,
      relationships,
      avatar: avatarCleared ? null : avatarFile || undefined,
    }, localErrors, setErrors)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <SectionLabel>Identity</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Name <span className="text-orange-400">*</span></label>
            <input className={field} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Kai" autoFocus />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Role</label>
            <select className={`${field} bg-[var(--color-card)]`} value={form.role} onChange={(e) => set('role', e.target.value)}>
              {charactersService.ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.role && <p className="error-text">{errors.role}</p>}
          </div>
          <div>
            <label className="label">Age</label>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-white/20 bg-white/5">
                <button
                  type="button"
                  onClick={() => set('age', Math.max(0, (form.age ?? 0) - 1))}
                  className="px-3 py-2.5 text-white/60 hover:text-white transition-colors"
                  aria-label="Decrease age"
                >−</button>
                <input
                  type="number"
                  min="0"
                  className="w-16 text-center bg-transparent text-white text-sm py-2.5 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={form.age ?? ''}
                  onChange={(e) => set('age', e.target.value)}
                  placeholder="—"
                />
                <button
                  type="button"
                  onClick={() => set('age', (form.age ?? 0) + 1)}
                  className="px-3 py-2.5 text-white/60 hover:text-white transition-colors"
                  aria-label="Increase age"
                >+</button>
              </div>
              <span className="text-white/40 text-sm">years</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Writing</SectionLabel>
        <div className="space-y-4">
          <div>
            <label className="label">Bio / Description</label>
            <textarea className={`${field} resize-none`} rows={3} value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="Who is this character?" />
          </div>
          <div>
            <label className="label">Personality</label>
            <textarea className={`${field} resize-none`} rows={2} value={form.personality} onChange={(e) => set('personality', e.target.value)} placeholder="e.g. Curious, determined, guarded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Backstory</label>
              <textarea className={`${field} resize-none`} rows={3} value={form.backstory} onChange={(e) => set('backstory', e.target.value)} placeholder="What shaped them?" />
            </div>
            <div>
              <label className="label">Character notes</label>
              <textarea className={`${field} resize-none`} rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Private notes that stay out of AI prompts" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Visual</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Appearance</label>
            <textarea className={`${field} resize-none`} rows={4} value={form.appearance} onChange={(e) => set('appearance', e.target.value)} placeholder="Visual description used for image generation — e.g. messy black hair, grey eyes, worn navy jacket" />
          </div>
          <div>
            <label className="label">Reference image</label>
            <AvatarUpload
              preview={form.avatarPreview || initial.avatarPreview || null}
              onChange={handleAvatarChange}
              onClear={clearAvatar}
            />
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Relationships</SectionLabel>
        <div className="space-y-3">
          {form.relationships.length === 0 && (
            <p className="text-white/50 text-sm">No relationships yet. Add one to map how this character connects to the rest of the cast.</p>
          )}
          {form.relationships.map((row, i) => (
            <RelationshipRow
              key={i}
              row={row}
              others={others}
              onChange={(updated) => setForm((prev) => {
                const next = [...prev.relationships]
                next[i] = updated
                return { ...prev, relationships: next }
              })}
              onRemove={() => setForm((prev) => ({
                ...prev,
                relationships: prev.relationships.filter((_, idx) => idx !== i),
              }))}
            />
          ))}
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-white/20 text-white/60 hover:text-white hover:border-orange-500/40 hover:bg-orange-500/5 text-sm transition-colors"
          >
            <UserPlus size={14} /> Add relationship
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button type="button" onClick={onCancel} className="btn-ghost text-sm">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary text-sm px-6 justify-center">
          {saving ? <Spinner size="sm" /> : null}
          {initial.id ? 'Save Changes' : 'Add Character'}
        </button>
      </div>

      {showPicker && (
        <CharacterPicker
          characters={others}
          onPick={addRelationship}
          onClose={() => setShowPicker(false)}
        />
      )}
    </form>
  )
}

export default function CharactersSection({ project }) {
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await charactersService.getCharacters(project.id)
      setCharacters(res.data || [])
    } catch {
      toast.error('Failed to load characters.')
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => { load() }, [load])

  const others = useMemo(() => characters.filter((c) => c.id !== editing?.id), [characters, editing?.id])

  async function openCreate() {
    setEditing({
      id: null, name: '', role: 'supporting', age: '',
      bio: '', personality: '', backstory: '', notes: '', appearance: '',
      avatar: null, avatarPreview: null, relationships: [],
    })
    setShowForm(true)
  }

  async function openEdit(character) {
    try {
      const res = await charactersService.getCharacter(character.id)
      const c = res.data
      setEditing({
        id: c.id, name: c.name || '', role: c.role || 'supporting', age: c.age ?? '',
        bio: c.bio || '', personality: c.personality || '', backstory: c.backstory || '',
        notes: c.notes || '', appearance: c.appearance || '',
        avatar: null, avatarPreview: c.avatar || null,
        relationships: (c.relationships?.outgoing || []).map((r) => ({
          character: r.character || null,
          relationship_type: r.relationship_type || 'neutral',
          description: r.description || '',
        })),
      })
      setShowForm(true)
    } catch {
      toast.error('Failed to load character.')
    }
  }

  async function handleSubmit(payload, localErrors, setErrors) {
    if (Object.keys(localErrors).length) { setErrors(localErrors); return }
    setSaving(true)
    try {
      if (editing?.id) {
        await charactersService.updateCharacter(editing.id, payload)
        toast.success('Character updated.')
      } else {
        await charactersService.createCharacter(project.id, payload)
        toast.success('Character added.')
      }
      setShowForm(false)
      setEditing(null)
      load()
    } catch (err) {
      const details = err?.response?.data?.error?.details
      if (details && typeof details === 'object') {
        Object.entries(details).forEach(([k, v]) =>
          setErrors((prev) => ({ ...prev, [k]: Array.isArray(v) ? v[0] : v })))
      } else {
        toast.error(err?.response?.data?.error?.message || 'Failed to save character.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(character) {
    if (!window.confirm(`Delete character "${character.name}"? This cannot be undone.`)) return
    try {
      await charactersService.deleteCharacter(character.id)
      toast.success('Character deleted.')
      load()
    } catch {
      toast.error('Failed to delete character.')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  return (
    <div data-tour="characters-section">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Characters</h2>
          <p className="text-white/50 text-sm mt-1">
            The cast of {project.title} — their descriptions, references and relationships
            feed Manji AI so it keeps everyone consistent.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm px-4 py-2.5 justify-center">
          <Plus size={16} /> Add Character
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="card p-10">
          <ManjiGuide
            expression="excited" size="lg" animated="bounce"
            title="No characters yet"
            body="Every scene, storyboard and animation needs a cast. Describe your first character to begin."
          >
            <button onClick={openCreate} className="btn-primary inline-flex">
              <Plus size={16} className="mr-1" /> Add your first character
            </button>
          </ManjiGuide>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <div key={character.id} className="card p-5">
              <div className="flex items-start gap-4">
                {character.avatar ? (
                  <img src={character.avatar} alt={character.name} className="h-14 w-14 rounded-xl object-cover flex-shrink-0 ring-1 ring-white/10" />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500/30 to-purple-600/30 flex items-center justify-center text-orange-400 font-bold text-xl flex-shrink-0">
                    {character.name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold truncate">{character.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <Badge variant="primary">{character.role_label || roleLabel(character.role)}</Badge>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(character)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors" title="Edit" aria-label={`Edit ${character.name}`}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(character)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Delete" aria-label={`Delete ${character.name}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {character.updated_at && (
                <div className="mt-3 text-[11px] text-white/30">Updated {new Date(character.updated_at).toLocaleDateString()}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="relative w-full max-w-2xl rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-orange-500/15 text-orange-400"><Users size={18} /></div>
                <div>
                  <h3 className="text-white font-semibold">{editing?.id ? 'Edit Character' : 'Add Character'}</h3>
                  <p className="text-white/40 text-xs">{project.title}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <CharacterForm
                initial={editing}
                others={others}
                onSubmit={handleSubmit}
                onCancel={() => setShowForm(false)}
                saving={saving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
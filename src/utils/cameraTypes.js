/**
 * cameraTypes.js
 *
 * The single shared camera-type vocabulary for MANJI. This exact list is used
 * by the Scene camera-type dropdown and the Storyboard shot editor (SCENE FORM
 * rule: keep the vocabulary identical across both so AI context-building and
 * animation tooling rely on one consistent set of values).
 *
 * The order below is the standard shot-type vocabulary:
 * Wide Shot, Medium Shot, Close-Up, Extreme Close-Up, Over-the-Shoulder, POV,
 * Establishing Shot, Tracking Shot, Aerial. "two_shot" is kept for backward
 * compatibility with storyboard panels created before the vocabulary aligned.
 */

export const CAMERA_TYPES = [
  { value: 'wide', label: 'Wide Shot' },
  { value: 'medium', label: 'Medium Shot' },
  { value: 'close_up', label: 'Close-Up' },
  { value: 'extreme_close_up', label: 'Extreme Close-Up' },
  { value: 'over_shoulder', label: 'Over-the-Shoulder' },
  { value: 'pov', label: 'POV' },
  { value: 'establishing', label: 'Establishing Shot' },
  { value: 'tracking', label: 'Tracking Shot' },
  { value: 'aerial', label: 'Aerial' },
  { value: 'two_shot', label: 'Two-shot' },
]

export function cameraTypeLabel(value) {
  return CAMERA_TYPES.find((c) => c.value === value)?.label || value || '—'
}
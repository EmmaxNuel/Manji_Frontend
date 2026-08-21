/**
 * TourOverlay – renders coach-mark highlights and the tour tooltip.
 *
 * - Highlights the target element with a rounded spotlight.
 * - Positions the tooltip below the target (above if no room, bottom of the
 *   viewport on small screens).
 * - Falls back to a centered tooltip if a target is missing, so a stale
 *   selector never crashes a tour.
 */

import { useLayoutEffect, useMemo, useState } from 'react'
import ManjiMascot from '../../components/manji/ManjiMascot'
import { getTour } from './tourSteps'

const SPOTLIGHT_PAD = 6

function useTargetRect(selector) {
  const [rect, setRect] = useState(null)

  useLayoutEffect(() => {
    let raf = 0
    const measure = () => {
      const el = selector ? document.querySelector(selector) : null
      const r = el ? el.getBoundingClientRect() : null
      if (r && (r.width > 0 || r.height > 0)) {
        setRect({
          top: r.top - SPOTLIGHT_PAD,
          left: r.left - SPOTLIGHT_PAD,
          width: r.width + SPOTLIGHT_PAD * 2,
          height: r.height + SPOTLIGHT_PAD * 2,
        })
      } else {
        setRect(null)
      }
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('resize', onScroll)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [selector])

  return rect
}

function TooltipPositioner({ rect, children }) {
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const W = Math.min(vw - 16, 360)
    const H = 240
    let top
    if (rect) {
      const below = rect.top + rect.height + 12
      const above = rect.top - H - 12
      top = below + H <= vh ? below : above >= 0 ? above : vh - H - 16
    } else {
      top = vh - H - 16
    }
    let left = rect ? rect.left + rect.width / 2 - W / 2 : (vw - W) / 2
    left = Math.max(8, Math.min(vw - W - 8, left))
    setPos({ top, left })
  }, [rect])

  return (
    <div className="tour-tooltip" style={{ top: pos.top, left: pos.left }}>
      {children}
    </div>
  )
}

export default function TourOverlay({ visible, tourKey, stepIndex, onNext, onPrev, onClose, onFinish }) {
  const tour = useMemo(() => getTour(tourKey), [tourKey])

  const total = tour ? tour.steps.length : 0
  const isFinal = visible && total > 0 && stepIndex >= total
  const step = visible && !isFinal ? tour?.steps[stepIndex] : null

  const rect = useTargetRect(step?.target)
  const targetMissing = Boolean(visible) && !isFinal && !rect

  if (!visible || !tour) return null

  const scrollToTarget = () => {
    if (step?.target && targetMissing) {
      document.querySelector(step.target)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const final = tour.final || { title: 'Done', body: 'You have completed this tour.', expression: 'celebrating' }
  const current = isFinal ? final : step

  return (
    <>
      {rect && <div className="tour-spotlight" style={rect} onClick={scrollToTarget} />}
      <TooltipPositioner rect={rect}>
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <ManjiMascot expression={current.expression || 'helpful'} size="sm" animated={isFinal ? 'bounce' : 'nod'} />
            </div>
            <div className="min-w-0">
              <div className="text-orange-500 text-[10px] font-semibold tracking-widest uppercase">Manji Guide</div>
              <h3 className="text-sm font-bold text-white leading-tight">{current.title}</h3>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-3 leading-relaxed">{current.body}</p>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)]">
          <div className="tour-dots">
            {!isFinal && total > 0 && tour.steps.map((s, i) => (
              <span key={i} className={`tour-dot ${i === stepIndex ? 'active' : ''}`} />
            ))}
            {isFinal && <span className="text-xs text-white/40">Complete</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-xs text-white/50 hover:text-white transition-colors px-2 py-1">
              Skip
            </button>
            {!isFinal && stepIndex > 0 && (
              <button onClick={onPrev} className="btn-ghost px-3 py-1.5 text-xs justify-center">
                Back
              </button>
            )}
            {!isFinal && stepIndex < total - 1 && (
              <button onClick={onNext} className="btn-primary px-4 py-1.5 text-xs justify-center">
                Next
              </button>
            )}
            {isFinal && (
              <button onClick={onFinish} className="btn-primary px-4 py-1.5 text-xs justify-center">
                Finish
              </button>
            )}
          </div>
        </div>
      </TooltipPositioner>
    </>
  )
}
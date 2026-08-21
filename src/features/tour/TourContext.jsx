/**
 * TourContext – powers the in-app tour guide (Phase 12).
 *
 * - Loads per-user tour state from the backend (persists across devices).
 * - Runs declarative tours defined in tourSteps.js (coach marks + tooltips).
 * - Shows the one-time post-registration prompt.
 * - Never blocks core functionality: every step and the prompt itself can be
 *   skipped, and completed tours can always be replayed on request.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ManjiMascot from '../../components/manji/ManjiMascot'
import { tourService } from './tourService'
import TourOverlay from './TourOverlay'

const TourContext = createContext(null)

const CONTEXTUAL_KEYS = ['create_project', 'project_workspace']

export function TourProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const [tourState, setTourState] = useState(null)
  const [activeTour, setActiveTour] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [fromRegistration, setFromRegistration] = useState(false)
  const [postRegistrationVisible, setPostRegistrationVisible] = useState(false)

  // Load tour state when the user is known.
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setTourState(null)
      return
    }
    let active = true
    ;(async () => {
      try {
        const state = await tourService.getState()
        if (active) setTourState(state)
      } catch {
        // Backend unreachable – tours simply don't auto-start.
      }
    })()
    return () => { active = false }
  }, [isAuthenticated, user])

  const record = useCallback(async (event, tour) => {
    try {
      await tourService.record(event, tour)
      if (event === 'tour_completed' && tour) {
        setTourState((prev) => {
          if (!prev) return prev
          return { ...prev, completed_tours: { ...prev.completed_tours, [tour]: new Date().toISOString() } }
        })
      }
    } catch {
      // Best effort – tour usability must never depend on the network.
    }
  }, [])

  const startTour = useCallback((key, { auto = false } = {}) => {
    if (auto && tourState?.completed_tours?.[key]) return
    setFromRegistration(false)
    setActiveTour(key)
    setStepIndex(0)
  }, [tourState])

  const stopTour = useCallback(({ finished = false } = {}) => {
    const current = activeTour
    if (current) {
      const isContextual = CONTEXTUAL_KEYS.includes(current)
      if (isContextual || finished) record('tour_completed', current)
      if (current === 'welcome' && fromRegistration && finished) {
        record('post_registration_completed')
      }
    }
    setActiveTour(null)
    setStepIndex(0)
  }, [activeTour, fromRegistration, record])

  // If the user navigates mid-tour, end the tour silently so the next page
  // never shows orphaned coach marks. The tour is not marked complete.
  useEffect(() => {
    if (!activeTour) return
    setActiveTour(null)
    setStepIndex(0)
    setFromRegistration(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const next = useCallback(() => setStepIndex((i) => i + 1), [])
  const prev = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), [])

  const openPostRegistration = useCallback(() => {
    record('post_registration_prompted')
    setPostRegistrationVisible(true)
  }, [record])

  const acceptPostRegistration = useCallback(() => {
    setPostRegistrationVisible(false)
    setFromRegistration(true)
    setActiveTour('welcome')
    setStepIndex(0)
  }, [])

  const skipPostRegistration = useCallback(() => {
    setPostRegistrationVisible(false)
    record('post_registration_skipped')
  }, [record])

  const value = {
    tourState,
    activeTour,
    stepIndex,
    postRegistrationVisible,
    startTour,
    stopTour,
    next,
    prev,
    openPostRegistration,
    acceptPostRegistration,
    skipPostRegistration,
  }

  return (
    <TourContext.Provider value={value}>
      {children}
      <TourOverlay
        visible={Boolean(activeTour)}
        tourKey={activeTour}
        stepIndex={stepIndex}
        onNext={next}
        onPrev={prev}
        onClose={() => stopTour({ finished: false })}
        onFinish={() => stopTour({ finished: true })}
      />
      <PostRegistrationPrompt
        visible={postRegistrationVisible}
        onAccept={acceptPostRegistration}
        onSkip={skipPostRegistration}
      />
    </TourContext.Provider>
  )
}

function PostRegistrationPrompt({ visible, onAccept, onSkip }) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-sm rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-orange-600" />
        <div className="flex items-start gap-4 p-6">
          <div className="relative flex-shrink-0">
            <span className="mascot-welcome-ring" />
            <ManjiMascot expression="welcome" size="lg" animated="bounce" />
          </div>
          <div>
            <div className="text-orange-500 text-xs font-semibold tracking-widest uppercase mb-1">MANJI Guide</div>
            <h3 className="text-lg font-bold text-white">Welcome to MANJI!</h3>
            <p className="text-white/60 text-sm mt-1">
              Want a quick tour of the app? It only takes a minute.
            </p>
          </div>
        </div>
        <div className="flex gap-2 p-4 pt-0">
          <button onClick={onSkip} className="btn-ghost flex-1 justify-center text-sm py-2.5">
            Skip for now
          </button>
          <button onClick={onAccept} className="btn-primary flex-1 justify-center text-sm py-2.5">
            Take the tour
          </button>
        </div>
      </div>
    </div>
  )
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within a TourProvider')
  return ctx
}

/**
 * Auto-start a contextual tour the first time the user visits a page.
 * Call with { enabled } set once the page is ready. Tours the user has
 * already seen (or skipped) do not auto-start again.
 */
export function useContextualTour(key, { enabled = true } = {}) {
  const { startTour, tourState } = useTour()
  const firedRef = useRef(false)
  useEffect(() => {
    if (!enabled || firedRef.current) return
    if (!tourState) return // wait for state
    firedRef.current = true
    startTour(key, { auto: true })
  }, [enabled, key, startTour, tourState])
}
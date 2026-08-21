/**
 * ManjiGuide – a reusable guide bubble (mascot + message + optional action).
 *
 * Used in empty states and "coming soon" sections so the mascot speaks for
 * Manji instead of a generic placeholder icon.
 *
 * <ManjiGuide
 *   expression="excited"
 *   label="Manji AI"
 *   title="Characters are on the way"
 *   body="Character sheets arrive in a later phase."
 * >
 *   <button ...>Back to overview</button>
 * </ManjiGuide>
 */

import ManjiMascot from './ManjiMascot'

export default function ManjiGuide({ expression = 'helpful', label = 'Manji Guide', title, body, size = 'lg', animated = 'nod', children }) {
  return (
    <div className="manji-guide-bubble flex flex-col items-center gap-3 text-center max-w-sm mx-auto">
      <div className="relative">
        <span className="mascot-welcome-ring" />
        <ManjiMascot expression={expression} size={size} animated={animated} />
      </div>
      <div className="text-orange-500 text-[10px] font-semibold tracking-widest uppercase">{label}</div>
      {title && <h3 className="text-white font-bold text-lg leading-snug">{title}</h3>}
      {body && <p className="text-white/60 text-sm leading-relaxed">{body}</p>}
      {children && <div className="flex flex-wrap items-center justify-center gap-2 mt-1">{children}</div>}
    </div>
  )
}
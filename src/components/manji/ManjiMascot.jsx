/**
 * ManjiMascot – the friendly guide character of MANJI.
 *
 * A simple, recognizable SVG character built from the existing Manji identity
 * (dark + orange). One core design, a small set of reusable expressions, and
 * lightweight CSS animations (all disabled under prefers-reduced-motion).
 *
 * Usage:
 *   <ManjiMascot expression="welcome" size="md" animated="bounce" />
 */

const EXPRESSION_PARTS = {
  // eyes: open | happy | dots | surprised | worried | bars
  // mouth: smile | small | open | o | flat | wavy | frown | grin
  welcome:    { eyes: 'open',     mouth: 'smile',  sparkles: false },
  happy:      { eyes: 'happy',    mouth: 'smile',  sparkles: false },
  thinking:   { eyes: 'dots',     mouth: 'wavy',   sparkles: false, question: true },
  excited:    { eyes: 'open',     mouth: 'open',   sparkles: true },
  helpful:    { eyes: 'open',     mouth: 'small',  sparkles: false },
  surprised:  { eyes: 'surprised', mouth: 'o',     sparkles: false },
  celebrating:{ eyes: 'happy',    mouth: 'grin',   sparkles: true },
  confused:   { eyes: 'dots',     mouth: 'flat',   sparkles: false, brow: 'confused' },
  error:      { eyes: 'worried',  mouth: 'frown',  sparkles: false, brow: 'worried', sweat: true },
  loading:    { eyes: 'bars',     mouth: 'flat',   sparkles: false },
}

const DEFAULT_EXPRESSION = 'welcome'

function Eyes({ kind, brow }) {
  if (kind === 'happy') {
    return (
      <g>
        <path d="M34 58 Q44 47 54 58" fill="none" stroke="#111" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M66 58 Q76 47 86 58" fill="none" stroke="#111" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    )
  }
  if (kind === 'dots') {
    return (
      <g>
        {brow === 'confused' && (
          <>
            <path d="M36 42 L49 47" stroke="#111" strokeWidth="3" strokeLinecap="round" />
            <path d="M84 47 L71 44" stroke="#111" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {brow === 'worried' && (
          <>
            <path d="M36 43 Q44 48 52 44" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
            <path d="M68 44 Q76 48 84 43" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        <circle cx="44" cy="58" r="3.6" fill="#111" />
        <circle cx="76" cy="58" r="3.6" fill="#111" />
      </g>
    )
  }
  if (kind === 'surprised') {
    return (
      <g>
        <ellipse cx="44" cy="56" rx="9.5" ry="11" fill="#fff" stroke="#111" strokeWidth="2.5" />
        <ellipse cx="76" cy="56" rx="9.5" ry="11" fill="#fff" stroke="#111" strokeWidth="2.5" />
        <circle cx="44" cy="57" r="3.4" fill="#111" />
        <circle cx="76" cy="57" r="3.4" fill="#111" />
      </g>
    )
  }
  if (kind === 'worried') {
    return (
      <g>
        <path d="M36 44 Q44 49 52 45" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
        <path d="M68 45 Q76 49 84 44" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
        <circle cx="44" cy="60" r="3.2" fill="#111" />
        <circle cx="76" cy="60" r="3.2" fill="#111" />
      </g>
    )
  }
  if (kind === 'bars') {
    return (
      <g>
        <rect x="36" y="54" width="16" height="5" rx="2.5" fill="#111" />
        <rect x="68" y="54" width="16" height="5" rx="2.5" fill="#111" />
      </g>
    )
  }
  // open (default)
  return (
    <g>
      <ellipse cx="44" cy="56" rx="8" ry="9" fill="#fff" stroke="#111" strokeWidth="2.5" />
      <ellipse cx="76" cy="56" rx="8" ry="9" fill="#fff" stroke="#111" strokeWidth="2.5" />
      <circle cx="45" cy="57" r="4" fill="#111" />
      <circle cx="77" cy="57" r="4" fill="#111" />
      <circle cx="47" cy="55" r="1.4" fill="#fff" />
      <circle cx="79" cy="55" r="1.4" fill="#fff" />
    </g>
  )
}

function Mouth({ kind }) {
  switch (kind) {
    case 'open':
      return <ellipse cx="60" cy="80" rx="7" ry="8.5" fill="#111" />
    case 'o':
      return <circle cx="60" cy="82" r="5" fill="none" stroke="#111" strokeWidth="3" />
    case 'flat':
      return <path d="M52 81 L68 81" stroke="#111" strokeWidth="3.5" strokeLinecap="round" />
    case 'wavy':
      return <path d="M52 80 Q56 75 60 80 T68 80" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
    case 'frown':
      return <path d="M51 87 Q60 77 69 87" fill="none" stroke="#111" strokeWidth="3.5" strokeLinecap="round" />
    case 'grin':
      return <path d="M46 77 Q60 96 74 77 Q60 84 46 77Z" fill="#111" />
    case 'small':
      return <path d="M53 80 Q60 85 67 80" fill="none" stroke="#111" strokeWidth="3.5" strokeLinecap="round" />
    default: // smile
      return <path d="M50 80 Q60 90 70 80" fill="none" stroke="#111" strokeWidth="3.5" strokeLinecap="round" />
  }
}

function Sparkle({ x, y, size = 8 }) {
  return (
    <path
      d={`M${x} ${y - size} Q${x} ${y} ${x + size} ${y} Q${x} ${y} ${x} ${y + size} Q${x} ${y} ${x - size} ${y} Q${x} ${y} ${x} ${y - size}Z`}
      fill="#ffd700"
    />
  )
}

export default function ManjiMascot({
  expression = 'welcome',
  size = 'md',
  animated = null,
  className = '',
}) {
  const parts = EXPRESSION_PARTS[expression] || EXPRESSION_PARTS[DEFAULT_EXPRESSION]
  const sizes = { xs: 'h-8 w-8', sm: 'h-12 w-12', md: 'h-20 w-20', lg: 'h-32 w-32', xl: 'h-44 w-44' }
  const animClass = animated ? `manji-anim-${animated}` : ''
  const animEye = expression === 'loading' ? ' manji-loading' : ''
  const animSparkle = parts.sparkles ? ' manji-sparkles' : ''

  return (
    <svg
      viewBox="0 0 120 120"
      className={`${sizes[size] || sizes.md} ${animClass} ${className}`}
      role="img"
      aria-label={`Manji mascot, ${expression}`}
    >
      <defs>
        <linearGradient id="manjiHead" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="100%" stopColor="#f7931e" />
        </linearGradient>
      </defs>

      {/* Sparkles (excited / celebrating) */}
      <g className={animSparkle}>
        {parts.sparkles && (
          <>
            <Sparkle x={98} y={16} size={7} />
            <Sparkle x={20} y={14} size={5} />
            <Sparkle x={102} y={64} size={5} />
          </>
        )}
      </g>

      {/* Question mark (thinking) */}
      {parts.question && (
        <g transform="translate(86 20)" className="manji-question">
          <path d="M4 12 a4 4 0 1 1 8 0 c0 3 -4 3 -4 6" fill="none" stroke="#ffd700" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="8" cy="26" r="2.2" fill="#ffd700" />
        </g>
      )}

      {/* Sweat drop (error) */}
      {parts.sweat && (
        <path
          d="M92 40 Q96 50 92 52 Q88 50 92 40Z"
          fill="#7dd3fc"
        />
      )}

      {/* Ears */}
      <circle cx="27" cy="30" r="11" fill="#e55a2b" stroke="#111" strokeWidth="3" />
      <circle cx="93" cy="30" r="11" fill="#e55a2b" stroke="#111" strokeWidth="3" />

      {/* Head */}
      <circle cx="60" cy="62" r="44" fill="url(#manjiHead)" stroke="#111" strokeWidth="3" />

      {/* Cheeks */}
      <ellipse cx="38" cy="74" rx="7" ry="4.5" fill="#ffd700" opacity="0.35" />
      <ellipse cx="82" cy="74" rx="7" ry="4.5" fill="#ffd700" opacity="0.35" />

      {/* Face */}
      <g className={`manji-eyes ${animEye}`}>
        <Eyes kind={parts.eyes} brow={parts.brow} />
      </g>
      <Mouth kind={parts.mouth} />
    </svg>
  )
}
import { useEffect, useState, useRef } from 'react'
import RiskBadge from './RiskBadge'

function getScoreColor(score) {
  if (score >= 650) return { stroke: '#10b981', glow: '#10b98140' }
  if (score >= 450) return { stroke: '#f59e0b', glow: '#f59e0b40' }
  return { stroke: '#ef4444', glow: '#ef444440' }
}

function AnimatedNumber({ target, duration = 1400 }) {
  const [display, setDisplay] = useState(300)
  const raf = useRef(null)

  useEffect(() => {
    const start = 300
    const startTime = performance.now()
    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (target - start) * eased))
      if (progress < 1) raf.current = requestAnimationFrame(animate)
    }
    raf.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return <>{display}</>
}

export default function ScoreCard({ score, riskTier }) {
  const [visible, setVisible] = useState(false)
  const { stroke, glow } = getScoreColor(score)

  // Arc geometry
  const R = 90
  const cx = 110
  const cy = 110
  const startAngle = -210  // degrees, 0 = right
  const sweepTotal = 240   // degrees of arc
  const toRad = (d) => (d * Math.PI) / 180
  const arcX = (angle) => cx + R * Math.cos(toRad(angle))
  const arcY = (angle) => cy + R * Math.sin(toRad(angle))

  const pct = Math.max(0, Math.min(1, (score - 300) / 550))
  const sweepFill = sweepTotal * pct
  const endAngle = startAngle + sweepFill

  const describeArc = (aStart, sweep) => {
    const aEnd = aStart + sweep
    const x1 = arcX(aStart)
    const y1 = arcY(aStart)
    const x2 = arcX(aEnd)
    const y2 = arcY(aEnd)
    const largeArc = sweep > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ filter: `drop-shadow(0 0 20px ${glow})` }}>
        <svg width="220" height="190" viewBox="0 0 220 190">
          {/* Track */}
          <path
            d={describeArc(startAngle, sweepTotal)}
            fill="none"
            stroke="#1f2937"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Fill arc — animated via stroke-dasharray trick */}
          <path
            d={describeArc(startAngle, sweepFill)}
            fill="none"
            stroke={stroke}
            strokeWidth="14"
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.2,0.64,1)',
              opacity: visible ? 1 : 0,
            }}
          />
        </svg>

        {/* Score number overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-4">
          <div
            className="text-5xl font-bold tabular-nums"
            style={{ color: stroke }}
          >
            {visible ? <AnimatedNumber target={score} /> : 300}
          </div>
          <div className="text-xs text-gray-500 mt-1 tracking-widest uppercase">Credit Score</div>
        </div>
      </div>

      <RiskBadge tier={riskTier} size="lg" />

      <div className="flex gap-6 text-xs text-gray-600 mt-1">
        <span>300 Poor</span>
        <span>450 Fair</span>
        <span>650 Good</span>
        <span>850 Excellent</span>
      </div>
    </div>
  )
}

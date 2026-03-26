import { useEffect, useState, useRef } from 'react'

function getScoreLabel(score) {
  if (score >= 750) return 'Excellent'
  if (score >= 650) return 'Good'
  if (score >= 450) return 'Fair'
  return 'Poor'
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

  // Arc geometry
  const R = 90
  const cx = 110
  const cy = 110
  const startAngle = -210
  const sweepTotal = 240
  const toRad = (d) => (d * Math.PI) / 180
  const arcX = (angle) => cx + R * Math.cos(toRad(angle))
  const arcY = (angle) => cy + R * Math.sin(toRad(angle))

  const pct = Math.max(0, Math.min(1, (score - 300) / 550))
  const sweepFill = sweepTotal * pct

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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Arc ring */}
      <div style={{ position: 'relative' }}>
        <svg width="220" height="190" viewBox="0 0 220 190">
          {/* Track */}
          <path
            d={describeArc(startAngle, sweepTotal)}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d={describeArc(startAngle, sweepFill)}
            fill="none"
            stroke="#1A6B5A"
            strokeWidth="14"
            strokeLinecap="round"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}
          />
        </svg>

        {/* Score number */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 16 }}>
          <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 52, fontWeight: 700, color: '#0A0A0A', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {visible ? <AnimatedNumber target={score} /> : 300}
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
            out of 850
          </div>
        </div>
      </div>

      {/* Score label */}
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1A6B5A', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>
        {getScoreLabel(score)}
      </div>
      <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
        AI-Generated Credit Score
      </div>

      {/* Scale */}
      <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
        {[['300', 'Poor'], ['450', 'Fair'], ['650', 'Good'], ['750', 'Excellent']].map(([val, lbl]) => (
          <div key={val} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>{val}</div>
            <div style={{ fontSize: 10, color: '#9CA3AF' }}>{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

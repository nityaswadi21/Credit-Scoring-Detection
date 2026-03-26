import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Avatar SVGs ─────────────────────────────────────────────────────────────

function AvatarGeneralTrader() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="45" y="90" width="70" height="52" rx="12" fill="#E5E7EB"/>
      <rect x="55" y="100" width="50" height="32" rx="8" fill="#D1D5DB"/>
      {/* Head */}
      <rect x="40" y="38" width="80" height="58" rx="16" fill="#9CA3AF"/>
      {/* Face plate */}
      <rect x="50" y="48" width="60" height="38" rx="10" fill="#F3F4F6"/>
      {/* Eyes */}
      <circle cx="67" cy="64" r="8" fill="#6B7280"/>
      <circle cx="93" cy="64" r="8" fill="#6B7280"/>
      <circle cx="69" cy="62" r="3" fill="#fff"/>
      <circle cx="95" cy="62" r="3" fill="#fff"/>
      {/* Mouth */}
      <path d="M68 76 Q80 83 92 76" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Antenna */}
      <line x1="80" y1="38" x2="80" y2="22" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="80" cy="19" r="5" fill="#6B7280"/>
      {/* Arms */}
      <rect x="18" y="95" width="28" height="12" rx="6" fill="#9CA3AF"/>
      <rect x="114" y="95" width="28" height="12" rx="6" fill="#9CA3AF"/>
      {/* Chest indicator light */}
      <circle cx="80" cy="116" r="5" fill="#6B7280" opacity="0.6"/>
      {/* Ears */}
      <rect x="36" y="55" width="8" height="16" rx="4" fill="#6B7280"/>
      <rect x="116" y="55" width="8" height="16" rx="4" fill="#6B7280"/>
    </svg>
  )
}

function AvatarDayTrader() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body — angular, sharp */}
      <rect x="42" y="88" width="76" height="54" rx="8" fill="#FEF3C7"/>
      <rect x="52" y="98" width="56" height="34" rx="5" fill="#FDE68A"/>
      {/* Head */}
      <rect x="38" y="36" width="84" height="58" rx="10" fill="#D97706"/>
      {/* Face plate */}
      <rect x="48" y="45" width="64" height="40" rx="7" fill="#FEF3C7"/>
      {/* Visor eyes — angular slant */}
      <path d="M55 62 L76 58 L76 70 L55 70 Z" fill="#D97706"/>
      <path d="M84 58 L105 62 L105 70 L84 70 Z" fill="#D97706"/>
      <circle cx="65" cy="64" r="3" fill="#FEF9C3"/>
      <circle cx="95" cy="64" r="3" fill="#FEF9C3"/>
      {/* Determined mouth */}
      <rect x="66" y="75" width="28" height="4" rx="2" fill="#D97706"/>
      {/* Lightning antenna */}
      <line x1="80" y1="36" x2="80" y2="20" stroke="#D97706" strokeWidth="3" strokeLinecap="round"/>
      <path d="M84 14 L76 24 L81 24 L75 34 L86 21 L81 21 Z" fill="#FBBF24"/>
      {/* Arms */}
      <rect x="15" y="93" width="28" height="12" rx="4" fill="#D97706"/>
      <rect x="117" y="93" width="28" height="12" rx="4" fill="#D97706"/>
      {/* Chest — lightning bolt */}
      <path d="M84 105 L76 116 L81 116 L77 128 L88 113 L83 113 Z" fill="#D97706"/>
      {/* Ears — angular */}
      <rect x="34" y="52" width="8" height="18" rx="2" fill="#B45309"/>
      <rect x="118" y="52" width="8" height="18" rx="2" fill="#B45309"/>
    </svg>
  )
}

function AvatarMomentumTrader() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body — aerodynamic */}
      <rect x="44" y="90" width="72" height="50" rx="18" fill="#DBEAFE"/>
      <rect x="54" y="100" width="52" height="30" rx="12" fill="#BFDBFE"/>
      {/* Head — forward-leaning oval */}
      <ellipse cx="82" cy="66" rx="42" ry="32" fill="#2563EB"/>
      {/* Face visor */}
      <ellipse cx="82" cy="67" rx="32" ry="22" fill="#EFF6FF"/>
      {/* Eyes — wide excited */}
      <circle cx="70" cy="65" r="9" fill="#2563EB"/>
      <circle cx="94" cy="65" r="9" fill="#2563EB"/>
      <circle cx="72" cy="63" r="4" fill="#fff"/>
      <circle cx="96" cy="63" r="4" fill="#fff"/>
      <circle cx="73" cy="63" r="2" fill="#1E40AF"/>
      <circle cx="97" cy="63" r="2" fill="#1E40AF"/>
      {/* Smile */}
      <path d="M70 76 Q82 85 94 76" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Rocket antenna */}
      <line x1="82" y1="34" x2="82" y2="18" stroke="#2563EB" strokeWidth="3" strokeLinecap="round"/>
      <path d="M82 8 C78 12 76 18 82 18 C88 18 86 12 82 8Z" fill="#3B82F6"/>
      <rect x="79" y="15" width="6" height="6" fill="#BFDBFE"/>
      {/* Boost arms */}
      <rect x="16" y="97" width="29" height="11" rx="8" fill="#2563EB"/>
      <rect x="115" y="97" width="29" height="11" rx="8" fill="#2563EB"/>
      {/* Chest — up arrow */}
      <path d="M82 106 L74 116 L79 116 L79 126 L85 126 L85 116 L90 116 Z" fill="#2563EB"/>
      {/* Speed lines */}
      <line x1="20" y1="105" x2="32" y2="105" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="112" x2="30" y2="112" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="130" y1="105" x2="142" y2="105" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round"/>
      <line x1="132" y1="112" x2="144" y2="112" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function AvatarValueInvestor() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body — wise robes shape */}
      <rect x="40" y="90" width="80" height="52" rx="14" fill="#FEF3C7"/>
      <rect x="50" y="100" width="60" height="32" rx="10" fill="#FDE68A"/>
      {/* Head — wise owl shape */}
      <ellipse cx="80" cy="62" rx="40" ry="32" fill="#92400E"/>
      {/* Face */}
      <ellipse cx="80" cy="64" rx="30" ry="22" fill="#FEF9C3"/>
      {/* Glasses frame */}
      <circle cx="68" cy="62" r="11" fill="none" stroke="#92400E" strokeWidth="3"/>
      <circle cx="92" cy="62" r="11" fill="none" stroke="#92400E" strokeWidth="3"/>
      <line x1="79" y1="62" x2="81" y2="62" stroke="#92400E" strokeWidth="3"/>
      <line x1="57" y1="60" x2="50" y2="57" stroke="#92400E" strokeWidth="3"/>
      <line x1="103" y1="60" x2="110" y2="57" stroke="#92400E" strokeWidth="3"/>
      {/* Eyes behind glasses */}
      <circle cx="68" cy="62" r="6" fill="#92400E"/>
      <circle cx="92" cy="62" r="6" fill="#92400E"/>
      <circle cx="70" cy="60" r="2.5" fill="#fff"/>
      <circle cx="94" cy="60" r="2.5" fill="#fff"/>
      {/* Wise smile */}
      <path d="M70 75 Q80 80 90 75" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Graduation cap */}
      <rect x="55" y="35" width="50" height="8" rx="3" fill="#78350F"/>
      <rect x="70" y="28" width="20" height="10" rx="3" fill="#78350F"/>
      <line x1="105" y1="39" x2="112" y2="50" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="113" cy="52" r="4" fill="#D97706"/>
      {/* Arms */}
      <rect x="17" y="96" width="24" height="12" rx="6" fill="#92400E"/>
      <rect x="119" y="96" width="24" height="12" rx="6" fill="#92400E"/>
      {/* Chest coin */}
      <circle cx="80" cy="116" r="8" fill="#D97706"/>
      <text x="80" y="120" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#78350F">₹</text>
      {/* Ears/feathers */}
      <ellipse cx="42" cy="50" rx="7" ry="12" fill="#78350F"/>
      <ellipse cx="118" cy="50" rx="7" ry="12" fill="#78350F"/>
    </svg>
  )
}

function Avatar({ style }) {
  const avatars = {
    'Day Trader':       <AvatarDayTrader />,
    'Momentum Trader':  <AvatarMomentumTrader />,
    'Value Investor':   <AvatarValueInvestor />,
  }
  return avatars[style] || <AvatarGeneralTrader />
}

// ─── Dropdown ────────────────────────────────────────────────────────────────

function Dropdown({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', appearance: 'none', WebkitAppearance: 'none',
            padding: '10px 36px 10px 12px',
            background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10,
            fontSize: 13, color: value ? '#0A0A0A' : '#9CA3AF',
            fontFamily: 'Inter, sans-serif', cursor: 'pointer',
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e  => e.target.style.borderColor = '#1A6B5A'}
          onBlur={e   => e.target.style.borderColor = '#E5E7EB'}
        >
          <option value="" disabled>Select…</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message }) {
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: '#1A3A2A', color: '#fff', padding: '12px 24px', borderRadius: 12,
      fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 200,
      display: 'flex', alignItems: 'center', gap: 8,
      animation: 'fadeInUp 0.25s ease',
    }}>
      <span style={{ fontSize: 15 }}>✓</span> {message}
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

const STYLE_OPTIONS   = ['General Trader', 'Day Trader', 'Momentum Trader', 'Value Investor']
const RISK_OPTIONS    = ['Conservative', 'Adaptable', 'Aggressive']
const TIME_OPTIONS    = ['Short-term', 'Medium-term', 'Long-term']
const WEIGHTS_OPTIONS = ['Technical', 'Fundamental', 'Balanced']

export default function AIPersona() {
  const navigate = useNavigate()

  const saved = (() => {
    try { return JSON.parse(localStorage.getItem('nuvest_persona') || 'null') } catch { return null }
  })()

  const [name,    setName]    = useState(saved?.name            || '')
  const [style,   setStyle]   = useState(saved?.investment_style || '')
  const [risk,    setRisk]    = useState(saved?.risk_tolerance   || '')
  const [time,    setTime]    = useState(saved?.investment_time  || '')
  const [weights, setWeights] = useState(saved?.analysis_weights || '')
  const [error,   setError]   = useState('')
  const [toast,   setToast]   = useState('')
  const [saving,  setSaving]  = useState(false)

  async function handleSave() {
    if (!name.trim() || !style || !risk || !time || !weights) {
      setError('Please fill in all fields before saving.')
      return
    }
    setError('')
    setSaving(true)

    const persona = {
      name: name.trim(),
      investment_style: style,
      risk_tolerance:   risk,
      investment_time:  time,
      analysis_weights: weights,
    }

    try {
      const res = await fetch('/portfolio/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      localStorage.setItem('nuvest_persona', JSON.stringify(persona))
      setToast(`Persona saved! Your AI advisor is now ${name.trim()}`)
      setTimeout(() => {
        setToast('')
        navigate('/portfolio')
      }, 1800)
    } catch (e) {
      setError(`Could not save: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: 'Inter, sans-serif' }}>

      {/* Navbar */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', height: 56, display: 'flex', alignItems: 'center', padding: '0 28px' }}>
        <button
          onClick={() => navigate('/portfolio')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#374151', fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif', padding: 0 }}
          onMouseOver={e => e.currentTarget.style.color = '#1A6B5A'}
          onMouseOut={e  => e.currentTarget.style.color = '#374151'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          AI Persona
        </button>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 72px' }}>

        {/* Heading */}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0A0A0A', marginBottom: 36, lineHeight: 1.3, letterSpacing: '-0.02em' }}>
          Choose your{' '}
          <span style={{ color: '#1A6B5A' }}>AI</span>{' '}
          persona that meets your investment goals
        </h1>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 28, alignItems: 'start' }}>

          {/* Left — Avatar card */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, aspectRatio: '1 / 1', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <Avatar style={style} />
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              {style || 'AI Avatar'}
            </p>
            {style && (
              <p style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', maxWidth: 180, lineHeight: 1.5, margin: 0 }}>
                {{
                  'General Trader':  'Balanced and versatile — adapts to any market condition.',
                  'Day Trader':      'Fast-moving and sharp — rides intraday momentum.',
                  'Momentum Trader': 'Chases trends and breakouts with energy.',
                  'Value Investor':  'Patient and scholarly — finds hidden value in the fundamentals.',
                }[style]}
              </p>
            )}
          </div>

          {/* Right — Form */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                Name
              </label>
              <input
                type="text"
                placeholder="Type your AI name here"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', background: '#fff',
                  border: '1.5px solid #E5E7EB', borderRadius: 10,
                  fontSize: 13, color: '#0A0A0A', outline: 'none',
                  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#1A6B5A'}
                onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Characteristics label */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                Characteristics
              </p>

              {/* 2×2 dropdown grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Dropdown
                  label="Investment Style"
                  value={style}
                  onChange={setStyle}
                  options={STYLE_OPTIONS}
                />
                <Dropdown
                  label="Risk Tolerance"
                  value={risk}
                  onChange={setRisk}
                  options={RISK_OPTIONS}
                />
                <Dropdown
                  label="Investment Time"
                  value={time}
                  onChange={setTime}
                  options={TIME_OPTIONS}
                />
                <Dropdown
                  label="Analysis Weights"
                  value={weights}
                  onChange={setWeights}
                  options={WEIGHTS_OPTIONS}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, color: '#DC2626' }}>
                {error}
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', padding: '13px',
                background: saving ? '#D1D5DB' : '#1A6B5A',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif', transition: 'background 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseOver={e => { if (!saving) e.currentTarget.style.background = '#155A4A' }}
              onMouseOut={e  => { if (!saving) e.currentTarget.style.background = '#1A6B5A' }}
            >
              {saving ? 'Saving…' : '✦ Save Persona'}
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} />}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}

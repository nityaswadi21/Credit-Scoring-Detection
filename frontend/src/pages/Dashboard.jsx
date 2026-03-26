import { useNavigate } from 'react-router-dom'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStoredData() {
  try {
    const result = JSON.parse(localStorage.getItem('nuvest_last_result') || 'null')
    const form   = JSON.parse(localStorage.getItem('nuvest_last_form')   || 'null')
    return { result, form }
  } catch {
    return { result: null, form: null }
  }
}

function getRiskLabel(tier) {
  if (tier === 'Low')    return 'Top 20%'
  if (tier === 'Medium') return 'Top 55%'
  return 'Top 80%'
}

function getSipCapacity(income) {
  if (!income) return '—'
  const monthly = Math.round(income * 0.20 / 500) * 500
  return '₹' + monthly.toLocaleString('en-IN')
}

function getTaxSaving(income) {
  if (!income) return '—'
  // 80C limit ₹1,50,000; applicable if annual income > ₹5L (30% bracket simplified)
  const annual = income * 12
  if (annual < 500000) return '₹0'
  const saving = Math.min(Math.round(annual * 0.20), 150000)
  return '₹' + saving.toLocaleString('en-IN')
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 14,
      padding: '20px 20px 18px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color: '#0A0A0A', marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      <p style={{ fontSize: 12, color: subColor || '#9CA3AF' }}>{sub}</p>
    </div>
  )
}

function LiveCard({ navigate }) {
  return (
    <div
      onClick={() => navigate('/portfolio')}
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 16,
        padding: 24,
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
      onMouseOver={e => { e.currentTarget.style.borderColor = '#1A6B5A'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,107,90,0.1)' }}
      onMouseOut={e  => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📊</div>
        <span style={{ padding: '3px 10px', borderRadius: 100, background: '#DCFCE7', border: '1px solid #BBF7D0', color: '#166534', fontSize: 11, fontWeight: 600 }}>● Live</span>
      </div>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 6 }}>Zerodha Portfolio</h3>
        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
          View your holdings, P&amp;L, and get AI-powered Buy/Hold/Sell recommendations per stock.
        </p>
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #F3F4F6' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1A6B5A' }}>Open Portfolio →</span>
      </div>
    </div>
  )
}

function ComingSoonCard({ icon, title, description, tag, phase, footer }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 16,
      padding: 24,
      opacity: 0.85,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
        <span style={{ padding: '3px 10px', borderRadius: 100, background: '#F3F4F6', border: '1px solid #E5E7EB', color: '#9CA3AF', fontSize: 11, fontWeight: 500 }}>{tag}</span>
      </div>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 6 }}>{title}</h3>
        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{description}</p>
      </div>
      <div style={{ marginTop: 'auto' }}>
        {footer}
      </div>
    </div>
  )
}

function SkeletonBars() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 14, borderTop: '1px solid #F3F4F6' }}>
      {[80, 55, 35].map((w, i) => (
        <div key={i} style={{ height: 8, borderRadius: 100, background: '#F3F4F6', width: `${w}%` }} />
      ))}
    </div>
  )
}

function PersonaFooter() {
  const personas = [
    { initials: 'WB', name: 'Warren B.', sub: 'Value',       bg: '#FEF3C7', color: '#92400E' },
    { initials: 'CW', name: 'Cathie W.',  sub: 'Growth',      bg: '#EDE9FE', color: '#5B21B6' },
    { initials: 'RD', name: 'Ray D.',     sub: 'Macro',       bg: '#DBEAFE', color: '#1E40AF' },
    { initials: '＋', name: 'Custom',     sub: 'Your style',  bg: '#F3F4F6', color: '#6B7280' },
  ]
  return (
    <div style={{ paddingTop: 14, borderTop: '1px solid #F3F4F6', display: 'flex', gap: 12 }}>
      {personas.map(p => (
        <div key={p.initials} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: p.color }}>
            {p.initials}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#374151' }}>{p.name}</div>
            <div style={{ fontSize: 9, color: '#9CA3AF' }}>{p.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { result, form } = getStoredData()

  // ── Empty state ─────────────────────────────────────────────────────────
  if (!result) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: 'Inter, sans-serif' }}>
        <nav style={{ background: '#1A3A2A', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 0, zIndex: 50 }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#1A6B5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff' }}>N</div>
            <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 600, fontSize: 18, color: '#fff' }}>Nuvest</span>
          </button>
        </nav>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', gap: 16, padding: 24 }}>
          <div style={{ fontSize: 48 }}>📊</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0A0A0A', marginBottom: 4 }}>No score yet</h2>
          <p style={{ fontSize: 14, color: '#6B7280', maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
            Calculate your credit score first to unlock your personalized financial dashboard.
          </p>
          <button
            onClick={() => navigate('/demo')}
            style={{ marginTop: 8, padding: '12px 28px', background: '#1A3A2A', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            onMouseOver={e => e.currentTarget.style.background = '#1A6B5A'}
            onMouseOut={e  => e.currentTarget.style.background = '#1A3A2A'}
          >
            Calculate your credit score →
          </button>
        </div>
      </div>
    )
  }

  const score   = result.score
  const tier    = result.risk_tier
  const income  = form?.monthly_income_estimate || 0
  const sip     = getSipCapacity(income)
  const tax     = getTaxSaving(income)

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: 'Inter, sans-serif', color: '#0A0A0A' }}>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav style={{
        background: '#1A3A2A',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#1A6B5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff' }}>N</div>
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 600, fontSize: 18, color: '#fff' }}>Nuvest</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button onClick={() => navigate('/portfolio')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            onMouseOver={e => e.currentTarget.style.color = '#fff'}
            onMouseOut={e  => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >Portfolio</button>
          <button onClick={() => navigate('/demo')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            onMouseOver={e => e.currentTarget.style.color = '#fff'}
            onMouseOut={e  => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >Recalculate score</button>
          <button onClick={() => navigate('/demo')} style={{
            padding: '7px 16px', background: '#1A6B5A', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            transition: 'background 0.15s',
          }}
            onMouseOver={e => e.currentTarget.style.background = '#155A4A'}
            onMouseOut={e  => e.currentTarget.style.background = '#1A6B5A'}
          >
            Update profile →
          </button>
        </div>
      </nav>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 28px 72px' }}>

        {/* Top score display */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 80, fontWeight: 800, color: '#0A0A0A', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
            {score}
          </div>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 8, fontWeight: 400 }}>
            Based on your most recent profile submission
          </p>
        </div>

        {/* Stat cards row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <StatCard
            label="Credit Score"
            value={String(score)}
            sub="+12 this month"
            subColor="#1A6B5A"
          />
          <StatCard
            label="Risk Tier"
            value={tier}
            sub={getRiskLabel(tier)}
          />
          <StatCard
            label="SIP Capacity"
            value={sip}
            sub="Recommended / mo"
          />
          <StatCard
            label="Tax Saving Opp."
            value={tax}
            sub="Estimated annual"
          />
        </div>

        {/* Feature cards 2×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <LiveCard navigate={navigate} />

          <ComingSoonCard
            icon="📈"
            tag="Phase 3 — Coming Soon"
            title="SIP & ETF Recommendations"
            description="Personalised mutual fund and ETF picks based on your risk tier. Dynamic rebalancing suggestions coming next."
            footer={<SkeletonBars />}
          />

          <ComingSoonCard
            icon="⚙️"
            tag="Phase 3 — Coming Soon"
            title="Tax Optimizer & Harvesting Advisor"
            description="Connect your portfolio to get AI-powered tax-loss harvesting suggestions and Section 80C optimisation."
            footer={<SkeletonBars />}
          />

          <ComingSoonCard
            icon="🧭"
            tag="Phase 4 — Coming Soon"
            title="AI Trader Personality"
            description="Choose a trading persona that matches your goals — get tailored strategies and guidance from AI mentors modelled on legendary investors."
            footer={<PersonaFooter />}
          />
        </div>

      </div>
    </div>
  )
}

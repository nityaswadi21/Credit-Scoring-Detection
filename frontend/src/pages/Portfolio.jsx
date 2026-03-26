import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// ─── Formatters ────────────────────────────────────────────────────────────────
const fmt  = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0)
const fmtN = (n, dp = 2) => (n ?? 0).toFixed(dp)
const sign = (n) => (n >= 0 ? '+' : '')

// ─── Safe error parse ──────────────────────────────────────────────────────────
async function parseErr(res) {
  try { const d = await res.json(); return d.detail || `HTTP ${res.status}` }
  catch { return `HTTP ${res.status}` }
}

// ─── Avatar colours ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#DBEAFE','#1D4ED8'], ['#DCF5E7','#15803D'], ['#FEE2E2','#DC2626'],
  ['#FEF3C7','#D97706'], ['#EDE9FE','#6D28D9'], ['#FCE7F3','#BE185D'],
  ['#CCFBF1','#0F766E'], ['#FFF7ED','#C2410C'],
]
function avatarColors(sym) {
  let h = 0
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

// ─── Sparkline chart data ──────────────────────────────────────────────────────
function makeChartData(symbol, pnl, avgPrice, points = 30) {
  let seed = 0
  for (let i = 0; i < symbol.length; i++) seed = (seed * 31 + symbol.charCodeAt(i)) >>> 0
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xFFFFFFFF }
  const trend = pnl >= 0 ? 1 : -1
  let price = avgPrice * (1 - trend * 0.04)
  const now = Date.now()
  return Array.from({ length: points }, (_, i) => {
    price += trend * (rand() * 3 - 0.8) + (rand() - 0.5) * 2
    const d = new Date(now - (points - i) * 86400000)
    return { date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), price: Math.max(1, +price.toFixed(2)) }
  })
}

// ─── Health ring ───────────────────────────────────────────────────────────────
function HealthRing({ score }) {
  const R = 46, C = 2 * Math.PI * R
  const pct = Math.max(0, Math.min(100, score))
  const dash = (pct / 100) * C
  const color = pct >= 65 ? '#16A34A' : pct >= 40 ? '#D97706' : '#DC2626'
  const label = pct >= 65 ? 'Healthy' : pct >= 40 ? 'At Risk' : 'Critical'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={R} fill="none" stroke="#F3F4F6" strokeWidth="9" />
        <circle cx="55" cy="55" r={R} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${dash} ${C}`} strokeDashoffset={C * 0.25}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        <text x="55" y="51" textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">{pct}</text>
        <text x="55" y="66" textAnchor="middle" fontSize="10" fill="#9CA3AF">/ 100</text>
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
    </div>
  )
}

// ─── Rec badge ─────────────────────────────────────────────────────────────────
function RecBadge({ rec }) {
  if (!rec) return null
  const cfg = {
    Buy:  { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    Hold: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
    Sell: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  }
  const c = cfg[rec] || cfg.Hold
  return (
    <span style={{ padding: '2px 10px', borderRadius: 100, background: c.bg, border: `1px solid ${c.border}`, color: c.color, fontSize: 11, fontWeight: 600 }}>
      {rec}
    </span>
  )
}

// ─── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ white = false, sm = false }) {
  const sz = sm ? 14 : 16
  return (
    <svg style={{ width: sz, height: sz, animation: 'spin 1s linear infinite', color: white ? '#fff' : '#16A34A' }} viewBox="0 0 24 24" fill="none">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  )
}

// ─── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '6px 10px' }}>
      <p style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{fmt(payload[0].value)}</p>
    </div>
  )
}

const SUGGESTED = ['Should I rebalance?', 'Which stocks to sell?', 'Portfolio summary']

// ═══════════════════════════════════════════════════════════════════════════════
export default function Portfolio() {
  const navigate = useNavigate()

  // ── data state ───────────────────────────────────────────────────────────────
  const [status,    setStatus]    = useState({ connected: false, mode: 'mock', user_name: '' })
  const [holdings,  setHoldings]  = useState([])
  const [overview,  setOverview]  = useState(null)
  const [analysis,  setAnalysis]  = useState(null)
  const [selected,  setSelected]  = useState(null)
  const [search,    setSearch]    = useState('')

  // ── loading / error state ────────────────────────────────────────────────────
  const [loadingData, setLoadingData] = useState(false)
  const [loadingAI,   setLoadingAI]   = useState(false)
  const [loadingConn, setLoadingConn] = useState(false)
  const [error,       setError]       = useState(null)
  const [aiError,     setAiError]     = useState(null)

  // ── right panel state ────────────────────────────────────────────────────────
  const [aiExpanded,   setAiExpanded]   = useState(true)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput,    setChatInput]    = useState('')
  const [chatLoading,  setChatLoading]  = useState(false)
  const chatEndRef   = useRef(null)
  const chatInputRef = useRef(null)

  // ── on mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const rt = params.get('request_token')
    if (rt) { window.history.replaceState({}, '', window.location.pathname); handleCallback(rt) }
    else loadAll()
  }, [])

  // ── auto-scroll chat ──────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ── load all data ─────────────────────────────────────────────────────────────
  async function loadAll() {
    setLoadingData(true); setError(null)
    try {
      const [sRes, hRes, oRes] = await Promise.all([
        fetch('/portfolio/status'), fetch('/portfolio/holdings'), fetch('/portfolio/overview'),
      ])
      if (!sRes.ok || !hRes.ok || !oRes.ok)
        throw new Error(`Data fetch failed (${sRes.status}/${hRes.status}/${oRes.status})`)
      const [s, h, o] = await Promise.all([sRes.json(), hRes.json(), oRes.json()])
      setStatus(s); setHoldings(h.holdings || []); setOverview(o.overview || null)
    } catch (e) { setError(e.message) }
    finally { setLoadingData(false) }
  }

  // ── Kite connect ──────────────────────────────────────────────────────────────
  async function handleConnect() {
    setLoadingConn(true); setError(null)
    try {
      const res = await fetch('/portfolio/login')
      if (!res.ok) throw new Error(await parseErr(res))
      const { login_url } = await res.json()
      window.location.href = login_url
    } catch (e) { setError('Could not get Zerodha login URL: ' + e.message); setLoadingConn(false) }
  }

  // ── Kite callback ─────────────────────────────────────────────────────────────
  async function handleCallback(requestToken) {
    setLoadingData(true); setError(null)
    try {
      const res = await fetch(`/portfolio/callback?request_token=${encodeURIComponent(requestToken)}`)
      if (!res.ok) throw new Error(await parseErr(res))
      await loadAll()
    } catch (e) { setError('Token exchange failed: ' + e.message); setLoadingData(false) }
  }

  // ── Disconnect ────────────────────────────────────────────────────────────────
  async function handleDisconnect() {
    try { await fetch('/portfolio/logout', { method: 'DELETE' }) } catch {}
    setAnalysis(null); await loadAll()
  }

  // ── AI analysis ───────────────────────────────────────────────────────────────
  async function runAnalysis() {
    setLoadingAI(true); setAiError(null)
    try {
      const res = await fetch('/portfolio/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mock: status.mode === 'mock' }),
      })
      if (!res.ok) throw new Error(await parseErr(res))
      const data = await res.json()
      setHoldings(data.holdings || [])
      if (data.overview) setOverview(data.overview)
      setAnalysis(data.analysis || null)
    } catch (e) { setAiError(e.message) }
    finally { setLoadingAI(false) }
  }

  // ── Portfolio chat (SSE streaming) ────────────────────────────────────────────
  async function sendChat(msg) {
    const message = (msg ?? chatInput).trim()
    if (!message || chatLoading) return
    setChatMessages(prev => [...prev,
      { role: 'user',      content: message },
      { role: 'assistant', content: '' },
    ])
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/portfolio/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, holdings, overview, health_score: healthScore }),
      })
      if (!res.ok) throw new Error(await parseErr(res))
      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break
          try {
            const { text } = JSON.parse(payload)
            setChatMessages(prev => {
              const msgs = [...prev]
              msgs[msgs.length - 1] = { role: 'assistant', content: msgs[msgs.length - 1].content + text }
              return msgs
            })
          } catch {}
        }
      }
    } catch (e) {
      setChatMessages(prev => {
        const msgs = [...prev]
        msgs[msgs.length - 1] = { role: 'assistant', content: `Sorry, something went wrong: ${e.message}` }
        return msgs
      })
    } finally { setChatLoading(false) }
  }

  // ── derived ───────────────────────────────────────────────────────────────────
  const healthScore = overview
    ? Math.round(Math.min(100, Math.max(0,
        50 + (overview.total_pnl_pct ?? 0) * 1.5 + (overview.day_change_pct ?? 0) * 2 + (overview.holdings_count ?? 0) * 2
      ))) : 0

  const isLive = status.mode === 'live' && status.connected

  const filtered = holdings.filter(h => h.tradingsymbol.toLowerCase().includes(search.toLowerCase()))

  const selectedHolding = holdings.find(h => h.tradingsymbol === selected)
  const chartData  = useMemo(() =>
    selectedHolding ? makeChartData(selectedHolding.tradingsymbol, selectedHolding.pnl, selectedHolding.average_price) : [],
    [selectedHolding])
  const chartColor = selectedHolding?.pnl >= 0 ? '#16A34A' : '#DC2626'

  // ─── shared style tokens ──────────────────────────────────────────────────────
  const S = {
    sectionLabel: {
      fontSize: 9, fontWeight: 700, color: '#9CA3AF',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      fontFamily: 'Inter, sans-serif',
    },
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAF8', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav style={{ flexShrink: 0, background: '#1A3A2A', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 40 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#1A6B5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>N</div>
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 600, fontSize: 17, color: '#fff' }}>Nuvest</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { label: 'Dashboard',    path: '/dashboard',  active: false },
            { label: 'Portfolio',    path: '/portfolio',  active: true  },
            { label: 'Credit Score', path: '/demo',       active: false },
          ].map(({ label, path, active }) => (
            <button key={label} onClick={() => navigate(path)}
              style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 13, fontFamily: 'Inter, sans-serif',
                fontWeight: active ? 700 : 400,
                background: active ? 'rgba(255,255,255,0.12)' : 'none',
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseOver={e => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' } }}
              onMouseOut={e  => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.background = 'none' } }}
            >{label}</button>
          ))}
        </div>
      </nav>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ flexShrink: 0, background: '#FEF2F2', borderBottom: '1px solid #FECACA', padding: '7px 20px', fontSize: 12, color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* ── 3-column body ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ──────────────────────────────────────────────────────────────────
            LEFT PANEL — 160px — holdings list
        ────────────────────────────────────────────────────────────────── */}
        <aside style={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '18px 0 0' }}>

          {/* Net Worth */}
          <div style={{ padding: '0 14px 14px' }}>
            <p style={{ ...S.sectionLabel, marginBottom: 6 }}>Net Worth</p>
            {loadingData
              ? <div style={{ height: 28, width: 110, background: '#E5E7EB', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
              : <p style={{ fontSize: 20, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{fmt(overview?.current_value)}</p>
            }
            {overview && (
              <p style={{ fontSize: 11, fontWeight: 500, marginTop: 3, color: overview.total_pnl >= 0 ? '#16A34A' : '#DC2626' }}>
                {sign(overview.total_pnl)}{fmt(overview.total_pnl)}<br />
                <span style={{ fontSize: 10 }}>({sign(overview.total_pnl_pct)}{fmtN(overview.total_pnl_pct)}%)</span>
              </p>
            )}
          </div>

          {/* Search */}
          <div style={{ padding: '0 10px 10px' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Search holdings..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: 24, paddingRight: 8, paddingTop: 6, paddingBottom: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 11, color: '#374151', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}
                onFocus={e => e.target.style.borderColor = '#1A6B5A'}
                onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
          </div>

          {/* Holdings list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingData ? (
              <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E5E7EB', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 10, width: 60, background: '#E5E7EB', borderRadius: 4, marginBottom: 5 }} />
                      <div style={{ height: 8, width: 40, background: '#F3F4F6', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.map(h => {
              const [bg, fg] = avatarColors(h.tradingsymbol)
              const isSel = selected === h.tradingsymbol
              return (
                <button key={h.tradingsymbol}
                  onClick={() => setSelected(isSel ? null : h.tradingsymbol)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px 8px 11px',
                    background: isSel ? '#fff' : 'transparent',
                    border: 'none', borderLeft: isSel ? '3px solid #1A6B5A' : '3px solid transparent',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
                    boxSizing: 'border-box',
                  }}
                  onMouseOver={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.6)' }}
                  onMouseOut={e  => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: bg, color: fg }}>
                    {h.tradingsymbol.slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#0A0A0A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.tradingsymbol}</p>
                    <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>{h.quantity} shares</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, margin: 0, color: h.pnl >= 0 ? '#16A34A' : '#DC2626' }}>{sign(h.pnl)}{fmt(h.pnl)}</p>
                    <p style={{ fontSize: 9, margin: 0, color: h.day_change_percentage >= 0 ? '#16A34A' : '#DC2626' }}>{sign(h.day_change_percentage)}{fmtN(h.day_change_percentage)}%</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Zerodha connect (moved from navbar) */}
          <div style={{ padding: '10px 10px 14px', flexShrink: 0 }}>
            {isLive ? (
              <button onClick={handleDisconnect}
                style={{ width: '100%', padding: '6px 0', background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 10, fontWeight: 500, color: '#6B7280', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Disconnect
              </button>
            ) : (
              <button onClick={handleConnect} disabled={loadingConn}
                style={{ width: '100%', padding: '6px 0', background: '#1A6B5A', border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 600, color: '#fff', cursor: loadingConn ? 'not-allowed' : 'pointer', opacity: loadingConn ? 0.6 : 1, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {loadingConn ? <Spinner white sm /> : null}
                {loadingConn ? 'Connecting…' : 'Connect Zerodha'}
              </button>
            )}
          </div>
        </aside>

        {/* ──────────────────────────────────────────────────────────────────
            CENTER PANEL — flex-1 — stock detail
        ────────────────────────────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '18px 16px' }}>
          {selectedHolding ? (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', height: '100%', boxSizing: 'border-box', minHeight: 0 }}>

              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {(() => {
                    const [bg, fg] = avatarColors(selectedHolding.tradingsymbol)
                    return (
                      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: bg, color: fg }}>
                        {selectedHolding.tradingsymbol.slice(0, 2)}
                      </div>
                    )
                  })()}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: '#0A0A0A' }}>{selectedHolding.tradingsymbol}</span>
                      {selectedHolding.recommendation && <RecBadge rec={selectedHolding.recommendation} />}
                    </div>
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                      {selectedHolding.exchange} · {selectedHolding.product} · {selectedHolding.quantity} shares
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 4, lineHeight: 1 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 36, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>
                  {fmt(selectedHolding.last_price)}
                </p>
                <p style={{ fontSize: 13, fontWeight: 500, marginTop: 5, color: selectedHolding.day_change >= 0 ? '#16A34A' : '#DC2626' }}>
                  {selectedHolding.day_change >= 0 ? '▲' : '▼'} {fmt(Math.abs(selectedHolding.day_change))} ({sign(selectedHolding.day_change_percentage)}{fmtN(selectedHolding.day_change_percentage)}%) today
                </p>
              </div>

              {/* Chart */}
              <div style={{ marginBottom: 20, height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={chartColor} stopOpacity={0.1} />
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval={7} />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={2} fill="url(#cg)"
                      dot={false} activeDot={{ r: 4, fill: chartColor, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 3-stat row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid #F3F4F6', borderRadius: 12, overflow: 'hidden', marginBottom: 18 }}>
                {[
                  { label: 'AVG BUY',   value: fmt(selectedHolding.average_price),                              colored: false },
                  { label: 'INVESTED',  value: fmt(selectedHolding.quantity * selectedHolding.average_price),   colored: false },
                  { label: 'TOTAL P&L', value: `${sign(selectedHolding.pnl)}${fmt(selectedHolding.pnl)}`,       colored: true, val: selectedHolding.pnl },
                ].map(({ label, value, colored, val }, i) => (
                  <div key={label} style={{ padding: '12px 14px', background: '#fff', borderRight: i < 2 ? '1px solid #F3F4F6' : 'none' }}>
                    <p style={{ ...S.sectionLabel, marginBottom: 5 }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: colored ? (val >= 0 ? '#16A34A' : '#DC2626') : '#0A0A0A' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* AI Insight */}
              {selectedHolding.rec_reason && (
                <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ ...S.sectionLabel, marginBottom: 6 }}>AI Insight</p>
                  <p style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.6, margin: 0 }}>{selectedHolding.rec_reason}</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              </div>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Select a holding to view chart &amp; details</p>
            </div>
          )}
        </main>

        {/* ──────────────────────────────────────────────────────────────────
            RIGHT PANEL — 220px — health + AI + chat
        ────────────────────────────────────────────────────────────────── */}
        <aside style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 18 }}>

          {/* Top scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '0 14px' }}>

            {/* Portfolio Health */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ ...S.sectionLabel, marginBottom: 12 }}>Portfolio Health</p>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <HealthRing score={healthScore} />
              </div>
              {overview && (
                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                  <span>↑ <strong style={{ color: '#16A34A' }}>{overview.top_gainer}</strong></span>
                  <span>↓ <strong style={{ color: '#DC2626' }}>{overview.top_loser}</strong></span>
                </div>
              )}
            </div>

            {/* AI Assessment */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ ...S.sectionLabel, margin: 0 }}>AI Assessment</p>
                {loadingAI && <Spinner sm />}
              </div>

              {aiError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#DC2626', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ lineHeight: 1.5 }}>{aiError}</span>
                  <button onClick={() => setAiError(null)} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: 13, lineHeight: 1, flexShrink: 0 }}>✕</button>
                </div>
              )}

              {analysis?.portfolio_health ? (
                <>
                  <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.65, margin: '0 0 10px' }}>{analysis.portfolio_health}</p>
                  {analysis.suggestions?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {analysis.suggestions.map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#1A6B5A', flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                          <p style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{s}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                !loadingAI && (
                  <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', padding: '4px 0' }}>
                    Run analysis to get AI recommendations
                  </p>
                )
              )}

              <button onClick={runAnalysis} disabled={loadingAI}
                style={{ width: '100%', marginTop: 12, padding: '7px 0', background: loadingAI ? '#E5E7EB' : '#1A3A2A', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#fff', cursor: loadingAI ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.15s' }}
                onMouseOver={e => { if (!loadingAI) e.currentTarget.style.background = '#1A6B5A' }}
                onMouseOut={e  => { if (!loadingAI) e.currentTarget.style.background = '#1A3A2A' }}
              >
                {loadingAI ? <><Spinner white sm /><span>Analysing…</span></> : '↻ Run AI Analysis'}
              </button>
            </div>

          </div>

          {/* ── Chat (fixed bottom) ──────────────────────────────────────── */}
          <div style={{ flexShrink: 0, borderTop: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '10px 14px 6px' }}>
              <p style={{ ...S.sectionLabel, margin: 0 }}>Ask About Your Portfolio</p>
            </div>

            {/* Messages */}
            <div style={{ overflowY: 'auto', padding: '4px 10px 4px', maxHeight: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {chatMessages.length === 0 ? (
                <div style={{ padding: '10px 0', textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#D1D5DB', margin: 0 }}>Ask anything about your holdings</p>
                </div>
              ) : chatMessages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%', padding: '7px 10px', borderRadius: 12,
                    fontSize: 11, lineHeight: 1.55,
                    background: m.role === 'user' ? '#1A3A2A' : '#F3F4F6',
                    color: m.role === 'user' ? '#fff' : '#374151',
                    borderBottomRightRadius: m.role === 'user' ? 3 : 12,
                    borderBottomLeftRadius:  m.role === 'user' ? 12 : 3,
                  }}>
                    {m.content
                      ? m.content
                      : m.role === 'assistant' && chatLoading && i === chatMessages.length - 1
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#9CA3AF' }}>
                            <span style={{ animation: 'bounce 1s infinite 0ms' }}>●</span>
                            <span style={{ animation: 'bounce 1s infinite 150ms' }}>●</span>
                            <span style={{ animation: 'bounce 1s infinite 300ms' }}>●</span>
                          </span>
                        : '…'}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestion chips */}
            {chatMessages.length === 0 && (
              <div style={{ padding: '0 10px 8px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => sendChat(q)} disabled={chatLoading}
                    style={{ padding: '4px 9px', borderRadius: 100, background: '#fff', border: '1px solid #E5E7EB', fontSize: 10, color: '#6B7280', cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: chatLoading ? 0.5 : 1, transition: 'border-color 0.12s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#1A6B5A'}
                    onMouseOut={e  => e.currentTarget.style.borderColor = '#E5E7EB'}
                  >{q}</button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={{ padding: '0 10px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                ref={chatInputRef}
                type="text"
                placeholder="Ask a question…"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                disabled={chatLoading}
                style={{ flex: 1, padding: '7px 10px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 11, color: '#374151', outline: 'none', fontFamily: 'Inter, sans-serif', opacity: chatLoading ? 0.5 : 1, transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#1A6B5A'}
                onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
              />
              <button onClick={() => sendChat()} disabled={!chatInput.trim() || chatLoading}
                style={{ width: 30, height: 30, borderRadius: '50%', background: (!chatInput.trim() || chatLoading) ? '#E5E7EB' : '#1A6B5A', border: 'none', cursor: (!chatInput.trim() || chatLoading) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                {chatLoading
                  ? <Spinner white sm />
                  : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
              </button>
            </div>

          </div>
        </aside>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      `}</style>
    </div>
  )
}

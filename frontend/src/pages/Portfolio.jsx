import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// ─── Formatters ────────────────────────────────────────────────────────────────
const fmt  = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0)
const fmtN = (n, dp = 2) => (n ?? 0).toFixed(dp)
const sign = (n) => (n >= 0 ? '+' : '')

// ─── Safe error parse (handles non-JSON / empty backend errors) ────────────────
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
    <div className="flex flex-col items-center gap-2">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={R} fill="none" stroke="#F3F4F6" strokeWidth="9" />
        <circle cx="55" cy="55" r={R} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${dash} ${C}`} strokeDashoffset={C * 0.25}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        <text x="55" y="51" textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">{pct}</text>
        <text x="55" y="66" textAnchor="middle" fontSize="10" fill="#9CA3AF">/ 100</text>
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>{label} Portfolio</span>
    </div>
  )
}

// ─── Rec badge ─────────────────────────────────────────────────────────────────
function RecBadge({ rec }) {
  if (!rec) return null
  const s = { Buy: 'bg-green-50 text-green-700', Hold: 'bg-amber-50 text-amber-700', Sell: 'bg-red-50 text-red-700' }
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s[rec] || s.Hold}`}>{rec}</span>
}

// ─── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ white = false, sm = false }) {
  return (
    <svg className={`animate-spin ${sm ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${white ? 'text-white' : 'text-[#16A34A]'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  )
}

// ─── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900">{fmt(payload[0].value)}</p>
    </div>
  )
}

const SUGGESTED = ['Should I rebalance?', "What's my biggest risk?", 'Which stock should I exit?']

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
  const grouped  = useMemo(() => {
    const map = {}
    for (const h of filtered) { const ex = h.exchange || 'NSE'; if (!map[ex]) map[ex] = []; map[ex].push(h) }
    return map
  }, [filtered])

  const selectedHolding = holdings.find(h => h.tradingsymbol === selected)
  const chartData  = useMemo(() =>
    selectedHolding ? makeChartData(selectedHolding.tradingsymbol, selectedHolding.pnl, selectedHolding.average_price) : [],
    [selectedHolding])
  const chartColor = selectedHolding?.pnl >= 0 ? '#16A34A' : '#DC2626'

  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="flex-shrink-0 bg-white border-b border-gray-100 z-40">
        <div className="px-5 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#16A34A] flex items-center justify-center font-bold text-xs text-white">N</div>
            <span className="font-bold text-base text-gray-900 tracking-tight">Nuvest</span>
          </button>
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Dashboard',    path: '/dashboard' },
              { label: 'Portfolio',    path: '/portfolio', active: true },
              { label: 'Credit Score', path: '/demo' },
            ].map(({ label, path, active }) => (
              <button key={label} onClick={() => navigate(path)}
                className={`px-3.5 py-1.5 text-sm rounded-lg transition-colors ${active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isLive ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500' : 'bg-amber-400'}`} />
              {isLive ? `Live · ${status.user_name}` : 'Mock Data'}
            </span>
            {isLive ? (
              <button onClick={handleDisconnect}
                className="px-3.5 py-1.5 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:border-red-200 hover:text-red-600 transition-colors">
                Disconnect
              </button>
            ) : (
              <button onClick={handleConnect} disabled={loadingConn}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 text-sm font-medium text-white transition-colors">
                {loadingConn
                  ? <Spinner white sm />
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>}
                Connect Zerodha
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex-shrink-0 bg-red-50 border-b border-red-100 px-5 py-2 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* ── 3-column body ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ────────────────────────────────────────────────────────────────────
            LEFT PANEL — 280px — holdings list
        ──────────────────────────────────────────────────────────────────── */}
        <aside className="w-[280px] flex-shrink-0 border-r border-gray-100 flex flex-col bg-[#FAFAF9] overflow-hidden">

          {/* Net Worth */}
          <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-100">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net Worth</p>
            {loadingData
              ? <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
              : <p className="text-2xl font-bold text-gray-900 tracking-tight">{fmt(overview?.current_value)}</p>}
            {overview && (
              <p className={`text-xs font-medium mt-0.5 ${overview.total_pnl >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                {sign(overview.total_pnl)}{fmt(overview.total_pnl)} ({sign(overview.total_pnl_pct)}{fmtN(overview.total_pnl_pct)}%)
              </p>
            )}
          </div>

          {/* Search */}
          <div className="flex-shrink-0 px-3 py-2.5 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Search holdings…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]" />
            </div>
          </div>

          {/* Holdings */}
          <div className="flex-1 overflow-y-auto">
            {loadingData ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1"><div className="h-3 w-20 bg-gray-200 rounded mb-1.5" /><div className="h-2.5 w-14 bg-gray-100 rounded" /></div>
                    <div className="h-3 w-12 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : Object.entries(grouped).map(([exchange, items]) => (
              <div key={exchange}>
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{exchange}</span>
                </div>
                {items.map(h => {
                  const [bg, fg] = avatarColors(h.tradingsymbol)
                  const isSel = selected === h.tradingsymbol
                  return (
                    <button key={h.tradingsymbol} onClick={() => setSelected(isSel ? null : h.tradingsymbol)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${isSel ? 'bg-white shadow-sm' : 'hover:bg-white/70'}`}>
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold" style={{ background: bg, color: fg }}>
                        {h.tradingsymbol.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{h.tradingsymbol}</p>
                        <p className="text-[10px] text-gray-400">{h.quantity} shares</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-semibold ${h.pnl >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{sign(h.pnl)}{fmt(h.pnl)}</p>
                        <p className={`text-[10px] ${h.day_change_percentage >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>{sign(h.day_change_percentage)}{fmtN(h.day_change_percentage)}%</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* ────────────────────────────────────────────────────────────────────
            CENTER PANEL — flex-1 — stock detail
        ──────────────────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-white">
          {selectedHolding ? (
            <div className="max-w-xl mx-auto px-8 py-8">

              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  {(() => {
                    const [bg, fg] = avatarColors(selectedHolding.tradingsymbol)
                    return (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: bg, color: fg }}>
                        {selectedHolding.tradingsymbol.slice(0, 2)}
                      </div>
                    )
                  })()}
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-xl font-bold text-gray-900">{selectedHolding.tradingsymbol}</h2>
                      {selectedHolding.recommendation && <RecBadge rec={selectedHolding.recommendation} />}
                    </div>
                    <p className="text-xs text-gray-400">{selectedHolding.exchange} · {selectedHolding.product} · {selectedHolding.quantity} shares</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Price */}
              <div className="mb-5">
                <p className="text-4xl font-bold text-gray-900 tracking-tight">{fmt(selectedHolding.last_price)}</p>
                <p className={`text-sm font-medium mt-1 ${selectedHolding.day_change >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {sign(selectedHolding.day_change)}{fmt(selectedHolding.day_change)} ({sign(selectedHolding.day_change_percentage)}{fmtN(selectedHolding.day_change_percentage)}%) today
                </p>
              </div>

              {/* Chart */}
              <div className="mb-7" style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={chartColor} stopOpacity={0.12} />
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

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-0 rounded-xl border border-gray-100 overflow-hidden mb-5">
                {[
                  { label: 'Avg Buy',     value: fmt(selectedHolding.average_price) },
                  { label: 'Current',     value: fmt(selectedHolding.last_price) },
                  { label: 'Quantity',    value: selectedHolding.quantity },
                  { label: 'Invested',    value: fmt(selectedHolding.quantity * selectedHolding.average_price) },
                  { label: 'Curr. Value', value: fmt(selectedHolding.quantity * selectedHolding.last_price) },
                  { label: 'Total P&L',   value: `${sign(selectedHolding.pnl)}${fmt(selectedHolding.pnl)}`, colored: true, val: selectedHolding.pnl },
                ].map(({ label, value, colored, val }, i) => (
                  <div key={label} className={`px-4 py-3.5 bg-white ${i < 3 ? 'border-b border-gray-100' : ''} ${i % 3 !== 2 ? 'border-r border-gray-100' : ''}`}>
                    <p className="text-[10px] text-gray-400 mb-1">{label}</p>
                    <p className={`text-sm font-semibold ${colored ? (val >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]') : 'text-gray-900'}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* AI insight */}
              {selectedHolding.rec_reason && (
                <div className="rounded-xl bg-gray-50 px-4 py-3.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">AI Insight</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{selectedHolding.rec_reason}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-400">Select a holding to view chart &amp; details</p>
            </div>
          )}
        </main>

        {/* ────────────────────────────────────────────────────────────────────
            RIGHT PANEL — 320px — AI Analysis + Chat
        ──────────────────────────────────────────────────────────────────── */}
        <aside className="w-[320px] flex-shrink-0 border-l border-gray-100 flex flex-col overflow-hidden bg-white">

          {/* Top scrollable: health + AI assessment */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* Portfolio Health */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">Portfolio Health</p>
              <div className="flex justify-center mb-3">
                <HealthRing score={healthScore} />
              </div>
              {overview && (
                <div className="flex justify-around text-xs text-gray-500 mt-1">
                  <span>↑ <strong className="text-[#16A34A]">{overview.top_gainer}</strong></span>
                  <span>↓ <strong className="text-[#DC2626]">{overview.top_loser}</strong></span>
                </div>
              )}
            </div>

            {/* AI Assessment — collapsible */}
            <div className="border-b border-gray-100">
              <button onClick={() => setAiExpanded(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">AI Assessment</span>
                <div className="flex items-center gap-2">
                  {loadingAI && <Spinner sm />}
                  {aiError && !loadingAI && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform duration-200 ${aiExpanded ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </button>

              {aiExpanded && (
                <div className="px-5 pb-4 space-y-3">
                  {aiError && (
                    <div className="flex items-start justify-between bg-red-50 rounded-lg px-3 py-2 text-xs text-red-700">
                      <span className="leading-relaxed">{aiError}</span>
                      <button onClick={() => setAiError(null)} className="ml-2 text-red-400 hover:text-red-600 flex-shrink-0 mt-0.5">✕</button>
                    </div>
                  )}

                  {analysis?.portfolio_health && (
                    <p className="text-xs text-gray-600 leading-relaxed">{analysis.portfolio_health}</p>
                  )}

                  {analysis?.suggestions?.length > 0 && (
                    <div className="space-y-2">
                      {analysis.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5 border-l-2 border-teal-500 bg-teal-50/50 rounded-r-lg px-3 py-2.5">
                          <span className="text-[10px] font-bold text-teal-600 flex-shrink-0 mt-0.5">{i + 1}</span>
                          <p className="text-xs text-gray-700 leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {!analysis && !loadingAI && !aiError && (
                    <p className="text-xs text-gray-400 text-center py-1">Run analysis to get AI recommendations</p>
                  )}

                  <button onClick={runAnalysis} disabled={loadingAI}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-60 text-xs font-semibold text-white transition-colors mt-1">
                    {loadingAI ? <><Spinner white sm /><span>Analysing…</span></> : <span>↻  Run AI Analysis</span>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Chat (fixed bottom section) ───────────────────────────────── */}
          <div className="flex-shrink-0 flex flex-col border-t border-gray-100">

            {/* Chat title */}
            <div className="px-5 py-2.5 border-b border-gray-50">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Ask About Your Portfolio</p>
            </div>

            {/* Messages window */}
            <div className="overflow-y-auto px-3 py-2.5 space-y-2" style={{ maxHeight: 280 }}>
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  <p className="text-xs text-gray-300">Ask anything about your holdings</p>
                </div>
              ) : chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gray-900 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {m.content
                      ? m.content
                      : m.role === 'assistant' && chatLoading && i === chatMessages.length - 1
                        ? <span className="flex items-center gap-1 text-gray-400">
                            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
                          </span>
                        : '…'}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested chips */}
            {chatMessages.length === 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => sendChat(q)} disabled={chatLoading}
                    className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-[10px] text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors disabled:opacity-50">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-1">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-[#16A34A] focus-within:ring-2 focus-within:ring-[#16A34A]/10 transition-all">
                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder="Ask a question…"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                  disabled={chatLoading}
                  className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50"
                />
                <button onClick={() => sendChat()} disabled={!chatInput.trim() || chatLoading}
                  className="w-6 h-6 rounded-lg bg-[#16A34A] disabled:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
                  {chatLoading
                    ? <Spinner white sm />
                    : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                </button>
              </div>
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}

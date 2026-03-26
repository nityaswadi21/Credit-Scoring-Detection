import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Helper components ────────────────────────────────────────────────────────

function RecBadge({ rec }) {
  if (!rec) return null
  const styles = {
    Buy:  'bg-emerald-50 border-emerald-200 text-emerald-700',
    Hold: 'bg-amber-50  border-amber-200  text-amber-700',
    Sell: 'bg-red-50    border-red-200    text-red-700',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${styles[rec] || styles.Hold}`}>
      {rec}
    </span>
  )
}

function OverviewCard({ label, value, sub, color = 'text-[#0A0A0A]' }) {
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-xl p-4 shadow-sm">
      <p className="text-xs text-[#A39E98] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && (
        <p className={`text-xs mt-0.5 ${
          sub.startsWith('+') ? 'text-emerald-700'
          : sub.startsWith('-') ? 'text-red-600'
          : 'text-[#A39E98]'
        }`}>{sub}</p>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-[#1A6B5A]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  )
}

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
const fmtN = (n, dp = 2) => n?.toFixed(dp)

// ─── Main component ────────────────────────────────────────────────────────────

export default function Portfolio() {
  const navigate = useNavigate()

  const [holdings, setHoldings]   = useState([])
  const [overview, setOverview]   = useState(null)
  const [analysis, setAnalysis]   = useState(null)

  const [useMock, setUseMock]           = useState(true)
  const [isConnected, setIsConnected]   = useState(false)
  const [loadingData, setLoadingData]   = useState(false)
  const [loadingAI, setLoadingAI]       = useState(false)
  const [error, setError]               = useState(null)
  const [aiError, setAiError]           = useState(null)
  const [accessToken, setAccessToken]   = useState(
    () => localStorage.getItem('kite_access_token') || ''
  )

  useEffect(() => { fetchHoldings() }, [useMock])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requestToken = params.get('request_token')
    if (requestToken) {
      exchangeToken(requestToken)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function fetchHoldings() {
    setLoadingData(true)
    setError(null)
    setAnalysis(null)
    try {
      const res = await fetch(`/portfolio/holdings?mock=${useMock}`)
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
      const data = await res.json()
      setHoldings(data.holdings || [])
      const h = data.holdings || []
      const totalInvested = h.reduce((s, x) => s + x.quantity * x.average_price, 0)
      const currentValue  = h.reduce((s, x) => s + x.quantity * x.last_price, 0)
      const totalPnl      = currentValue - totalInvested
      const dayChange     = h.reduce((s, x) => s + x.quantity * x.day_change, 0)
      const gainers = [...h].sort((a, b) => b.pnl - a.pnl)
      const losers  = [...h].sort((a, b) => a.pnl - b.pnl)
      setOverview({
        total_invested:   totalInvested,
        current_value:    currentValue,
        total_pnl:        totalPnl,
        total_pnl_pct:    totalInvested ? (totalPnl / totalInvested * 100) : 0,
        day_change:       dayChange,
        top_gainer:       gainers[0]?.tradingsymbol,
        top_loser:        losers[0]?.tradingsymbol,
        holdings_count:   h.length,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingData(false)
    }
  }

  async function runAIAnalysis() {
    setLoadingAI(true)
    setAiError(null)
    try {
      const res = await fetch('/portfolio/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mock: useMock }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || `${res.status}`)
      }
      const data = await res.json()
      setHoldings(data.holdings || [])
      setOverview(data.overview || overview)
      setAnalysis(data.analysis || null)
    } catch (e) {
      setAiError(e.message)
    } finally {
      setLoadingAI(false)
    }
  }

  async function handleConnectZerodha() {
    try {
      const res = await fetch('/portfolio/auth/login-url')
      const data = await res.json()
      if (data.login_url) window.open(data.login_url, '_blank', 'width=600,height=700')
    } catch {
      setError('Could not fetch Zerodha login URL. Check KITE_API_KEY in .env.')
    }
  }

  async function exchangeToken(requestToken) {
    try {
      const res = await fetch('/portfolio/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_token: requestToken }),
      })
      const data = await res.json()
      if (data.access_token) {
        setAccessToken(data.access_token)
        localStorage.setItem('kite_access_token', data.access_token)
        setIsConnected(true)
        setUseMock(false)
      }
    } catch (e) {
      setError('Token exchange failed: ' + e.message)
    }
  }

  function disconnect() {
    setAccessToken('')
    localStorage.removeItem('kite_access_token')
    setIsConnected(false)
    setUseMock(true)
  }

  const connected = isConnected || !!accessToken

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#0A0A0A]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#FAFAF8]/90 backdrop-blur-md border-b border-[#E8E4DC]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1A6B5A] flex items-center justify-center font-bold text-xs text-white">N</div>
            <span className="font-serif font-semibold text-lg text-[#0A0A0A]">Nuvest</span>
          </button>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/demo')} className="text-sm text-[#6B6560] hover:text-[#0A0A0A] transition-colors">Credit Score</button>
            <button onClick={() => navigate('/dashboard')} className="text-sm text-[#6B6560] hover:text-[#0A0A0A] transition-colors">Dashboard</button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Header + controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <p className="text-sm text-[#A39E98] mb-1">Zerodha Integration</p>
              <h1 className="font-serif text-3xl font-bold text-[#0A0A0A]">Portfolio Analytics</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Mock / Live toggle */}
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white border border-[#E8E4DC]">
                <span className="text-xs text-[#A39E98] px-1">Data:</span>
                <button
                  onClick={() => setUseMock(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${useMock ? 'bg-[#1A6B5A] text-white' : 'text-[#6B6560] hover:text-[#0A0A0A]'}`}
                >
                  Mock
                </button>
                <button
                  onClick={() => { if (connected) setUseMock(false) }}
                  disabled={!connected}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${!useMock ? 'bg-[#1A6B5A] text-white' : connected ? 'text-[#6B6560] hover:text-[#0A0A0A]' : 'text-[#C4BFB8] cursor-not-allowed'}`}
                >
                  Live
                </button>
              </div>

              {/* Connect / Disconnect Zerodha */}
              {connected ? (
                <button
                  onClick={disconnect}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E8E4DC] text-sm font-medium hover:border-red-300 hover:text-red-600 transition-colors shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Zerodha Connected
                </button>
              ) : (
                <button
                  onClick={handleConnectZerodha}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A6B5A] hover:bg-[#155A4A] text-sm font-medium text-white transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                  </svg>
                  Connect Zerodha
                </button>
              )}

              {/* AI Analyze */}
              <button
                onClick={runAIAnalysis}
                disabled={loadingAI || loadingData}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#1f1f1f] disabled:bg-[#D5D0C8] disabled:cursor-not-allowed text-sm font-medium text-white transition-colors shadow-sm"
              >
                {loadingAI ? <Spinner /> : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                )}
                {loadingAI ? 'Analysing…' : 'Run AI Analysis'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {/* Overview cards */}
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
              <div className="col-span-2 md:col-span-2 lg:col-span-2 rounded-xl p-4 border border-[#1A6B5A]/20 shadow-sm"
                style={{ background: 'rgba(26,107,90,0.05)' }}>
                <p className="text-xs text-[#1A6B5A] font-medium mb-1">Current Value</p>
                <p className="text-2xl font-bold text-[#0A0A0A]">{fmt(overview.current_value)}</p>
                <p className="text-xs text-[#A39E98] mt-0.5">Invested: {fmt(overview.total_invested)}</p>
              </div>

              <OverviewCard
                label="Total P&L"
                value={fmt(overview.total_pnl)}
                sub={`${overview.total_pnl >= 0 ? '+' : ''}${fmtN(overview.total_pnl_pct)}%`}
                color={overview.total_pnl >= 0 ? 'text-emerald-700' : 'text-red-600'}
              />
              <OverviewCard
                label="Today's Change"
                value={fmt(overview.day_change)}
                sub={overview.day_change >= 0 ? '+Today' : '-Today'}
                color={overview.day_change >= 0 ? 'text-emerald-700' : 'text-red-600'}
              />
              <OverviewCard label="Top Gainer" value={overview.top_gainer || '—'} color="text-emerald-700" />
              <OverviewCard label="Top Loser"  value={overview.top_loser  || '—'} color="text-red-600" />
              <OverviewCard label="Holdings"   value={overview.holdings_count} sub="stocks" color="text-[#1A6B5A]" />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Holdings table */}
            <div className="lg:col-span-2 bg-white border border-[#E8E4DC] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-[#E8E4DC] flex items-center justify-between">
                <h2 className="font-semibold text-lg text-[#0A0A0A]">Holdings</h2>
                {loadingData && <Spinner />}
              </div>

              {holdings.length === 0 && !loadingData ? (
                <div className="p-12 text-center text-[#A39E98] text-sm">
                  No holdings data. Connect Zerodha or use mock data.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E8E4DC] text-[#A39E98] text-xs">
                        <th className="px-4 py-3 text-left font-medium">Symbol</th>
                        <th className="px-4 py-3 text-right font-medium">Qty</th>
                        <th className="px-4 py-3 text-right font-medium">Avg Price</th>
                        <th className="px-4 py-3 text-right font-medium">LTP</th>
                        <th className="px-4 py-3 text-right font-medium">P&L</th>
                        <th className="px-4 py-3 text-right font-medium">Day %</th>
                        <th className="px-4 py-3 text-center font-medium">AI Rec</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((h, i) => {
                        const pnlPos  = h.pnl >= 0
                        const dayPos  = h.day_change >= 0
                        const invested = h.quantity * h.average_price
                        const pnlPct   = invested ? (h.pnl / invested * 100) : 0
                        return (
                          <tr
                            key={h.tradingsymbol}
                            className="border-b border-[#F0ECE4] hover:bg-[#FAFAF8] transition-colors"
                            style={{ animationDelay: `${i * 40}ms` }}
                          >
                            <td className="px-4 py-3">
                              <div className="font-semibold text-[#0A0A0A]">{h.tradingsymbol}</div>
                              <div className="text-xs text-[#C4BFB8]">{h.exchange}</div>
                            </td>
                            <td className="px-4 py-3 text-right text-[#6B6560]">{h.quantity}</td>
                            <td className="px-4 py-3 text-right text-[#6B6560]">₹{h.average_price.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-right text-[#6B6560]">₹{h.last_price.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 text-right">
                              <div className={pnlPos ? 'text-emerald-700 font-medium' : 'text-red-600 font-medium'}>
                                {pnlPos ? '+' : ''}{fmt(h.pnl)}
                              </div>
                              <div className={`text-xs ${pnlPos ? 'text-emerald-600' : 'text-red-500'}`}>
                                {pnlPos ? '+' : ''}{fmtN(pnlPct)}%
                              </div>
                            </td>
                            <td className={`px-4 py-3 text-right text-xs font-medium ${dayPos ? 'text-emerald-700' : 'text-red-600'}`}>
                              {dayPos ? '+' : ''}{fmtN(h.day_change_percentage)}%
                            </td>
                            <td className="px-4 py-3 text-center">
                              {h.recommendation ? (
                                <div className="flex flex-col items-center gap-1">
                                  <RecBadge rec={h.recommendation} />
                                  {h.rec_reason && (
                                    <span className="text-xs text-[#A39E98] max-w-[160px] text-center leading-tight">{h.rec_reason}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[#C4BFB8] text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* AI insights panel */}
            <div className="flex flex-col gap-4">
              {/* Portfolio health */}
              <div className="bg-white border border-[#E8E4DC] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#1A6B5A]/10 flex items-center justify-center text-[#1A6B5A] text-sm">✦</div>
                  <h3 className="font-semibold text-[#0A0A0A]">Portfolio Health</h3>
                </div>
                {analysis ? (
                  <p className="text-sm text-[#6B6560] leading-relaxed">{analysis.portfolio_health}</p>
                ) : (
                  <p className="text-sm text-[#A39E98] leading-relaxed">
                    Run AI Analysis to get an overall health summary of your portfolio based on diversification, risk exposure, and current performance.
                  </p>
                )}
              </div>

              {/* Suggestions */}
              <div className="bg-white border border-[#E8E4DC] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-sm">💡</div>
                  <h3 className="font-semibold text-[#0A0A0A]">Actionable Suggestions</h3>
                </div>
                {analysis?.suggestions?.length ? (
                  <ol className="space-y-3">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm text-[#6B6560]">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1A6B5A]/10 border border-[#1A6B5A]/20 flex items-center justify-center text-[#1A6B5A] text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-[#A39E98] leading-relaxed">
                    AI-powered suggestions will appear here after analysis — covering rebalancing, profit booking, and hedging opportunities.
                  </p>
                )}
              </div>

              {aiError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <strong>AI Error:</strong> {aiError}
                  {aiError.includes('ANTHROPIC_API_KEY') && (
                    <p className="mt-1 text-xs text-red-500">
                      Set your API key in <code className="bg-red-100 px-1 rounded">backend/.env</code>
                    </p>
                  )}
                </div>
              )}

              {/* Zerodha connect card */}
              <div className="bg-white border border-[#E8E4DC] rounded-2xl p-6 border-dashed shadow-sm">
                <h3 className="font-semibold mb-2 text-sm text-[#0A0A0A]">Live Broker Data</h3>
                <p className="text-xs text-[#A39E98] mb-4 leading-relaxed">
                  Connect your Zerodha account to switch from mock to real portfolio data. Your API key and secret must be set in{' '}
                  <code className="bg-[#F5F0E8] px-1 rounded text-[#6B6560]">backend/.env</code>.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#A39E98]">
                  {[
                    { label: 'API Key',       active: !!KITE_API_KEY      },
                    { label: 'Access Token',  active: connected            },
                    { label: 'Anthropic Key', active: !!ANTHROPIC_API_KEY  },
                    { label: useMock ? 'Mock data' : 'Live data', active: !useMock },
                  ].map(({ label, active }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-[#D5D0C8]'}`} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const KITE_API_KEY      = import.meta.env.VITE_KITE_API_KEY || ''
const ANTHROPIC_API_KEY = import.meta.env.VITE_HAS_ANTHROPIC_KEY === 'true'

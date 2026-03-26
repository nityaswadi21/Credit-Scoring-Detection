import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScoreCard from '../components/ScoreCard'
import ShapChart from '../components/ShapChart'

const EMPLOYMENT_OPTS = [
  { value: 0, label: 'Unemployed' },
  { value: 1, label: 'Self-employed / Freelance' },
  { value: 2, label: 'Salaried' },
]
const RECHARGE_OPTS = [
  { value: 0, label: 'Rarely (prepaid, infrequent)' },
  { value: 1, label: 'Monthly' },
  { value: 2, label: 'Frequently (weekly+)' },
]

const defaultForm = {
  upi_transactions_per_month: 45,
  bill_payment_on_time_pct: 0.88,
  rent_payments_regular: 1,
  monthly_income_estimate: 35000,
  mobile_recharge_frequency: 1,
  employment_type: 2,
}

function InputField({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-gray-600 mb-2">{hint}</p>}
      {children}
    </div>
  )
}

const inputClass =
  'w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors'

export default function Demo() {
  const navigate = useNavigate()
  const [form, setForm] = useState(defaultForm)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          upi_transactions_per_month: Number(form.upi_transactions_per_month),
          monthly_income_estimate: Number(form.monthly_income_estimate),
          bill_payment_on_time_pct: Number(form.bill_payment_on_time_pct),
        }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">C</div>
            <span className="font-semibold text-lg">CreditAI</span>
          </button>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-white transition-colors">
            Dashboard →
          </button>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3">Get your credit score</h1>
            <p className="text-gray-400">Fill in your alternative data profile — no bank account needed.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Form */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <form onSubmit={submit} className="space-y-6">
                <InputField label="UPI Transactions per Month" hint="How many digital payments do you make via UPI?">
                  <input
                    type="number" min={0} max={200}
                    value={form.upi_transactions_per_month}
                    onChange={(e) => set('upi_transactions_per_month', e.target.value)}
                    className={inputClass}
                  />
                </InputField>

                <InputField label="Bill Payment On-Time (%)" hint="What fraction of utility bills do you pay on time? (0.0 – 1.0)">
                  <div className="space-y-2">
                    <input
                      type="range" min={0} max={1} step={0.01}
                      value={form.bill_payment_on_time_pct}
                      onChange={(e) => set('bill_payment_on_time_pct', parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0% — Never</span>
                      <span className="text-blue-400 font-semibold">{Math.round(form.bill_payment_on_time_pct * 100)}%</span>
                      <span>100% — Always</span>
                    </div>
                  </div>
                </InputField>

                <InputField label="Rent Payment Regularity">
                  <div className="grid grid-cols-2 gap-3">
                    {[{ v: 0, l: 'Irregular / No rent' }, { v: 1, l: 'Consistent & regular' }].map(({ v, l }) => (
                      <button
                        type="button" key={v}
                        onClick={() => set('rent_payments_regular', v)}
                        className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                          form.rent_payments_regular === v
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </InputField>

                <InputField label="Monthly Income Estimate (₹)" hint="Approximate monthly take-home income">
                  <input
                    type="number" min={0} step={1000}
                    value={form.monthly_income_estimate}
                    onChange={(e) => set('monthly_income_estimate', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 35000"
                  />
                </InputField>

                <InputField label="Mobile Recharge Frequency">
                  <div className="grid grid-cols-3 gap-2">
                    {RECHARGE_OPTS.map(({ value, label }) => (
                      <button
                        type="button" key={value}
                        onClick={() => set('mobile_recharge_frequency', value)}
                        className={`px-3 py-3 rounded-xl border text-xs font-medium transition-all ${
                          form.mobile_recharge_frequency === value
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </InputField>

                <InputField label="Employment Type">
                  <div className="grid grid-cols-3 gap-2">
                    {EMPLOYMENT_OPTS.map(({ value, label }) => (
                      <button
                        type="button" key={value}
                        onClick={() => set('employment_type', value)}
                        className={`px-3 py-3 rounded-xl border text-xs font-medium transition-all ${
                          form.employment_type === value
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </InputField>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-blue-600/20"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Calculating score…
                    </span>
                  ) : 'Calculate my score →'}
                </button>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </form>
            </div>

            {/* Result panel */}
            <div className="sticky top-24">
              {result ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-8 animate-fade-up">
                  <ScoreCard score={result.score} riskTier={result.risk_tier} />
                  <div className="border-t border-gray-800 pt-8">
                    <ShapChart factors={result.shap_factors} />
                  </div>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors"
                  >
                    View full dashboard →
                  </button>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-96 gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-4xl">📊</div>
                  <h3 className="text-xl font-semibold text-gray-300">Your score will appear here</h3>
                  <p className="text-gray-600 text-sm max-w-xs">
                    Fill in the form on the left and hit "Calculate" to see your AI-generated credit score with SHAP explanations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

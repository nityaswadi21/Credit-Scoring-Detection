import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScoreCard from '../components/ScoreCard'
import ShapChart from '../components/ShapChart'

const EMPLOYMENT_OPTS = [
  { value: 0, label: 'Unemployed' },
  { value: 1, label: 'Freelance' },
  { value: 2, label: 'Salaried' },
]
const RECHARGE_OPTS = [
  { value: 0, label: 'Rarely' },
  { value: 1, label: 'Monthly' },
  { value: 2, label: 'Weekly+' },
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
      <label className="block text-sm font-medium text-[#0A0A0A] mb-1.5">{label}</label>
      {hint && <p className="text-xs text-[#A39E98] mb-2">{hint}</p>}
      {children}
    </div>
  )
}

const inputClass =
  'w-full px-4 py-3 bg-white border border-[#D5D0C8] rounded-xl text-[#0A0A0A] placeholder-[#A39E98] focus:outline-none focus:border-[#1A6B5A] focus:ring-1 focus:ring-[#1A6B5A] transition-colors text-sm'

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
    <div className="min-h-screen bg-[#FAFAF8] text-[#0A0A0A]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#FAFAF8]/90 backdrop-blur-md border-b border-[#E8E4DC]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1A6B5A] flex items-center justify-center font-bold text-xs text-white">N</div>
            <span className="font-serif font-semibold text-lg text-[#0A0A0A]">Nuvest</span>
          </button>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/dashboard')} className="text-sm text-[#6B6560] hover:text-[#0A0A0A] transition-colors">
              Dashboard
            </button>
            <button onClick={() => navigate('/portfolio')} className="text-sm text-[#6B6560] hover:text-[#0A0A0A] transition-colors">
              Portfolio
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-sm text-[#1A6B5A] font-medium tracking-wide uppercase mb-3">AI Credit Scoring</p>
            <h1 className="font-serif text-4xl font-bold text-[#0A0A0A] mb-3">Check your credit score</h1>
            <p className="text-[#6B6560] max-w-md mx-auto">
              Fill in your alternative data profile — no bank account or credit history needed.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Form */}
            <div className="bg-white border border-[#E8E4DC] rounded-2xl p-8 shadow-sm">
              <form onSubmit={submit} className="space-y-6">

                <InputField label="UPI Transactions per Month" hint="How many digital payments do you make via UPI?">
                  <input
                    type="number" min={0} max={200}
                    value={form.upi_transactions_per_month}
                    onChange={(e) => set('upi_transactions_per_month', e.target.value)}
                    className={inputClass}
                  />
                </InputField>

                <InputField label="Bill Payment On-Time" hint="What fraction of utility bills do you pay on time?">
                  <div className="space-y-2">
                    <input
                      type="range" min={0} max={1} step={0.01}
                      value={form.bill_payment_on_time_pct}
                      onChange={(e) => set('bill_payment_on_time_pct', parseFloat(e.target.value))}
                      className="w-full accent-[#1A6B5A]"
                    />
                    <div className="flex justify-between text-xs text-[#A39E98]">
                      <span>0% — Never</span>
                      <span className="text-[#1A6B5A] font-semibold">{Math.round(form.bill_payment_on_time_pct * 100)}%</span>
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
                            ? 'bg-[#1A6B5A]/10 border-[#1A6B5A] text-[#1A6B5A]'
                            : 'bg-white border-[#D5D0C8] text-[#6B6560] hover:border-[#A39E98]'
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
                            ? 'bg-[#1A6B5A]/10 border-[#1A6B5A] text-[#1A6B5A]'
                            : 'bg-white border-[#D5D0C8] text-[#6B6560] hover:border-[#A39E98]'
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
                            ? 'bg-[#1A6B5A]/10 border-[#1A6B5A] text-[#1A6B5A]'
                            : 'bg-white border-[#D5D0C8] text-[#6B6560] hover:border-[#A39E98]'
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
                  className="w-full py-4 bg-[#1A6B5A] hover:bg-[#155A4A] disabled:bg-[#D5D0C8] disabled:cursor-not-allowed rounded-xl font-semibold text-white text-sm transition-all shadow-sm hover:shadow-md"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Calculating score…
                    </span>
                  ) : 'Calculate my score →'}
                </button>

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </form>
            </div>

            {/* Result panel */}
            <div className="sticky top-24">
              {result ? (
                <div className="bg-white border border-[#E8E4DC] rounded-2xl p-8 space-y-8 shadow-sm animate-fade-up">
                  <ScoreCard score={result.score} riskTier={result.risk_tier} />
                  <div className="border-t border-[#E8E4DC] pt-8">
                    <ShapChart factors={result.shap_factors} />
                  </div>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-3 bg-[#F5F0E8] hover:bg-[#EDE8DF] rounded-xl text-sm font-medium text-[#0A0A0A] transition-colors border border-[#E8E4DC]"
                  >
                    View full dashboard →
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-[#E8E4DC] rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-96 gap-4 shadow-sm">
                  <div className="w-20 h-20 rounded-full bg-[#F5F0E8] flex items-center justify-center text-4xl">📊</div>
                  <h3 className="text-xl font-semibold text-[#0A0A0A]">Your score will appear here</h3>
                  <p className="text-[#A39E98] text-sm max-w-xs leading-relaxed">
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

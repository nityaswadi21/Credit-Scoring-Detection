import { useEffect, useState } from 'react'

const FEATURE_LABELS = {
  // 11 trajectory-model features
  avg_txn_freq:       'Transaction Frequency',
  txn_freq_trend:     'Transaction Trend',
  consistency_score:  'Payment Consistency',
  recency_score:      'Account Activity',
  category_diversity: 'Spending Diversity',
  avg_amount:         'Avg Transaction Amount',
  amount_volatility:  'Amount Volatility',
  fail_ratio:         'Failed Payment Rate',
  utility_streak:     'Utility Payment Streak',
  total_volume:       'Total UPI Volume',
  recharge_count:     'Mobile Recharges',
  // legacy 6-feature labels (fallback)
  upi_transactions_per_month: 'UPI Transactions / Month',
  bill_payment_on_time_pct:   'Bill Payment On-Time %',
  rent_payments_regular:      'Rent Payment Regularity',
  monthly_income_estimate:    'Monthly Income',
  mobile_recharge_frequency:  'Mobile Recharge Frequency',
  employment_type:             'Employment Type',
}

export default function ShapChart({ factors }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300)
    return () => clearTimeout(t)
  }, [])

  const maxAbs = Math.max(...factors.map((f) => Math.abs(f.impact)), 1)

  return (
    <div style={{ width: '100%' }}>
      {/* Section title */}
      <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>
        Why this score?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {factors.map((f, i) => {
          const pct = (Math.abs(f.impact) / maxAbs) * 100
          const isPos = f.direction === 'positive'
          const label = FEATURE_LABELS[f.feature] || f.feature

          return (
            <div key={f.feature}>
              {/* Label row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#374151', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                  {label}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isPos ? '#1A6B5A' : '#DC2626',
                  fontFamily: 'Inter, sans-serif',
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: 44,
                  textAlign: 'right',
                }}>
                  {isPos ? '+' : ''}{f.impact.toFixed(1)}
                </span>
              </div>

              {/* Bar */}
              <div style={{ height: 7, borderRadius: 100, background: '#F3F4F6', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: 100,
                    background: isPos ? '#1A6B5A' : '#EF4444',
                    width: animated ? `${pct}%` : '0%',
                    transition: `width 0.6s cubic-bezier(0.34,1.1,0.64,1) ${i * 60}ms`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 16, paddingTop: 14, borderTop: '1px solid #F3F4F6', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
        SHAP values show each factor's contribution to your score relative to the average prediction.
      </p>
    </div>
  )
}

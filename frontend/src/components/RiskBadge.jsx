const config = {
  Low:    { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Low Risk' },
  Medium: { bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   text: 'text-amber-400',   dot: 'bg-amber-400',   label: 'Medium Risk' },
  High:   { bg: 'bg-red-500/15',     border: 'border-red-500/40',     text: 'text-red-400',     dot: 'bg-red-400',     label: 'High Risk' },
}

export default function RiskBadge({ tier, size = 'md' }) {
  const c = config[tier] || config.Medium
  const padding = size === 'lg' ? 'px-5 py-2 text-base' : 'px-3 py-1.5 text-sm'

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border font-semibold ${c.bg} ${c.border} ${c.text} ${padding}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
      {c.label}
    </span>
  )
}

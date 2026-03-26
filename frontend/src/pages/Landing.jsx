import { useNavigate } from 'react-router-dom'

const stats = [
  { value: '190M+', label: 'Thin-file Indians' },
  { value: '₹0', label: 'Formal credit history' },
  { value: '0.3s', label: 'Score generation time' },
]

const problems = [
  {
    icon: '🏦',
    title: 'Banks reject thin-file users',
    body: 'Over 190 million Indians lack a formal credit history, making them invisible to traditional lenders.',
  },
  {
    icon: '📊',
    title: 'Alternative data is untapped',
    body: 'UPI transactions, utility bills, and rent patterns reveal creditworthiness — but banks ignore them.',
  },
  {
    icon: '🔍',
    title: 'No transparency in scoring',
    body: 'Even when scores exist, users have no idea why. Our SHAP-powered explanations change that.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">C</div>
            <span className="font-semibold text-lg">CreditAI</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How it works</a>
            <button
              onClick={() => navigate('/demo')}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
            >
              Try Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative">
        {/* Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-600/30 text-blue-400 text-sm mb-8">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            AI-Powered Financial Inclusion
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
            Credit scores for
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              the invisible majority
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            190 million Indians lack formal credit history. CreditAI uses UPI transactions,
            bill payments, and rent data to build an explainable credit score — in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/demo')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5"
            >
              Get your credit score →
            </button>
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold text-lg transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="relative max-w-2xl mx-auto mt-20 grid grid-cols-3 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
              <div className="text-3xl font-bold text-blue-400">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem cards */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">The problem with traditional credit</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              The system was never built for most Indians. We're changing that.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((p) => (
              <div key={p.title} className="p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{p.title}</h3>
                <p className="text-gray-400 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How CreditAI works */}
      <section className="py-20 px-6 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">How CreditAI works</h2>
            <p className="text-gray-400 text-lg">From alternative data to an explainable score in 3 steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Enter your profile', body: 'Tell us about your UPI usage, bill payments, income, and employment — no bank statements needed.' },
              { step: '02', title: 'AI scores your data', body: 'Our XGBoost model trained on 1000+ alternative-data profiles computes a 0–850 credit score instantly.' },
              { step: '03', title: 'Understand why', body: 'SHAP values break down exactly which factors boosted or lowered your score, in plain language.' },
            ].map((item) => (
              <div key={item.step} className="relative pl-16">
                <div className="absolute left-0 top-0 w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-600/40 flex items-center justify-center text-blue-400 font-mono text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to see your score?</h2>
          <p className="text-gray-400 text-lg mb-10">Takes 30 seconds. No bank account required.</p>
          <button
            onClick={() => navigate('/demo')}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5"
          >
            Try the demo →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-600 text-sm">
        CreditAI — Built for the AI for Financial Inclusion Hackathon
      </footer>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { BookOpen, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-parchment-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink-950 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fdfaf5 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-parchment-400 rounded-lg flex items-center justify-center">
            <BookOpen size={18} className="text-ink-950" />
          </div>
          <span className="font-display text-xl text-parchment-100 font-semibold">Notara</span>
        </div>
        <div className="relative z-10">
          <blockquote className="font-display text-3xl text-parchment-100 leading-snug italic mb-6">
            "The faintest ink is more<br />powerful than the strongest<br />memory."
          </blockquote>
          <p className="text-ink-400 text-sm">— Chinese Proverb</p>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          {['bg-sage-500', 'bg-parchment-400', 'bg-ink-400'].map((c, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${c}`} />
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 bg-ink-900 rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-parchment-50" />
              </div>
              <span className="font-display text-lg font-semibold text-ink-900">Notara</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-ink-950 mb-2">Welcome back</h1>
            <p className="text-ink-500 text-sm">Sign in to your notes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" className="input-field" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center mt-2" disabled={loading}>
              {loading
                ? <div className="w-4 h-4 rounded-full border-2 border-parchment-50 border-t-transparent animate-spin" />
                : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            No account?{' '}
            <Link to="/register" className="text-ink-900 font-medium hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
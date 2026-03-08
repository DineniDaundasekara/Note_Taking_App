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

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      await login(form.email.trim(), form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-parchment-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-ink-950 flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px,#fdfaf5 1px,transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-parchment-400 rounded-xl flex items-center justify-center">
            <BookOpen size={18} className="text-ink-950" />
          </div>
          <span className="font-display text-xl text-parchment-100 font-semibold">Notara</span>
        </div>
        <div className="relative z-10 space-y-6">
          <blockquote className="font-display text-3xl text-parchment-100 leading-snug italic">
            "The faintest ink is more<br />powerful than the strongest<br />memory."
          </blockquote>
          <p className="text-ink-500 text-sm">— Chinese Proverb</p>
        </div>
        <div className="relative z-10 flex gap-2">
          {['bg-sage-500', 'bg-parchment-400', 'bg-ink-600'].map((c, i) => <div key={i} className={`w-2 h-2 rounded-full ${c}`} />)}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-ink-900 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-parchment-50" />
            </div>
            <span className="font-display text-lg font-semibold">Notara</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-950 mb-1">Welcome back</h1>
          <p className="text-ink-500 text-sm mb-8">Sign in to continue to your notes</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">Email address</label>
              <input type="email" className="input-field" placeholder="you@example.com"
                value={form.email} onChange={set('email')} required autoFocus />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••"
                  value={form.password} onChange={set('password')} required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3 mt-2" disabled={loading}>
              {loading
                ? <div className="w-4 h-4 rounded-full border-2 border-parchment-50 border-t-transparent animate-spin" />
                : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            No account?{' '}
            <Link to="/register" className="text-ink-900 font-semibold hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
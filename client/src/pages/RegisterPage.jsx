import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { BookOpen, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created! Welcome to Notara.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const features = ['Rich text editor with formatting', 'Real-time collaboration', 'Full-text search', 'Tag organization']

  return (
    <div className="min-h-screen bg-parchment-50 flex">
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
          <h2 className="font-display text-3xl text-parchment-100 font-bold mb-8">Everything you need<br />to capture your ideas</h2>
          <ul className="space-y-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-sage-600 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-white" />
                </div>
                <span className="text-ink-300 text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          {['bg-sage-500', 'bg-parchment-400', 'bg-ink-400'].map((c, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${c}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 bg-ink-900 rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-parchment-50" />
              </div>
              <span className="font-display text-lg font-semibold text-ink-900">Notara</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-ink-950 mb-2">Create account</h1>
            <p className="text-ink-500 text-sm">Start your note-taking journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5 uppercase tracking-wider">Full name</label>
              <input type="text" className="input-field" placeholder="Your name"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" className="input-field" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field pr-10" placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-1.5 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${form.password.length > i * 2 + 2
                        ? form.password.length >= 10 ? 'bg-sage-500' : form.password.length >= 6 ? 'bg-parchment-400' : 'bg-red-400'
                        : 'bg-ink-200'
                      }`} />
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="btn-primary w-full justify-center mt-2" disabled={loading}>
              {loading
                ? <div className="w-4 h-4 rounded-full border-2 border-parchment-50 border-t-transparent animate-spin" />
                : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="text-ink-900 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
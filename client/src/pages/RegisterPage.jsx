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

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const pwStrength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
      : form.password.length < 10 ? 2
        : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 4 : 3

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColor = ['', 'bg-red-400', 'bg-parchment-400', 'bg-sage-400', 'bg-sage-600']

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    if (!form.email.trim()) return toast.error('Email is required')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form.name.trim(), form.email.trim(), form.password)
      toast.success('Account created! Welcome to Notara.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const features = ['Rich text editor', 'Collaborator management', 'Full-text search', 'Priority & due dates', 'Checklists & tags']

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
        <div className="relative z-10">
          <h2 className="font-display text-3xl text-parchment-100 font-bold mb-8 leading-snug">
            Everything you need<br />to capture your ideas
          </h2>
          <ul className="space-y-3">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-sage-700 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-white" />
                </div>
                <span className="text-ink-300 text-sm">{f}</span>
              </li>
            ))}
          </ul>
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
          <h1 className="font-display text-3xl font-bold text-ink-950 mb-1">Create account</h1>
          <p className="text-ink-500 text-sm mb-8">Join Notara — it's free</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">Full name</label>
              <input type="text" className="input-field" placeholder="Your name"
                value={form.name} onChange={set('name')} required autoFocus />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">Email address</label>
              <input type="email" className="input-field" placeholder="you@example.com"
                value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field pr-10" placeholder="Minimum 6 characters"
                  value={form.password} onChange={set('password')} required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= pwStrength ? strengthColor[pwStrength] : 'bg-ink-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-ink-500">{strengthLabel[pwStrength]} password</p>
                </div>
              )}
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3 mt-2" disabled={loading}>
              {loading
                ? <div className="w-4 h-4 rounded-full border-2 border-parchment-50 border-t-transparent animate-spin" />
                : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="text-ink-900 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
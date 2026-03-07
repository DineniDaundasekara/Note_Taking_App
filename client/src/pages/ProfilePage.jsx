import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotes } from '../context/NotesContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { ArrowLeft, User, Lock, Settings, Save, Eye, EyeOff } from 'lucide-react'

export default function ProfilePage() {
    const { user, updateUser } = useAuth()
    const { notes } = useNotes()
    const navigate = useNavigate()

    const [tab, setTab] = useState('profile')
    const [profile, setProfile] = useState({ name: user?.name || '', bio: user?.bio || '' })
    const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
    const [prefs, setPrefs] = useState({
        viewMode: user?.preferences?.viewMode || 'grid',
        sortBy: user?.preferences?.sortBy || '-updatedAt',
        defaultNoteColor: user?.preferences?.defaultNoteColor || '#ffffff'
    })
    const [showPw, setShowPw] = useState(false)
    const [loadingProf, setLoadingProf] = useState(false)
    const [loadingPw, setLoadingPw] = useState(false)
    const [loadingPref, setLoadingPref] = useState(false)

    const COLORS = ['#ffffff', '#fef9c3', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff', '#ffedd5']

    const handleProfileSave = async (e) => {
        e.preventDefault()
        setLoadingProf(true)
        try {
            const { data } = await api.put('/profile', profile)
            updateUser(data.user)
            toast.success('Profile updated!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed')
        } finally { setLoadingProf(false) }
    }

    const handlePasswordSave = async (e) => {
        e.preventDefault()
        if (pw.newPassword !== pw.confirm) return toast.error('Passwords do not match')
        setLoadingPw(true)
        try {
            await api.put('/profile/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword })
            toast.success('Password changed!')
            setPw({ currentPassword: '', newPassword: '', confirm: '' })
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed')
        } finally { setLoadingPw(false) }
    }

    const handlePrefsSave = async (e) => {
        e.preventDefault()
        setLoadingPref(true)
        try {
            const { data } = await api.put('/profile', { preferences: prefs })
            updateUser(data.user)
            toast.success('Preferences saved!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed')
        } finally { setLoadingPref(false) }
    }

    const totalNotes = notes.length
    const ownedNotes = notes.filter(n => n.owner._id === user._id).length
    const sharedNotes = notes.filter(n => n.owner._id !== user._id).length
    const favoriteNotes = notes.filter(n => n.isFavorite).length

    const TabBtn = ({ id, icon: Icon, label }) => (
        <button onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === id ? 'bg-ink-900 text-parchment-50' : 'text-ink-600 hover:bg-ink-100'}`}>
            <Icon size={15} />{label}
        </button>
    )

    return (
        <div className="min-h-screen bg-parchment-50">
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
                    <h1 className="font-display text-2xl font-bold text-ink-950">Account Settings</h1>
                </div>

                {/* Profile card */}
                <div className="card p-6 mb-6 flex items-center gap-5">
                    <img src={user?.avatar} alt={user?.name} className="w-16 h-16 rounded-2xl bg-ink-100" />
                    <div>
                        <h2 className="font-display text-xl font-semibold text-ink-950">{user?.name}</h2>
                        <p className="text-ink-500 text-sm">{user?.email}</p>
                        {user?.bio && <p className="text-ink-600 text-sm mt-1 italic">{user.bio}</p>}
                    </div>
                    <div className="ml-auto grid grid-cols-2 gap-3 text-center hidden sm:grid">
                        {[
                            { label: 'Owned', value: ownedNotes },
                            { label: 'Shared', value: sharedNotes },
                            { label: 'Favorites', value: favoriteNotes },
                            { label: 'Total', value: totalNotes },
                        ].map(s => (
                            <div key={s.label} className="bg-parchment-50 rounded-xl px-3 py-2">
                                <p className="font-bold text-ink-900 font-mono">{s.value}</p>
                                <p className="text-xs text-ink-500">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    <TabBtn id="profile" icon={User} label="Profile" />
                    <TabBtn id="password" icon={Lock} label="Password" />
                    <TabBtn id="prefs" icon={Settings} label="Preferences" />
                </div>

                {tab === 'profile' && (
                    <div className="card p-6 animate-fade-in">
                        <h3 className="font-display font-semibold text-ink-900 mb-5">Edit Profile</h3>
                        <form onSubmit={handleProfileSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">Display name</label>
                                <input type="text" className="input-field" value={profile.name}
                                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">Bio</label>
                                <textarea className="input-field resize-none" rows={3} maxLength={200}
                                    placeholder="A short bio…" value={profile.bio}
                                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
                                <p className="text-xs text-ink-400 mt-1 text-right">{profile.bio.length}/200</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">Email</label>
                                <input type="email" className="input-field bg-ink-50 cursor-not-allowed" value={user?.email} disabled />
                                <p className="text-xs text-ink-400 mt-1">Email cannot be changed</p>
                            </div>
                            <button type="submit" className="btn-primary" disabled={loadingProf}>
                                {loadingProf ? <div className="w-4 h-4 border-2 border-parchment-50 border-t-transparent rounded-full animate-spin" /> : <><Save size={15} /> Save changes</>}
                            </button>
                        </form>
                    </div>
                )}

                {tab === 'password' && (
                    <div className="card p-6 animate-fade-in">
                        <h3 className="font-display font-semibold text-ink-900 mb-5">Change Password</h3>
                        <form onSubmit={handlePasswordSave} className="space-y-4">
                            {[
                                { key: 'currentPassword', label: 'Current password' },
                                { key: 'newPassword', label: 'New password' },
                                { key: 'confirm', label: 'Confirm new password' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-semibold text-ink-600 mb-1.5 uppercase tracking-wider">{f.label}</label>
                                    <div className="relative">
                                        <input type={showPw ? 'text' : 'password'} className="input-field pr-10"
                                            value={pw[f.key]} onChange={e => setPw(p => ({ ...p, [f.key]: e.target.value }))} required />
                                        {f.key === 'confirm' && (
                                            <button type="button" onClick={() => setShowPw(p => !p)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                                                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {pw.newPassword && pw.confirm && pw.newPassword !== pw.confirm && (
                                <p className="text-xs text-red-500">Passwords do not match</p>
                            )}
                            <button type="submit" className="btn-primary" disabled={loadingPw}>
                                {loadingPw ? <div className="w-4 h-4 border-2 border-parchment-50 border-t-transparent rounded-full animate-spin" /> : <><Lock size={15} /> Change password</>}
                            </button>
                        </form>
                    </div>
                )}

                {tab === 'prefs' && (
                    <div className="card p-6 animate-fade-in">
                        <h3 className="font-display font-semibold text-ink-900 mb-5">Preferences</h3>
                        <form onSubmit={handlePrefsSave} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-ink-600 mb-2 uppercase tracking-wider">Default view</label>
                                <div className="flex gap-2">
                                    {['grid', 'list'].map(v => (
                                        <button key={v} type="button" onClick={() => setPrefs(p => ({ ...p, viewMode: v }))}
                                            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium capitalize transition-all ${prefs.viewMode === v ? 'border-ink-900 bg-ink-50' : 'border-ink-100 hover:border-ink-300'}`}>
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-ink-600 mb-2 uppercase tracking-wider">Default sort</label>
                                <select className="input-field" value={prefs.sortBy} onChange={e => setPrefs(p => ({ ...p, sortBy: e.target.value }))}>
                                    <option value="-updatedAt">Last modified</option>
                                    <option value="-createdAt">Newest first</option>
                                    <option value="createdAt">Oldest first</option>
                                    <option value="title">Title A–Z</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-ink-600 mb-2 uppercase tracking-wider">Default note color</label>
                                <div className="flex gap-2">
                                    {COLORS.map(c => (
                                        <button key={c} type="button" onClick={() => setPrefs(p => ({ ...p, defaultNoteColor: c }))}
                                            className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${prefs.defaultNoteColor === c ? 'border-ink-900 scale-110' : 'border-ink-200'}`}
                                            style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" disabled={loadingPref}>
                                {loadingPref ? <div className="w-4 h-4 border-2 border-parchment-50 border-t-transparent rounded-full animate-spin" /> : <><Save size={15} /> Save preferences</>}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
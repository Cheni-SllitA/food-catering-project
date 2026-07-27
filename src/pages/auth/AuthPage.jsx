import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { Input, Button } from '../../components/common/FormControls'
import { ROLE_HOME } from '../../lib/constants'

export default function AuthPage({ mode = 'login' }) {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(mode)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { profile } = await signIn({ email: form.email, password: form.password })
      toast.success('Welcome back!')
      const redirectTo = location.state?.from?.pathname || ROLE_HOME[profile?.role] || '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Could not sign in')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await signUp(form)
      toast.success('Account created! You can now log in.')
      setTab('login')
    } catch (err) {
      toast.error(err.message || 'Could not create account')
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!form.email) {
      toast.error('Enter your email above first')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(form.email)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Password reset email sent')
  }

  return (
    <div>
      {/* Pill tab toggle */}
      <div className="mb-6 flex rounded-full border border-primary-200 bg-primary-50 p-1">
        {[
          { value: 'login', label: 'Login' },
          { value: 'register', label: 'Register' },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
              tab === t.value ? 'bg-primary-600 text-white' : 'text-stone-600 hover:text-primary-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'login' ? (
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
          <Input label="Password" type="password" required value={form.password} onChange={set('password')} />
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Signing in...' : 'Login'}
          </Button>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-center text-sm text-stone-500 underline hover:text-primary-700"
          >
            Forgot password?
          </button>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleRegister}>
          <Input label="Full name" required value={form.fullName} onChange={set('fullName')} />
          <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
          <Input label="Phone (optional)" type="tel" value={form.phone} onChange={set('phone')} />
          <Input label="Password" type="password" required minLength={6} value={form.password} onChange={set('password')} />
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Creating account...' : 'Register'}
          </Button>
        </form>
      )}
    </div>
  )
}

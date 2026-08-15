import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabaseClient'
import { supabaseAux } from '../../lib/supabaseAuxClient'
import Modal from './Modal'
import { Input, Button } from './FormControls'

export default function CreateStaffModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', address: '', password: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.email.trim() || form.password.length < 6) {
      toast.error('Enter a name, email, and a password of at least 6 characters')
      return
    }
    setSaving(true)
    try {
      // Signs up on an isolated client so this browser's own (admin/manager)
      // session is never replaced by the new staff account's session.
      const { data, error: signUpError } = await supabaseAux.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName, phone: form.phone || null },
        },
      })
      if (signUpError) throw signUpError

      const newUserId = data.user?.id
      if (!newUserId) throw new Error('Account created but no user id was returned — please retry')

      // The on_auth_user_created trigger already created a profiles row from
      // the signup metadata (full_name, phone) with role 'customer'. Set
      // role/full_name/phone/address explicitly here too rather than relying
      // solely on the trigger — this is the one place that writes `address`
      // (the trigger doesn't collect it), and being explicit makes this
      // reliable regardless of what the trigger did or didn't capture.
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'staff',
          full_name: form.fullName,
          phone: form.phone || null,
          address: form.address || null,
        })
        .eq('id', newUserId)
      if (profileError) throw profileError

      toast.success('Staff account created')
      onCreated?.()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Could not create staff account')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Create staff account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-stone-500">
          This creates a brand-new login for the staff member. If email confirmation
          is enabled on this Supabase project, they'll need to confirm their email
          before they can log in.
        </p>
        <Input label="Full name" required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <Input label="Phone (optional)" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        <Input label="Address (optional)" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        <Input
          label="Temporary password"
          type="password"
          required
          minLength={6}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create staff account'}</Button>
        </div>
      </form>
    </Modal>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [isRecovery, setIsRecovery] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Detect recovery mode from URL hash or auth event
    if (typeof window !== 'undefined') {
      if (window.location.hash.includes('type=recovery')) setIsRecovery(true)
      const onHash = () => {
        if (window.location.hash.includes('type=recovery')) setIsRecovery(true)
      }
      window.addEventListener('hashchange', onHash)
      return () => window.removeEventListener('hashchange', onHash)
    }
    const { data: sub } = supabase().auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset#type=recovery`
    })
    setLoading(false)
    if (error) return alert(error.message)
    setSent(true)
  }

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase().auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) return alert(error.message)
    alert('Passord oppdatert. Logg inn på nytt.')
    router.replace('/login')
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Tilbakestill passord</h1>
      {isRecovery ? (
        <form onSubmit={updatePassword} className="space-y-3">
          <input
            className="w-full border rounded p-3"
            type="password"
            placeholder="Nytt passord"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-60">
            {loading ? 'Lagrer…' : 'Oppdater passord'}
          </button>
        </form>
      ) : sent ? (
        <p>Sjekk e‑posten din for lenke til å sette nytt passord.</p>
      ) : (
        <form onSubmit={requestReset} className="space-y-3">
          <input
            className="w-full border rounded p-3"
            type="email"
            placeholder="Din e‑post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button disabled={loading} className="bg-black text-white rounded px-4 py-2 disabled:opacity-60">
            {loading ? 'Sender…' : 'Send lenke for å tilbakestille'}
          </button>
        </form>
      )}
    </main>
  )
}



'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Auto-redirect hvis allerede innlogget
  useEffect(() => {
    supabase().auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/')
    })
  }, [router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase().auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      alert(error.message)
      return
    }
    if (data.session) router.replace('/')
  }

  return (
    <main className="max-w-md mx-auto p-6 text-gray-900">
      <h1 className="text-3xl font-bold mb-4">Logg inn</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="din@email.no"
          className="w-full border rounded p-3 text-base"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Passord"
          className="w-full border rounded p-3 text-base"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button disabled={loading} className="bg-black text-white rounded px-4 py-2 text-base hover:bg-gray-800 disabled:opacity-60">
          {loading ? 'Logger inn…' : 'Logg inn'}
        </button>
      </form>
      <div className="text-sm text-gray-600 mt-3 flex justify-between">
        <span>Har du ikke konto? Registrer deg fra menylinjen.</span>
        <a href="/reset" className="underline">Glemt passord?</a>
      </div>
    </main>
  )
}



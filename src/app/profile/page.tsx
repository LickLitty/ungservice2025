'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'

// removed PIN functionality

type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone?: string | null
  about?: string | null
  pin_sha256?: string | null
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneCountry, setPhoneCountry] = useState('+47')
  const [about, setAbout] = useState('')
  
  const search = useSearchParams()
  const onboarding = useMemo(() => search.get('onboarding') === '1', [search])
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase().auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const { data } = await supabase()
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      const p = (data || null) as Profile | null
      setProfile(p)
      setFullName(p?.full_name || '')
      if (p?.phone) {
        const m = p.phone.match(/^(\+\d{1,3})(.*)$/)
        if (m) { setPhoneCountry(m[1]); setPhone(m[2]) } else { setPhone(p.phone) }
      } else {
        setPhone('')
      }
      setAbout(p?.about || '')
      setLoading(false)
    }
    load()
  }, [router])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase().auth.getUser()
    if (!user) return alert('Logg inn først')
    const updates: Record<string, any> = {
      id: user.id,
      full_name: fullName || null,
      phone: phone ? `${phoneCountry}${phone.replace(/\s+/g, '')}` : null,
      about: about || null,
    }
    const { error } = await supabase().from('profiles').upsert(updates, { onConflict: 'id' })
    if (error) return alert(error.message)
    if (onboarding) router.replace('/')
    else alert('Lagret!')
  }

  if (loading) return <div>Laster…</div>

  return (
    <div className="max-w-xl mx-auto bg-white border rounded p-4 space-y-4">
      <h1 className="text-2xl font-bold">Min profil</h1>
      {onboarding && (
        <div className="p-3 rounded bg-yellow-50 border text-yellow-900 text-sm">
          Fullfør profilen din for å komme i gang.
        </div>
      )}
      <form onSubmit={save} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Fullt navn</label>
          <input className="w-full border rounded p-3" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Ditt fulle navn" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Telefon</label>
          <input className="w-full border rounded p-3" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+47 9x xx xx xx" />
        </div>
        <div>
          <label className="block text-sm mb-1">Om deg</label>
          <textarea className="w-full border rounded p-3" rows={4} value={about} onChange={e=>setAbout(e.target.value)} placeholder="Kort beskrivelse" />
        </div>
        
        <div className="pt-2">
          <button className="bg-black text-white rounded px-4 py-2">Lagre</button>
        </div>
      </form>
    </div>
  )
}



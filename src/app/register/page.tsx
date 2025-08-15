'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// no-op

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneCountry, setPhoneCountry] = useState('+47')
  const [about, setAbout] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then((res: { data: { session: any } }) => {
      if (res.data.session) router.replace('/')
    })
  }, [router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullPhone = phone ? `${phoneCountry}${phone.replace(/\s+/g, '')}` : null
    // Opprett konto med e-post + passord
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    if (error) return alert(error.message)
    // Oppdater profilfelter (kan kreve at user er bekreftet; Supabase tillater upsert med auth uid)
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName || null, phone: fullPhone, about: about || null })
    }
    // Hvis e-postbekreftelse er av, har vi session og sender til profil. Hvis på, sender vi til login.
    if (data.session) router.replace('/profile?onboarding=1')
    else setSent(true)
  }

  // Ingen magic-link verifisering lenger
  useEffect(() => {}, [])

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Registrer deg</h1>
      {sent ? (
        <p>Konto opprettet. Logg inn med e‑post og passord.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input className="w-full border rounded p-3" type="email" placeholder="E-post" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="w-full border rounded p-3" placeholder="Fullt navn" value={fullName} onChange={e=>setFullName(e.target.value)} required />
          <div className="flex gap-2">
            <select className="border rounded p-3" value={phoneCountry} onChange={e=>setPhoneCountry(e.target.value)}>
              <option value={'+47'}>NO +47</option>
              <option value={'+46'}>SE +46</option>
              <option value={'+45'}>DK +45</option>
              <option value={'+358'}>FI +358</option>
              <option value={'+44'}>UK +44</option>
              <option value={'+49'}>DE +49</option>
              <option value={'+31'}>NL +31</option>
              <option value={'+33'}>FR +33</option>
              <option value={'+34'}>ES +34</option>
              <option value={'+48'}>PL +48</option>
              <option value={'+1'}>US +1</option>
            </select>
            <input className="w-full border rounded p-3" placeholder="Telefonnummer" value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>
          <textarea className="w-full border rounded p-3" rows={4} placeholder="Om deg (valgfritt)" value={about} onChange={e=>setAbout(e.target.value)} />
          <input className="w-full border rounded p-3" type="password" placeholder="Passord" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button className="bg-black text-white rounded px-4 py-2">Opprett konto</button>
        </form>
      )}
    </main>
  )
}



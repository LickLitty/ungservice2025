'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NewJob() {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priceType, setPriceType] = useState<'hourly'|'fixed'>('fixed')
  const [jobType, setJobType] = useState<'one_time'|'recurring'>('one_time')
  const [location, setLocation] = useState('')
  const [requiresCar, setRequiresCar] = useState(false)
  const [requiresTools, setRequiresTools] = useState<'no'|'some'|'yes'>('no')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const auth = await supabase().auth.getUser()
    const user = auth.data.user
    if (!user) return alert('Du må logge inn først.')
    const prof = await supabase().from('profiles').select('full_name').eq('id', user.id).single()

    const { error } = await supabase().from('jobs').insert({
      owner: user.id,
      owner_name: prof.data?.full_name || null,
      title,
      price_cents: price ? Number(price) * 100 : null,
      address,
      description,
      category: category || null,
      price_type: priceType,
      job_type: jobType,
      location: location || null,
      requires_car: requiresCar,
      requires_tools: requiresTools
    })
    if (error) alert(error.message)
    else window.location.href = '/'
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-3xl font-bold">Nytt oppdrag</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Kategori</label>
          <select className="w-full border rounded p-3" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="">Velg kategori</option>
            <option>Gressklipp</option>
            <option>Snekring</option>
            <option>Flyttehjelp</option>
            <option>Snømåking</option>
            <option>Vask</option>
            <option>Annet</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Type jobb</label>
          <select className="w-full border rounded p-3" value={jobType} onChange={e=>setJobType(e.target.value as any)}>
            <option value="one_time">Engangsjobb</option>
            <option value="recurring">Gjentakende jobb</option>
          </select>
        </div>
      </div>
      <input className="w-full border rounded p-3 text-base" placeholder="Tittel" value={title} onChange={e=>setTitle(e.target.value)} required />
      <textarea className="w-full border rounded p-3 text-base" placeholder="Beskrivelse (valgfritt)" value={description} onChange={e=>setDescription(e.target.value)} />
      <input className="w-full border rounded p-3 text-base" placeholder="Adresse (valgfritt)" value={address} onChange={e=>setAddress(e.target.value)} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Pris</label>
          <input className="w-full border rounded p-3 text-base" placeholder="Beløp i kr" type="number" value={price} onChange={e=>setPrice(e.target.value ? Number(e.target.value) : '')} />
        </div>
        <div>
          <label className="block text-sm mb-1">Pristype</label>
          <select className="w-full border rounded p-3" value={priceType} onChange={e=>setPriceType(e.target.value as any)}>
            <option value="fixed">Fastpris</option>
            <option value="hourly">Timebetalt</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Sted</label>
          <input className="w-full border rounded p-3 text-base" placeholder="By/område" value={location} onChange={e=>setLocation(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Krav</label>
          <div className="flex gap-3">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={requiresCar} onChange={e=>setRequiresCar(e.target.checked)} /> Bil kreves</label>
            <select className="border rounded p-2" value={requiresTools} onChange={e=>setRequiresTools(e.target.value as any)}>
              <option value="no">Utstyr: Nei</option>
              <option value="some">Utstyr: Noe</option>
              <option value="yes">Utstyr: Ja</option>
            </select>
          </div>
        </div>
      </div>
      <button className="bg-black text-white rounded px-4 py-2 text-base">Publiser</button>
    </form>
  )
}



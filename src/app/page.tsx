"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import SearchBar from './_components/SearchBar'
import CategoryNav from './_components/CategoryNav'
import JobCard from './_components/JobCard'

type Job = {
  id: string
  title: string
  price_cents: number | null
  address: string | null
  status: string
  category?: string | null
  price_type?: 'hourly' | 'fixed'
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [category, setCategory] = useState('')
  const [priceType, setPriceType] = useState('')
  const [location, setLocation] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    const fetch = async () => {
      let query = supabase().from('jobs').select('id,title,price_cents,address,status,category,price_type,owner_name,description,location,requires_car,requires_tools').eq('status','open')
      if (category) query = query.eq('category', category)
      if (priceType) query = query.eq('price_type', priceType as any)
      if (location) query = query.ilike('location', `%${location}%`)
      if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      const { data, error } = await query.order('created_at', { ascending: false })
      if (!error && data) setJobs(data as Job[])
    }
    fetch()
  }, [category, priceType, location, q])

  return (
    <div className="space-y-6">
      <SearchBar q={q} onChange={setQ} />
      <CategoryNav value={category} onChange={setCategory} />
      <div className="max-w-5xl mx-auto flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm mb-1">Kategori</label>
          <select className="border rounded p-2" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="">Alle</option>
            <option>Gressklipp</option>
            <option>Snekring</option>
            <option>Flyttehjelp</option>
            <option>Snømåking</option>
            <option>Vask</option>
            <option>Annet</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Pristype</label>
          <select className="border rounded p-2" value={priceType} onChange={e=>setPriceType(e.target.value)}>
            <option value="">Alle</option>
            <option value="fixed">Fastpris</option>
            <option value="hourly">Timebetalt</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Sted</label>
          <input className="border rounded p-2" placeholder="By/område" value={location} onChange={e=>setLocation(e.target.value)} />
        </div>
      </div>
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((j) => (<JobCard key={j.id} job={j} />))}
      </div>
      {jobs.length === 0 && <div className="max-w-5xl mx-auto">Ingen oppdrag enda.</div>}
    </div>
  )
}

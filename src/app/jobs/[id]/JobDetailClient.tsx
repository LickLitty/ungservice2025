'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function JobDetailClient({ id }: { id: string }) {
  const [job, setJob] = useState<any>(null)
  const [ownerName, setOwnerName] = useState<string>('')

  useEffect(() => {
    const loadJob = async () => {
      const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single()
      if (!error && data) {
        setJob(data)
        const prof = await supabase.from('profiles').select('full_name').eq('id', data.owner).single()
        if (!prof.error) setOwnerName(prof.data?.full_name || '')
      }
    }
    loadJob()
  }, [id])

  const addContact = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Logg inn for å legge til kontakt.')
    if (!job?.owner || job.owner === user.id) {
      // Hoppe direkte til meldinger (eier eller egen jobb)
      window.location.href = `/messages${job?.owner ? `?to=${job.owner}` : ''}`
      return
    }
    // Sørg for at det finnes en DM-tråd mellom brukeren og eier
    const existing = await supabase
      .from('direct_messages')
      .select('id')
      .or(`and(sender.eq.${user.id},recipient.eq.${job.owner}),and(sender.eq.${job.owner},recipient.eq.${user.id})`)
      .limit(1)
    if (!existing.error && existing.data && existing.data.length === 0) {
      // legg inn en tom oppstarts-melding
      await supabase.from('direct_messages').insert({ sender: user.id, recipient: job.owner, body: '(startet samtale)' })
    }
    window.location.href = `/messages?to=${job.owner}`
  }

  if (!job) return <div>Laster…</div>
  return (
    <div className="space-y-4">
      <div className="border rounded p-4 bg-white">
        <h1 className="text-3xl font-bold">{job.title}</h1>
        {!!ownerName && <div className="mt-2 text-sm text-gray-700">Oppdragsgiver: <span className="font-medium">{ownerName}</span></div>}
        {!!job.description && <p className="mt-3 whitespace-pre-wrap text-base leading-7">{job.description}</p>}
        <div className="text-base text-gray-700 mt-3">{job.address ?? 'Uten adresse'}</div>
        <div className="text-base mt-1">{job.price_cents ? (job.price_cents/100).toFixed(0)+' kr' : '–'}</div>
      </div>
      <div className="border rounded p-4 bg-white space-y-3">
        <button onClick={addContact} className="bg-blue-600 text-white rounded px-4 py-2 text-base hover:bg-blue-700">Legg til kontakt</button>
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function JobDetailClient({ id }: { id: string }) {
  const [job, setJob] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [interested, setInterested] = useState(false)
  const [ownerName, setOwnerName] = useState<string>('')
  const [isOwner, setIsOwner] = useState(false)

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

  // Fjernet send søknad-funksjon

  const markInterested = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Logg inn for å vise interesse.')

    if (!interested) {
      const { error } = await supabase.from('applications').upsert({
        job_id: id,
        applicant: user.id,
        message: message || 'Viser interesse',
        price_cents: price ? Number(price) * 100 : null,
        status: 'pending'
      }, { onConflict: 'job_id,applicant' })
      if (error) return alert(error.message)

      const prof = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      const displayName = prof.data?.full_name || 'En bruker'
      await supabase.from('messages').insert({ job_id: id, sender: user.id, body: `${displayName} viste interesse for oppdraget.` })
      const job = await supabase.from('jobs').select('owner').eq('id', id).single()
      if (job.data?.owner) {
        await supabase.from('notifications').insert({ user_id: job.data.owner, job_id: id, from_user: user.id, type: 'interest', message: `${displayName} viste interesse for oppdraget.` })
      }
      setInterested(true)
    } else {
      // Remove interest
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('job_id', id)
        .eq('applicant', user.id)
      if (error) return alert(error.message)
      setInterested(false)
    }
  }

  // Sett isOwner og initial interested-status
  useEffect(() => {
    const init = async () => {
      if (!job) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setIsOwner(user.id === job.owner)
      const existing = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', id)
        .eq('applicant', user.id)
        .maybeSingle()
      setInterested(!!existing.data)
    }
    init()
  }, [job, id])

  if (!job) return <div>Laster…</div>
  return (
    <div className="space-y-4">
      <div className="border rounded p-4 bg-white">
        <h1 className="text-3xl font-bold">{job.title}</h1>
        {!!ownerName && <div className="mt-2 text-sm text-gray-700">Oppdragsgiver: <span className="font-medium">{ownerName}</span></div>}
        {!!job.description && <p className="mt-3 whitespace-pre-wrap text-base leading-7">{job.description}</p>}
        <div className="text-base text-gray-700 mt-3">{job.address ?? 'Uten adresse'}</div>
        <div className="text-base mt-1">{job.price_cents ? (job.price_cents/100).toFixed(0)+' kr' : '–'}</div>
        <a className="text-blue-600 underline inline-block mt-2" href={`/jobs/${job.id}/chat?to=${job.owner}`}>Åpne chat</a>
      </div>
      <div className="border rounded p-4 bg-white space-y-3">
        <h2 className="text-lg font-semibold">Søk / vis interesse</h2>
        <div className="flex gap-2">
          {!isOwner && (
            <button
              onClick={markInterested}
              disabled={interested}
              className={`${interested ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded px-4 py-2 text-base disabled:opacity-80`}
            >
              {interested ? 'Interessert' : 'Vis interesse'}
            </button>
          )}
          <a className="border rounded px-4 py-2 text-base" href={`/jobs/${id}/chat`}>Melding</a>
          <a className="border rounded px-4 py-2 text-base" href={`/jobs/${id}/interested`}>Se interesserte</a>
        </div>
        <input className="w-full border rounded p-2" placeholder="Foreslått pris (kr, valgfritt)" type="number" value={price} onChange={e=>setPrice(e.target.value ? Number(e.target.value) : '')} />
        <textarea className="w-full border rounded p-2" placeholder="Melding til oppdragsgiver (valgfritt)" value={message} onChange={e=>setMessage(e.target.value)} />
      </div>
    </div>
  )
}

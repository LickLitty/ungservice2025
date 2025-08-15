'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function JobDetailClient({ id }: { id: string }) {
  const [job, setJob] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [interested, setInterested] = useState(false)
  const [ownerName, setOwnerName] = useState<string>('')

  useEffect(() => {
    supabase().from('jobs').select('*').eq('id', id).single()
      .then(async ({ data, error }) => {
        if (!error && data) {
          setJob(data)
          if (data.owner) {
            const prof = await supabase().from('profiles').select('full_name').eq('id', data.owner).single()
            if (!prof.error) setOwnerName(prof.data?.full_name || '')
          }
        }
      })
  }, [id])

  const apply = async () => {
    const { data: { user } } = await supabase().auth.getUser()
    if (!user) return alert('Logg inn for å søke.')
    const { error } = await supabase().from('applications').insert({
      job_id: id,
      applicant: user.id,
      message,
      price_cents: price ? Number(price) * 100 : null
    })
    if (error) alert(error.message)
    else alert('Søknad sendt!')
  }

  const markInterested = async () => {
    const { data: { user } } = await supabase().auth.getUser()
    if (!user) return alert('Logg inn for å vise interesse.')
    const { error } = await supabase().from('applications').upsert({
      job_id: id,
      applicant: user.id,
      message: message || 'Viser interesse',
      price_cents: price ? Number(price) * 100 : null,
      status: 'pending'
    }, { onConflict: 'job_id,applicant' })
    if (error) alert(error.message)
    else {
      // Send automatisk systemmelding som varsling i chatten
      const prof = await supabase().from('profiles').select('full_name').eq('id', user.id).single()
      const displayName = prof.data?.full_name || 'En bruker'
      await supabase().from('messages').insert({
        job_id: id,
        sender: user.id,
        body: `${displayName} viste interesse for oppdraget.`
      })
      // Notification til eier
      const job = await supabase().from('jobs').select('owner').eq('id', id).single()
      if (job.data?.owner) {
        await supabase().from('notifications').insert({
          user_id: job.data.owner,
          job_id: id,
          from_user: user.id,
          type: 'interest',
          message: `${displayName} viste interesse for oppdraget.`
        })
      }
      setInterested(true)
      alert('Interesse registrert! Du kan sende melding i chatten.')
    }
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
        <a className="text-blue-600 underline inline-block mt-2" href={`/jobs/${job.id}/chat`}>Åpne chat</a>
      </div>
      <div className="border rounded p-4 bg-white space-y-3">
        <h2 className="text-lg font-semibold">Søk / vis interesse</h2>
        <div className="flex gap-2">
          <button onClick={markInterested} className="bg-blue-600 text-white rounded px-4 py-2 text-base">Vis interesse</button>
          <a className="border rounded px-4 py-2 text-base" href={`/jobs/${id}/chat`}>Direktemelding</a>
        </div>
        <input className="w-full border rounded p-2" placeholder="Foreslått pris (kr, valgfritt)" type="number" value={price} onChange={e=>setPrice(e.target.value ? Number(e.target.value) : '')} />
        <textarea className="w-full border rounded p-2" placeholder="Melding til oppdragsgiver" value={message} onChange={e=>setMessage(e.target.value)} />
        <button onClick={apply} className="bg-black text-white rounded px-4 py-2 text-base">Send søknad</button>
      </div>
    </div>
  )
}

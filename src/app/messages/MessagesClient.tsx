"use client"
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

type Thread = {
  other_id: string
  other_name: string | null
  last_message: string | null
  last_time: string | null
}

export default function MessagesClient() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [selected, setSelected] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [meId, setMeId] = useState<string | null>(null)
  const search = useSearchParams()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setMeId(user.id)

      // 1) Hent alle deltagere fra direct_messages der bruker er sender/mottaker
      const dm = await supabase
        .from('direct_messages')
        .select('sender, recipient, body, created_at')
        .or(`sender.eq.${user.id},recipient.eq.${user.id}`)
        .order('created_at', { ascending: false })

      const otherIds = new Set<string>()
      ;(dm.data || []).forEach((m: any) => {
        const other = m.sender === user.id ? m.recipient : m.sender
        if (other && other !== user.id) otherIds.add(other)
      })

      // 2) Hent relasjoner fra applications (vis interesse)
      const ownedJobs = await supabase.from('jobs').select('id').eq('owner', user.id)
      const ownedIds = (ownedJobs.data || []).map((j: any) => j.id)
      const interestToMe = ownedIds.length
        ? await supabase.from('applications').select('applicant, created_at').in('job_id', ownedIds)
        : { data: [] as any[] }

      ;(interestToMe.data || []).forEach((a: any) => { if (a.applicant !== user.id) otherIds.add(a.applicant) })

      const myInterests = await supabase.from('applications').select('job_id, created_at').eq('applicant', user.id)
      const theirOwnersIds = (myInterests.data || []).map((a: any) => a.job_id)
      const owners = theirOwnersIds.length
        ? await supabase.from('jobs').select('owner').in('id', theirOwnersIds)
        : { data: [] as any[] }
      ;(owners.data || []).forEach((o: any) => { if (o.owner !== user.id) otherIds.add(o.owner) })

      // 3) Slå opp navn
      const ids = Array.from(otherIds)
      const profiles = ids.length
        ? await supabase.from('profiles').select('id, full_name').in('id', ids)
        : { data: [] as any[] }
      const idToName = new Map<string, string | null>((profiles.data || []).map((p: any) => [p.id, p.full_name]))

      const threadsMap = new Map<string, Thread>()
      ;(dm.data || []).forEach((m: any) => {
        const other = m.sender === user.id ? m.recipient : m.sender
        if (!other || other === user.id) return
        if (!threadsMap.has(other)) {
          threadsMap.set(other, {
            other_id: other,
            other_name: idToName.get(other) || 'Ukjent',
            last_message: m.body,
            last_time: m.created_at,
          })
        }
      })

      // 4) Sørg for at interesser også dukker som tomme tråder
      ids.forEach((other) => {
        if (!threadsMap.has(other)) {
          threadsMap.set(other, {
            other_id: other,
            other_name: idToName.get(other) || 'Ukjent',
            last_message: null,
            last_time: null,
          })
        }
      })

      const threadsData = Array.from(threadsMap.values())
      setThreads(threadsData)
      const toParam = search.get('to')
      let initial = toParam ? threadsData.find(t => t.other_id === toParam) : (threadsData.find(t => t.other_id !== user.id) || null)
      if (!initial && toParam && toParam !== user.id) {
        // Create a placeholder thread so user can start a new DM even if no messages yet
        const prof = await supabase.from('profiles').select('id, full_name').eq('id', toParam).maybeSingle()
        if (!prof.error && prof.data) {
          initial = { other_id: prof.data.id, other_name: prof.data.full_name, last_message: null, last_time: null }
          setThreads(prev => [initial as Thread, ...prev])
        }
      }
      if (initial) selectThread(initial)
    }
    load()
  }, [search])

  const selectThread = async (t: Thread) => {
    setSelected(t)
    if (!meId) return
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender.eq.${t.other_id},recipient.eq.${meId}),and(sender.eq.${meId},recipient.eq.${t.other_id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const send = async () => {
    if (!text.trim() || !selected || !meId || selected.other_id === meId) return
    const body = text.trim()
    setText('')
    const { error } = await supabase.from('direct_messages').insert({ sender: meId, recipient: selected.other_id, body })
    if (error) {
      console.error('DM send error', error)
      alert('Feil ved sending av melding: ' + error.message)
      return
    }
    // Refresh messages after send
    selectThread(selected)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white border rounded md:col-span-1">
        <div className="p-3 border-b font-semibold">Meldinger</div>
        <div className="max-h-[70vh] overflow-y-auto">
          {(threads.length === 0) && <div className="p-3 text-sm text-gray-600">Ingen samtaler ennå.</div>}
          {threads.map(t => (
            <button key={t.other_id} onClick={() => setSelected(t)} className={`w-full text-left p-3 border-b hover:bg-gray-50 ${selected && selected.other_id===t.other_id ? 'bg-gray-50' : ''}`}>
              <div className="font-medium">{t.other_name || 'Ukjent'}</div>
              <div className="text-xs text-gray-600">{t.last_message || '...'}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white border rounded md:col-span-2 flex flex-col">
        <div className="p-3 border-b font-semibold">{selected?.other_name || 'Velg en tråd'}</div>
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {messages.map(m => (
            <div key={m.id} className="border rounded p-2">
              <div className="text-xs text-gray-500">{new Date(m.created_at).toLocaleString('no-NO')}</div>
              <div>{m.body}</div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t flex gap-2">
          <input className="flex-1 border rounded p-2" placeholder="Skriv melding..." value={text} onChange={e=>setText(e.target.value)} disabled={!selected || (meId !== null && selected?.other_id === meId)} />
          <button className="bg-blue-600 text-white rounded px-4 disabled:opacity-50" onClick={send} disabled={!selected || !text.trim() || (meId !== null && selected?.other_id === meId)}>Send</button>
        </div>
      </div>
    </div>
  )
}



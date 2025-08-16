'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Thread = {
  job_id: string
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

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Find all jobs the user is related to
      const jobsRes = await supabase
        .from('jobs')
        .select('id, owner')
        .or(`owner.eq.${user.id}`)
      const jobIds = (jobsRes.data || []).map((j: any) => j.id)

      // Collect participants from applications
      const apps = await supabase
        .from('applications')
        .select('job_id, applicant, created_at')
        .in('job_id', jobIds)

      const otherIds = new Set<string>()
      ;(apps.data || []).forEach((a: any) => otherIds.add(a.applicant))

      const profiles = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', Array.from(otherIds))

      const idToName = new Map((profiles.data || []).map((p: any) => [p.id, p.full_name]))

      const threadsData: Thread[] = (apps.data || []).map((a: any) => ({
        job_id: a.job_id,
        other_id: a.applicant,
        other_name: idToName.get(a.applicant) || 'Ukjent',
        last_message: null,
        last_time: a.created_at,
      }))

      setThreads(threadsData)
      if (threadsData[0]) selectThread(threadsData[0])
    }
    load()
  }, [])

  const selectThread = async (t: Thread) => {
    setSelected(t)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('job_id', t.job_id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const send = async () => {
    if (!text.trim() || !selected) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const body = text.trim()
    setText('')
    const { error } = await supabase.from('messages').insert({ job_id: selected.job_id, sender: user.id, body })
    if (!error) selectThread(selected)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white border rounded md:col-span-1">
        <div className="p-3 border-b font-semibold">Meldinger</div>
        <div className="max-h-[70vh] overflow-y-auto">
          {(threads.length === 0) && <div className="p-3 text-sm text-gray-600">Ingen samtaler ennå.</div>}
          {threads.map(t => (
            <button key={`${t.job_id}-${t.other_id}`} onClick={() => selectThread(t)} className={`w-full text-left p-3 border-b hover:bg-gray-50 ${selected && selected.job_id===t.job_id && selected.other_id===t.other_id ? 'bg-gray-50' : ''}`}>
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
          <input className="flex-1 border rounded p-2" placeholder="Skriv melding..." value={text} onChange={e=>setText(e.target.value)} />
          <button className="bg-blue-600 text-white rounded px-4" onClick={send}>Send</button>
        </div>
      </div>
    </div>
  )
}



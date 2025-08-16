'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
  const search = useSearchParams()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Hent alle deltagere fra direct_messages der bruker er sender/mottaker
      const dm = await supabase
        .from('direct_messages')
        .select('sender, recipient, body, created_at')
        .or(`sender.eq.${user.id},recipient.eq.${user.id}`)
        .order('created_at', { ascending: false })

      const otherIds = new Set<string>()
      ;(dm.data || []).forEach((m: any) => {
        const other = m.sender === user.id ? m.recipient : m.sender
        otherIds.add(other)
      })

      const profiles = await supabase.from('profiles').select('id, full_name').in('id', Array.from(otherIds))
      const idToName = new Map<string, string | null>((profiles.data || []).map((p: any) => [p.id, p.full_name]))

      const threadsMap = new Map<string, Thread>()
      ;(dm.data || []).forEach((m: any) => {
        const other = m.sender === user.id ? m.recipient : m.sender
        if (!threadsMap.has(other)) {
          threadsMap.set(other, {
            other_id: other,
            other_name: idToName.get(other) || 'Ukjent',
            last_message: m.body,
            last_time: m.created_at,
          })
        }
      })

      const threadsData = Array.from(threadsMap.values())
      setThreads(threadsData)
      const toParam = search.get('to')
      const initial = toParam ? threadsData.find(t => t.other_id === toParam) : threadsData[0]
      if (initial) selectThread(initial)
    }
    load()
  }, [search])

  const selectThread = async (t: Thread) => {
    setSelected(t)
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender.eq.${t.other_id},recipient.eq.(select auth.uid())),and(sender.eq.(select auth.uid()),recipient.eq.${t.other_id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const send = async () => {
    if (!text.trim() || !selected) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const body = text.trim()
    setText('')
    const { error } = await supabase.from('direct_messages').insert({ sender: user.id, recipient: selected.other_id, body })
    if (!error) selectThread(selected)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white border rounded md:col-span-1">
        <div className="p-3 border-b font-semibold">Meldinger</div>
        <div className="max-h-[70vh] overflow-y-auto">
          {(threads.length === 0) && <div className="p-3 text-sm text-gray-600">Ingen samtaler ennå.</div>}
          {threads.map(t => (
            <button key={t.other_id} onClick={() => selectThread(t)} className={`w-full text-left p-3 border-b hover:bg-gray-50 ${selected && selected.other_id===t.other_id ? 'bg-gray-50' : ''}`}>
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



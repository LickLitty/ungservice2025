'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ChatClient({ id }: { id: string }) {
  const [msgs, setMsgs] = useState<any[]>([])
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const [me, setMe] = useState<any>(null)
  const [other, setOther] = useState<any>(null)
  const [ownerName, setOwnerName] = useState<string>('')

  useEffect(() => {
    const sb = supabase()
    sb.from('messages').select('*').eq('job_id', id).order('created_at', { ascending: true })
      .then(({ data }) => setMsgs(data || []))

    const channel = sb.channel(`messages-${id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${id}` },
        (payload) => setMsgs(prev => [...prev, payload.new as any])
      ).subscribe()

    return () => { sb.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    const loadUsers = async () => {
      const { data: { user } } = await supabase().auth.getUser()
      if (!user) return
      const jobRes = await supabase().from('jobs').select('owner').eq('id', id).single()
      const ownerId = jobRes.data?.owner
      if (!ownerId) return
      const ownerRes = await supabase().from('profiles').select('full_name').eq('id', ownerId).single()
      if (!ownerRes.error) setOwnerName(ownerRes.data?.full_name || '')

      const meRes = await supabase().from('profiles').select('id,full_name,phone,about').eq('id', user.id).single()
      setMe(meRes.data)
      const otherId = user.id === ownerId
        ? (await supabase().from('applications').select('applicant').eq('job_id', id).limit(1).maybeSingle()).data?.applicant
        : ownerId
      if (otherId) {
        const otherRes = await supabase().from('profiles').select('id,full_name,phone,about').eq('id', otherId).maybeSingle()
        setOther(otherRes.data)
      }
    }
    loadUsers()
  }, [id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = async () => {
    const { data: { user } } = await supabase().auth.getUser()
    if (!user) return alert('Logg inn.')
    if (!text.trim()) return
    const { error } = await supabase().from('messages').insert({
      job_id: id, sender: user.id, body: text.trim()
    })
    if (!error) setText('')
  }

  return (
    <div className="border rounded p-4 bg-white h-[70vh] flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-3">
        {(me || other) && (
          <div className="rounded bg-gray-50 p-3 text-sm text-gray-700">
            {me && (
              <div><span className="font-medium">Deg:</span> {me.full_name || 'Uten navn'}{me.phone ? ` · ${me.phone}` : ''}</div>
            )}
            {ownerName && <div><span className="font-medium">Oppdragsgiver:</span> {ownerName}</div>}
            {other && (
              <div><span className="font-medium">Andre part:</span> {other.full_name || 'Uten navn'}{other.phone ? ` · ${other.phone}` : ''}</div>
            )}
          </div>
        )}
        {msgs.map(m => (
          <div key={m.id} className="border rounded p-3">
            <div className="text-sm text-gray-500">{new Date(m.created_at).toLocaleString()}</div>
            <div className="text-base leading-7">
              <span className="font-semibold">{m.sender === me?.id ? (me?.full_name || 'Deg') : (other?.full_name || ownerName || 'Ukjent')}:</span> {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="mt-4 flex gap-2">
        <input className="flex-1 border rounded p-3 text-base" value={text} onChange={e=>setText(e.target.value)} placeholder="Skriv melding..." />
        <button onClick={send} className="bg-black text-white rounded px-4 py-2 text-base">Send</button>
      </div>
    </div>
  )
}

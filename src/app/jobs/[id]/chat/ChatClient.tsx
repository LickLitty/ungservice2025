'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

// Chat component - updated to fix sender issue
export default function ChatClient({ id }: { id: string }) {
  const [msgs, setMsgs] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [me, setMe] = useState<any>(null)
  const [other, setOther] = useState<any>(null)
  const [ownerName, setOwnerName] = useState<string>('')
  const lastMessageTimeRef = useRef<string>('')
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)
  const searchParams = useSearchParams()

  type Message = { id: string; created_at: string; job_id: string; sender: string; body: string }

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('job_id', id)
        .order('created_at', { ascending: true })
      
      if (!error && data) {
        setMsgs(data as Message[])
        if (data.length > 0) {
          lastMessageTimeRef.current = (data[data.length - 1] as Message).created_at
        }
      }
    }
    
    loadMessages()
  }, [id])

  // Realtime subscription for instant updates (with dedupe)
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`messages-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `job_id=eq.${id}`
      }, (payload: { new: Message }) => {
        setMsgs(prev => {
          if (prev.some((m: Message) => m.id === payload.new.id)) return prev
          const next = [...prev, payload.new]
          if (payload.new.created_at > (lastMessageTimeRef.current || '')) {
            lastMessageTimeRef.current = payload.new.created_at
          }
          return next
        })
      })
      .subscribe()

    channelRef.current = channel

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [id])

  // Poll for new messages every 2s (fallback)
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const since = lastMessageTimeRef.current
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('job_id', id)
        .gt('created_at', since || '1970-01-01')
        .order('created_at', { ascending: true })
      if (!error && data && data.length > 0) {
        setMsgs(prev => {
          const incoming = (data as Message[]).filter((m: Message) => !prev.some((p: Message) => p.id === m.id))
          if (incoming.length > 0) {
            lastMessageTimeRef.current = incoming[incoming.length - 1].created_at
            return [...prev, ...incoming]
          }
          return prev
        })
      }
    }, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [id])

  // Load user data (respect ?to=USER_ID)
  useEffect(() => {
    const loadUsers = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const jobRes = await supabase.from('jobs').select('owner').eq('id', id).single()
      const ownerId = jobRes.data?.owner
      if (!ownerId) return
      
      const ownerRes = await supabase.from('profiles').select('full_name').eq('id', ownerId).single()
      if (!ownerRes.error) setOwnerName(ownerRes.data?.full_name || '')

      const meRes = await supabase.from('profiles').select('id,full_name,phone,about').eq('id', user.id).single()
      setMe(meRes.data)

      const toParam = searchParams.get('to')
      const otherId = toParam
        ? toParam
        : user.id === ownerId
          ? (await supabase.from('applications').select('applicant').eq('job_id', id).limit(1).maybeSingle()).data?.applicant
          : ownerId
      
      if (otherId) {
        const otherRes = await supabase.from('profiles').select('id,full_name,phone,about').eq('id', otherId).maybeSingle()
        setOther(otherRes.data)
      }
    }
    loadUsers()
  }, [id, searchParams])

  // Auto-scroll to bottom when new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = async () => {
    if (!text.trim() || loading) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Logg inn.')
      return
    }

    setLoading(true)
    
    try {
      const messageText = text.trim()
      setText('')

      // Send to database first
      const { data, error } = await supabase.from('messages').insert({
        job_id: id,
        sender: user.id,
        body: messageText
      }).select().single()

      if (error) {
        alert('Feil ved sending av melding: ' + error.message)
      } else if (data) {
        // Add the real message immediately
        setMsgs(prev => [...prev, data as Message])
        lastMessageTimeRef.current = (data as Message).created_at
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('En feil oppstod ved sending av melding')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
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
        {msgs.map((m: Message) => (
          <div key={m.id} className="border rounded p-3">
            <div className="text-sm text-gray-500">
              {new Date(m.created_at).toLocaleString('no-NO')}
            </div>
            <div className="text-base leading-7">
              <span className="font-semibold">
                {m.sender === me?.id ? (me?.full_name || 'Deg') : (other?.full_name || ownerName || 'Ukjent')}:
              </span> {m.body}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="mt-4 flex gap-2">
        <input 
          className="flex-1 border rounded p-3 text-base" 
          value={text} 
          onChange={e => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Skriv melding..." 
          disabled={loading}
        />
        <button 
          onClick={send} 
          disabled={loading || !text.trim()}
          className="bg-blue-600 text-white rounded px-4 py-2 text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sender...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

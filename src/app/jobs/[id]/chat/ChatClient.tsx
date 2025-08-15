'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ChatClient({ id }: { id: string }) {
  const [msgs, setMsgs] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [me, setMe] = useState<any>(null)
  const [other, setOther] = useState<any>(null)
  const [ownerName, setOwnerName] = useState<string>('')
  const channelRef = useRef<any>(null)

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase()
        .from('messages')
        .select('*')
        .eq('job_id', id)
        .order('created_at', { ascending: true })
      
      if (!error && data) {
        setMsgs(data)
      }
    }
    
    loadMessages()
  }, [id])

  // Setup real-time subscription
  useEffect(() => {
    const sb = supabase()
    
    // Create unique channel name
    const channelName = `messages-${id}-${Date.now()}`
    
    const channel = sb.channel(channelName)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `job_id=eq.${id}` 
        },
        (payload) => {
          console.log('New message received:', payload)
          setMsgs(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === payload.new.id)
            if (exists) return prev
            return [...prev, payload.new]
          })
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        sb.removeChannel(channelRef.current)
      }
    }
  }, [id])

  // Load user data
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

  // Auto-scroll to bottom when new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = async () => {
    if (!text.trim() || loading) return
    
    const { data: { user } } = await supabase().auth.getUser()
    if (!user) {
      alert('Logg inn.')
      return
    }

    setLoading(true)
    
    try {
      // Create optimistic message
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        job_id: id,
        sender: user.id,
        body: text.trim(),
        created_at: new Date().toISOString(),
        sender_name: me?.full_name || 'Deg'
      }

      // Add optimistic message immediately
      setMsgs(prev => [...prev, optimisticMessage])
      setText('')

      // Send to database
      const { error } = await supabase().from('messages').insert({
        job_id: id,
        sender: user.id,
        body: text.trim()
      })

      if (error) {
        // Remove optimistic message if failed
        setMsgs(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
        alert('Feil ved sending av melding: ' + error.message)
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
        {msgs.map(m => (
          <div key={m.id} className={`border rounded p-3 ${m.id.startsWith('temp-') ? 'opacity-70' : ''}`}>
            <div className="text-sm text-gray-500">
              {new Date(m.created_at).toLocaleString('no-NO')}
              {m.id.startsWith('temp-') && <span className="ml-2 text-blue-500">(sender...)</span>}
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

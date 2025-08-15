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
  const optimisticMessagesRef = useRef<Set<string>>(new Set())
  const lastMessageTimeRef = useRef<string>('')
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('job_id', id)
        .order('created_at', { ascending: true })
      
      if (!error && data) {
        setMsgs(data)
        if (data.length > 0) {
          lastMessageTimeRef.current = data[data.length - 1].created_at
        }
      }
    }
    
    loadMessages()
  }, [id])

  // Setup polling fallback
  useEffect(() => {
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(async () => {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('job_id', id)
          .gt('created_at', lastMessageTimeRef.current)
          .order('created_at', { ascending: true })
        
        if (!error && data && data.length > 0) {
          setMsgs(prev => {
            const newMessages = data.filter(newMsg => 
              !prev.some(existingMsg => existingMsg.id === newMsg.id)
            )
            if (newMessages.length > 0) {
              lastMessageTimeRef.current = data[data.length - 1].created_at
              return [...prev, ...newMessages]
            }
            return prev
          })
        }
      }, 3000) // Poll every 3 seconds
    }

    startPolling()

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [id])

  // Setup real-time subscription
  useEffect(() => {
    const setupSubscription = async () => {
      // Create unique channel name
      const channelName = `messages-${id}-${Date.now()}`
      
      const channel = supabase.channel(channelName)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages', 
            filter: `job_id=eq.${id}` 
          },
          (payload) => {
            console.log('New message received:', payload)
            
            // Remove optimistic message if this is the real one
            const optimisticId = Array.from(optimisticMessagesRef.current).find(optId => 
              payload.new.body === text || payload.new.sender === me?.id
            )
            if (optimisticId) {
              optimisticMessagesRef.current.delete(optimisticId)
            }
            
            setMsgs(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === payload.new.id)
              if (exists) return prev
              
              // Replace optimistic message with real one
              const withoutOptimistic = prev.filter(msg => !msg.id.startsWith('temp-'))
              const updated = [...withoutOptimistic, payload.new]
              
              // Update last message time
              if (payload.new.created_at > lastMessageTimeRef.current) {
                lastMessageTimeRef.current = payload.new.created_at
              }
              
              return updated
            })
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status)
        })

      channelRef.current = channel
    }

    setupSubscription()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [id, me?.id, text])

  // Load user data
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
      
      const otherId = user.id === ownerId
        ? (await supabase.from('applications').select('applicant').eq('job_id', id).limit(1).maybeSingle()).data?.applicant
        : ownerId
      
      if (otherId) {
        const otherRes = await supabase.from('profiles').select('id,full_name,phone,about').eq('id', otherId).maybeSingle()
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
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Logg inn.')
      return
    }

    setLoading(true)
    
    try {
      const messageText = text.trim()
      setText('')

      // Create optimistic message
      const optimisticId = `temp-${Date.now()}`
      const optimisticMessage = {
        id: optimisticId,
        job_id: id,
        sender: user.id,
        body: messageText,
        created_at: new Date().toISOString(),
        sender_name: me?.full_name || 'Deg'
      }

      // Add optimistic message immediately
      setMsgs(prev => [...prev, optimisticMessage])
      optimisticMessagesRef.current.add(optimisticId)

      // Send to database
      const { error } = await supabase.from('messages').insert({
        job_id: id,
        sender: user.id,
        body: messageText
      })

      if (error) {
        // Remove optimistic message if failed
        setMsgs(prev => prev.filter(msg => msg.id !== optimisticId))
        optimisticMessagesRef.current.delete(optimisticId)
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

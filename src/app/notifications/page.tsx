'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Notification = {
  id: string
  job_id: string | null
  from_user: string | null
  type: 'interest' | 'message' | 'application'
  message: string | null
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof supabase>['channel']> | null = null
    const load = async () => {
      const { data: { user } } = await supabase().auth.getUser()
      if (!user) return
      const { data } = await supabase()
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setItems((data || []) as Notification[])
      setLoading(false)

      channel = supabase()
        .channel(`notifications-${user.id}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => setItems(prev => [payload.new as Notification, ...prev])
        )
        .subscribe()
    }
    load()
    return () => { if (channel) supabase().removeChannel(channel) }
  }, [])

  const markRead = async (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase().from('notifications').update({ read: true }).eq('id', id)
  }

  if (loading) return <div>Laster…</div>

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Varsler</h1>
      {items.length === 0 && <div>Ingen varsler enda.</div>}
      {items.map(n => (
        <div key={n.id} className={`border rounded p-3 bg-white ${n.read ? 'opacity-70' : ''}`}>
          <div className="text-sm text-gray-500">{new Date(n.created_at).toLocaleString()} · {n.type}</div>
          <div className="mt-1">{n.message}</div>
          <div className="mt-2 flex gap-3">
            {!!n.job_id && <a className="underline" href={`/jobs/${n.job_id}`}>Gå til oppdrag</a>}
            {!n.read && <button className="underline" onClick={() => markRead(n.id)}>Marker som lest</button>}
          </div>
        </div>
      ))}
    </div>
  )
}



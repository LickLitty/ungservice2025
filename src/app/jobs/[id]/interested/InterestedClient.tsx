'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Applicant = {
  id: string
  applicant: string
  message: string | null
  price_cents: number | null
  created_at: string
  profile?: { id: string; full_name: string | null; phone: string | null } | null
}

export default function InterestedClient({ id }: { id: string }) {
  const [items, setItems] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('applications')
        .select('id, applicant, message, price_cents, created_at')
        .eq('job_id', id)
        .order('created_at', { ascending: false })
      const enriched: Applicant[] = []
      for (const a of (data || []) as Applicant[]) {
        const p = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .eq('id', a.applicant)
          .single()
        enriched.push({ ...a, profile: p.data || null })
      }
      setItems(enriched)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="max-w-3xl mx-auto p-4">Laster…</div>

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Interesserte</h1>
      {items.length === 0 && <div>Ingen interesserte enda.</div>}
      {items.map(a => (
        <div key={a.id} className="border rounded p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{a.profile?.full_name || 'Uten navn'}{a.profile?.phone ? ` · ${a.profile.phone}` : ''}</div>
              {a.price_cents ? <div className="text-sm">Prisforslag: {(a.price_cents/100).toFixed(0)} kr</div> : null}
              {a.message ? <div className="text-sm text-gray-700">{a.message}</div> : null}
              <div className="text-xs text-gray-500 mt-1">{new Date(a.created_at).toLocaleString('no-NO')}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/messages?to=${a.applicant}`} className="bg-blue-600 text-white rounded px-3 py-1">Send melding</Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}



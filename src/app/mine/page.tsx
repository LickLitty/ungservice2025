'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any | null>(null)
  const [applicants, setApplicants] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('jobs').select('*').eq('owner', user.id).order('created_at', { ascending: false })
      setJobs(data || [])
    }
    load()
  }, [])

  const openJob = async (job: any) => {
    setSelectedJob(job)
    const { data } = await supabase.from('applications').select('id, applicant, message, price_cents, created_at').eq('job_id', job.id)
    // Map applicants to profiles
    const mapped = await Promise.all((data || []).map(async (a) => {
      const p = await supabase.from('profiles').select('id, full_name, phone').eq('id', a.applicant).single()
      return { ...a, profile: p.data }
    }))
    setApplicants(mapped)
  }

  const accept = async (appId: string) => {
    await supabase.from('applications').update({ status: 'accepted' }).eq('id', appId)
    setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: 'accepted' } : a))
  }

  const reject = async (appId: string) => {
    await supabase.from('applications').update({ status: 'rejected' }).eq('id', appId)
    setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a))
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h1 className="text-2xl font-bold mb-2">Mine oppdrag</h1>
        <div className="space-y-2">
          {jobs.map(j => (
            <button key={j.id} className={`w-full text-left border rounded p-3 ${selectedJob?.id===j.id?'bg-gray-50':''}`} onClick={()=>openJob(j)}>
              <div className="font-semibold">{j.title}</div>
              <div className="text-sm text-gray-600">{new Date(j.created_at).toLocaleString()}</div>
            </button>
          ))}
          {jobs.length===0 && <div>Ingen oppdrag enda.</div>}
        </div>
      </div>
      <div>
        {selectedJob ? (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Søkere / interesserte</h2>
            {applicants.length===0 && <div>Ingen enda.</div>}
            {applicants.map(a => (
              <div key={a.id} className="border rounded p-3 bg-white">
                <div className="font-medium">{a.profile?.full_name || 'Uten navn'}{a.profile?.phone ? ` · ${a.profile.phone}` : ''}</div>
                {a.price_cents ? <div className="text-sm">Prisforslag: {(a.price_cents/100).toFixed(0)} kr</div> : null}
                {a.message ? <div className="text-sm text-gray-700">{a.message}</div> : null}
                <div className="mt-2 flex gap-2">
                  <button className="bg-green-600 text-white rounded px-3 py-1" onClick={()=>accept(a.id)}>Aksepter</button>
                  <button className="bg-gray-200 rounded px-3 py-1" onClick={()=>reject(a.id)}>Avslå</button>
                  <a href={`/jobs/${selectedJob.id}/chat`} className="underline">Åpne chat</a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>Velg et oppdrag for å se søkere.</div>
        )}
      </div>
    </div>
  )
}



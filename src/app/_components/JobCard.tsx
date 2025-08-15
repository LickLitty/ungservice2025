'use client'
type Props = {
  job: any
}

export default function JobCard({ job }: Props) {
  const price = job.price_cents ? (job.price_cents / 100).toFixed(0) : null
  const subtitle = [job.category || 'Annet', job.owner_name || 'Ukjent oppdragsgiver']
    .filter(Boolean)
    .join(' · ')
  return (
    <a href={`/jobs/${job.id}`} className="block rounded-xl border bg-white hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-snug line-clamp-2">{job.title}</h3>
          <div className="shrink-0 rounded-full bg-green-50 text-green-700 px-3 py-1 text-sm font-semibold">
            {price ? `${price} kr${job.price_type === 'hourly' ? '/time' : ''}` : '–'}
          </div>
        </div>
        <div className="mt-1 text-sm text-gray-600">{subtitle}</div>
        <div className="mt-1 text-sm text-gray-700 line-clamp-2">{job.description}</div>
        <div className="mt-3 flex gap-2 text-xs text-gray-600">
          {job.location ? <span className="inline-flex items-center gap-1">📍 {job.location}</span> : null}
          {job.requires_car ? <span className="inline-flex items-center gap-1">🚗 Bil</span> : null}
          {job.requires_tools && job.requires_tools !== 'no' ? <span className="inline-flex items-center gap-1">🧰 Utstyr</span> : null}
        </div>
      </div>
    </a>
  )
}



'use client'
import Link from 'next/link'

type Props = {
  job: any
}

export default function JobCard({ job }: Props) {
  const price = job.price_cents ? (job.price_cents / 100).toFixed(0) : null
  const subtitle = [job.category || 'Annet', job.owner_name || 'Ukjent oppdragsgiver']
    .filter(Boolean)
    .join(' • ')
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'I dag'
    if (diffDays === 2) return 'I går'
    if (diffDays <= 7) return `${diffDays - 1} dager siden`
    return date.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' })
  }

  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden group">
        {/* Header with price */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                {job.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-1">{subtitle}</p>
            </div>
            {price && (
              <div className="shrink-0">
                <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {price} kr{job.price_type === 'hourly' ? '/time' : ''}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {job.description && (
            <p className="text-gray-700 text-sm line-clamp-3 mb-4">
              {job.description}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {job.location && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                📍 {job.location}
              </span>
            )}
            {job.requires_car && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                🚗 Bil påkrevd
              </span>
            )}
            {job.requires_tools && job.requires_tools !== 'no' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                🧰 Utstyr påkrevd
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>📅 {job.created_at ? formatDate(job.created_at) : 'Nylig'}</span>
            <span className="text-blue-600 font-medium group-hover:text-blue-700">
              Se detaljer →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}



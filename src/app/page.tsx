"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import SearchBar from './_components/SearchBar'
import CategoryNav from './_components/CategoryNav'
import JobCard from './_components/JobCard'

type Job = {
  id: string
  title: string
  price_cents: number | null
  address: string | null
  status: string
  category?: string | null
  price_type?: 'hourly' | 'fixed'
  description?: string
  location?: string
  requires_car?: boolean
  requires_tools?: string
  owner_name?: string
  created_at?: string
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [priceType, setPriceType] = useState('')
  const [location, setLocation] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true)
      let query = supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        
        if (category) query = query.eq('category', category)
        if (priceType) query = query.eq('price_type', priceType as any)
        if (location) query = query.ilike('location', `%${location}%`)
        if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
        
        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching jobs:', error)
        } else {
          setJobs(data || [])
        }
        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        setLoading(false)
      }
    }
    
    loadJobs()
  }, [category, priceType, location, q])

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            Finn småjobber i ditt område
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Gressklipp, snekring, flyttehjelp og mer. Enkelt å finne og tilby oppdrag.
          </p>
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
            <SearchBar q={q} onChange={setQ} />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Populære kategorier</h2>
        <CategoryNav value={category} onChange={setCategory} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Filtrer oppdrag</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={category} 
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">Alle kategorier</option>
              <option value="Gressklipp">Gressklipp</option>
              <option value="Snekring">Snekring</option>
              <option value="Flyttehjelp">Flyttehjelp</option>
              <option value="Snømåking">Snømåking</option>
              <option value="Vask">Vask</option>
              <option value="Annet">Annet</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pristype</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={priceType} 
              onChange={e => setPriceType(e.target.value)}
            >
              <option value="">Alle pristyper</option>
              <option value="fixed">Fastpris</option>
              <option value="hourly">Timebetalt</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sted</label>
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="F.eks. Oslo, Bergen..."
              value={location} 
              onChange={e => setLocation(e.target.value)}
            />
          </div>
          
          <div className="flex items-end">
            <button 
              onClick={() => {
                setCategory('')
                setPriceType('')
                setLocation('')
                setQ('')
              }}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Nullstill filtre
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {loading ? 'Laster oppdrag...' : `${jobs.length} oppdrag funnet`}
          </h2>
          {jobs.length > 0 && (
            <div className="text-sm text-gray-600">
              Sortert etter nyeste først
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ingen oppdrag funnet</h3>
            <p className="text-gray-600 mb-6">
              Prøv å endre søkekriteriene eller legg ut ditt eget oppdrag.
            </p>
            <a 
              href="/jobs/new" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Legg ut oppdrag
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

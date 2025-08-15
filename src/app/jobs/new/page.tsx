'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewJob() {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [priceType, setPriceType] = useState<'fixed' | 'hourly'>('fixed')
  const [location, setLocation] = useState('')
  const [requiresCar, setRequiresCar] = useState(false)
  const [requiresTools, setRequiresTools] = useState('no')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase().auth.getUser()
      if (!user) {
        alert('Du må være logget inn for å legge ut oppdrag')
        return
      }

      // Sjekk om bruker har profil, opprett hvis ikke
      const { data: profile } = await supabase()
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Opprett profil hvis den ikke eksisterer
        const { error: profileError } = await supabase()
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
          alert('Feil ved oppretting av profil. Prøv å logge ut og inn igjen.')
          return
        }
      }

      const { error } = await supabase().from('jobs').insert({
        title: title.trim(),
        description: description.trim(),
        category: category || 'Annet',
        price_cents: price ? Math.round(parseFloat(price) * 100) : null,
        price_type: priceType,
        location: location.trim() || null,
        requires_car: requiresCar,
        requires_tools: requiresTools,
        owner: user.id,
        status: 'open'
      })

      if (error) {
        alert('Feil ved oppretting av oppdrag: ' + error.message)
      } else {
        alert('Oppdrag opprettet!')
        router.push('/')
      }
    } catch (error) {
      alert('En feil oppstod')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border p-8">
        <h1 className="text-3xl font-bold mb-6">Legg ut nytt oppdrag</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tittel på oppdraget *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="F.eks. Hjelp til gressklipp"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beskrivelse *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv oppdraget i detalj..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Velg kategori</option>
                <option value="Gressklipp">Gressklipp</option>
                <option value="Snekring">Snekring</option>
                <option value="Flyttehjelp">Flyttehjelp</option>
                <option value="Snømåking">Snømåking</option>
                <option value="Vask">Vask</option>
                <option value="Annet">Annet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sted
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="F.eks. Oslo, Bergen..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pris (valgfritt)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="F.eks. 500"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pristype
              </label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as 'fixed' | 'hourly')}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fixed">Fastpris</option>
                <option value="hourly">Timebetalt</option>
              </select>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Krav</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requiresCar"
                checked={requiresCar}
                onChange={(e) => setRequiresCar(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requiresCar" className="ml-2 text-sm text-gray-700">
                Bil påkrevd
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Utstyr påkrevd
              </label>
              <select
                value={requiresTools}
                onChange={(e) => setRequiresTools(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="no">Ingen spesielt utstyr</option>
                <option value="some">Grunnleggende verktøy</option>
                <option value="yes">Spesialutstyr</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? 'Oppretter oppdrag...' : 'Legg ut oppdrag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}



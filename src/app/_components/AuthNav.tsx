'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AuthNav() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <Link 
          href="/profile" 
          className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
        >
          Min profil
        </Link>
        <button
          onClick={signOut}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Logg ut
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      <Link 
        href="/login" 
        className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
      >
        Logg inn
      </Link>
      <Link 
        href="/register" 
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Registrer deg
      </Link>
    </div>
  )
}



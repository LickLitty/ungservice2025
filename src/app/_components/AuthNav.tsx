'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AuthNav() {
  const [isAuthed, setIsAuthed] = useState<boolean>(false)

  useEffect(() => {
    const sb = supabase()
    sb.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  const logout = async () => {
    await supabase().auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="ml-auto flex items-center gap-3">
      {isAuthed ? (
        <>
          <Link href="/profile" className="text-gray-900">Min profil</Link>
          <button onClick={logout} className="text-gray-900 underline">Logg ut</button>
        </>
      ) : (
        <>
          <Link href="/login" className="text-gray-900">Logg inn</Link>
          <Link href="/register" className="text-gray-900">Registrer deg</Link>
        </>
      )}
    </div>
  )
}



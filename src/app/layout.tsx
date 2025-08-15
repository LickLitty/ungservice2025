import './globals.css'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import AuthNav from './_components/AuthNav'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Jobbapp',
  description: 'Enkel småjobb-app (MVP)'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-10">
          <nav className="max-w-6xl mx-auto p-4 flex gap-6 text-base items-center">
            <Link href="/" className="font-semibold text-gray-900 mr-2">Ung Utehjelp</Link>
            <Link href="/" className="text-gray-900">Oppdrag</Link>
            <Link href="/jobs/new" className="text-gray-900">Nytt oppdrag</Link>
            <Link href="/notifications" className="text-gray-900">Varsler</Link>
            <Link href="/mine" className="text-gray-900">Mine oppdrag</Link>
            <AuthNav />
          </nav>
        </header>
        <main className="max-w-6xl mx-auto p-4">{children}</main>
      </body>
    </html>
  )
}

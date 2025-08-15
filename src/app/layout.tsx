import './globals.css'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import AuthNav from './_components/AuthNav'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ung Utehjelp - Finn småjobber og oppdrag',
  description: 'Finn og tilby småjobber i ditt område. Gressklipp, snekring, flyttehjelp og mer.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto">
            {/* Top bar */}
            <div className="bg-blue-600 text-white py-2">
              <div className="max-w-7xl mx-auto px-4 text-sm text-center">
                🎉 Nytt! Opprett gratis profil og start å tjene penger på småjobber
              </div>
            </div>
            
            {/* Main navigation */}
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                {/* Logo and main nav */}
                <div className="flex items-center space-x-8">
                  <Link href="/" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">U</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900">Ung Utehjelp</span>
                  </Link>
                  
                  <nav className="hidden md:flex items-center space-x-6">
                    <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">Finn oppdrag</Link>
                    <Link href="/jobs/new" className="text-gray-700 hover:text-blue-600 font-medium">Legg ut oppdrag</Link>
                    <Link href="/mine" className="text-gray-700 hover:text-blue-600 font-medium">Mine oppdrag</Link>
                    <Link href="/notifications" className="text-gray-700 hover:text-blue-600 font-medium">Varsler</Link>
                  </nav>
                </div>
                
                {/* Auth and actions */}
                <div className="flex items-center space-x-4">
                  <AuthNav />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Ung Utehjelp</h3>
                <p className="text-gray-300 text-sm">
                  Finn og tilby småjobber i ditt område. Trygt, enkelt og raskt.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Kategorier</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li><a href="/?category=Gressklipp" className="hover:text-white">Gressklipp</a></li>
                  <li><a href="/?category=Snekring" className="hover:text-white">Snekring</a></li>
                  <li><a href="/?category=Flyttehjelp" className="hover:text-white">Flyttehjelp</a></li>
                  <li><a href="/?category=Snømåking" className="hover:text-white">Snømåking</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Hjelp</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li><a href="#" className="hover:text-white">Slik fungerer det</a></li>
                  <li><a href="#" className="hover:text-white">Sikkerhet</a></li>
                  <li><a href="#" className="hover:text-white">Kontakt oss</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Juridisk</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li><a href="#" className="hover:text-white">Personvern</a></li>
                  <li><a href="#" className="hover:text-white">Vilkår</a></li>
                  <li><a href="#" className="hover:text-white">Cookies</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
              © 2025 Ung Utehjelp. Alle rettigheter forbeholdt.
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

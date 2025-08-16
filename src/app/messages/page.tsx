import MessagesClient from './MessagesClient'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<div>Laster meldinger…</div>}>
      <MessagesClient />
    </Suspense>
  )
}



'use client'
type Props = {
  q: string
  onChange: (v: string) => void
}

export default function SearchBar({ q, onChange }: Props) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-2 rounded-full border bg-white px-4 py-3 shadow-sm">
        <span>🔎</span>
        <input
          value={q}
          onChange={(e)=>onChange(e.target.value)}
          placeholder="Søk etter oppdrag, kategori eller sted"
          className="flex-1 outline-none"
        />
      </div>
    </div>
  )
}



'use client'
type Props = {
  value: string
  onChange: (v: string) => void
}

const CATS = ['Gressklipp','Snekring','Flyttehjelp','Snømåking','Vask','Annet']

export default function CategoryNav({ value, onChange }: Props) {
  return (
    <div className="max-w-5xl mx-auto flex flex-wrap gap-2 mt-4">
      <button onClick={()=>onChange('')} className={`px-3 py-1 rounded-full border ${value===''?'bg-gray-900 text-white':'bg-white'}`}>Alle</button>
      {CATS.map(c => (
        <button key={c} onClick={()=>onChange(c)} className={`px-3 py-1 rounded-full border ${value===c?'bg-gray-900 text-white':'bg-white'}`}>{c}</button>
      ))}
    </div>
  )
}



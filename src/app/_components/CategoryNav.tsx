'use client'

type Props = {
  value: string
  onChange: (value: string) => void
}

const categories = [
  { id: '', name: 'Alle', icon: '🏠' },
  { id: 'Gressklipp', name: 'Gressklipp', icon: '🌱' },
  { id: 'Snekring', name: 'Snekring', icon: '🔨' },
  { id: 'Flyttehjelp', name: 'Flyttehjelp', icon: '📦' },
  { id: 'Snømåking', name: 'Snømåking', icon: '❄️' },
  { id: 'Vask', name: 'Vask', icon: '🧽' },
  { id: 'Annet', name: 'Annet', icon: '🔧' }
]

export default function CategoryNav({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(category.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
            value === category.id
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
          }`}
        >
          <span className="text-lg">{category.icon}</span>
          <span className="font-medium">{category.name}</span>
        </button>
      ))}
    </div>
  )
}



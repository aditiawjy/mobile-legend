import { useRouter } from 'next/router'

export default function EditNav({ active }) {
  const router = useRouter()

  const btn = (label, path, isActive) => (
    <button
      onClick={() => router.push(path)}
      className={`text-sm inline-flex items-center gap-1 px-3 py-1.5 rounded-md border ${
        isActive ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )

  return (
    <nav className="flex items-center gap-2">
      {btn('Edit Hero Info', '/edit-hero-info', active === 'hero-info')}
      {btn('Edit Skills', '/edit-skills', active === 'skills')}
      {btn('Edit Items', '/edit-items', active === 'items')}
    </nav>
  )
}

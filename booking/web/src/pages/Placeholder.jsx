import { useEffect } from 'react'

/**
 * Halaman sementara buat ngepet routing.
 * Tiap rute diganti komponen aslinya pas masuk tahap masing-masing.
 */
export default function Placeholder({ title, desc }) {
  useEffect(() => {
    document.title = `${title} | App InDeep Booking`
  }, [title])

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="card w-full p-8">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="mt-3 text-gray-600">{desc}</p>
        <p className="mt-2 text-sm text-gray-400">Halaman ini menyusul di tahap berikutnya.</p>
      </div>
    </main>
  )
}

'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Cat { id:string; name:string; description?:string; threads?:number; posts?:number }

export default function CategoryClient ({ categoryId }: { categoryId: string }) {
  const [threads, setThreads] = useState<Cat[]>([])
  const [err, setErr]       = useState(false)

  useEffect(() => {
    fetch(`/api/forums/${categoryId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => Array.isArray(d) ? setThreads(d) : setErr(true))
      .catch(() => setErr(true))
  }, [categoryId])

  if (err) return <p>Couldn’t load threads.</p>

  return (
    <table className="table table-dark table-hover">
      <thead><tr><th>Thread</th><th>Posts</th></tr></thead>
      <tbody>
        {threads.map(t => (
          <tr key={t.id}>
            <td><Link href={`/forums/${categoryId}/${t.id}`}>{t.name}</Link></td>
            <td>{t.posts ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

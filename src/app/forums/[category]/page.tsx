'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ThreadSummary {
  id: string
  title: string
  author: string
  replies: number
  lastReplyTime: string
}

export default function ForumCategoryPage(props: any) {
  const { category } = props.params
  const [threads, setThreads] = useState<ThreadSummary[]>([])

  useEffect(() => {
    fetch(`/api/forums/${category}/threads`)
      .then(res => res.json())
      .then((data: ThreadSummary[]) => setThreads(data))
  }, [category])

  return (
    <main className="container py-4">
      <Link href="/forums" className="mb-3 d-block">← Back to forums</Link>
      <h2>Threads in {category}</h2>
      <table className="table table-dark table-hover">
        <thead>
          <tr>
            <th>Thread</th>
            <th>Author</th>
            <th>Replies</th>
            <th>Last Post</th>
          </tr>
        </thead>
        <tbody>
          {threads.map(t => (
            <tr key={t.id}>
              <td>
                <Link
                  href={`/forums/${category}/${t.id}`}
                  className="text-decoration-none text-light"
                >
                  {t.title}
                </Link>
              </td>
              <td>{t.author}</td>
              <td>{t.replies}</td>
              <td>{t.lastReplyTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}

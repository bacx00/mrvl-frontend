'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ForumCategory {
  id: string
  name: string
  description: string
  threads: number
  posts: number
}

export default function ForumHomePage () {
  const [categories, setCategories] = useState<ForumCategory[]>([])

  useEffect(() => {
    fetch('/api/forums/categories')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setCategories(d) : setCategories([]))
      .catch(() => setCategories([]))
  }, [])

  return (
    <main className="container py-4">
      <h1>Forums</h1>
      <div className="list-group">
        {categories.map(c => (
          <Link key={c.id}
                href={`/forums/${c.id}`}
                className="list-group-item list-group-item-action bg-dark text-light mb-2">
            <h5 className="mb-1">{c.name}</h5>
            <p className="mb-1">
              {c.description} – <small>{c.threads} threads, {c.posts} posts</small>
            </p>
          </Link>
        ))}
        {categories.length === 0 && <p>No categories yet.</p>}
      </div>
    </main>
  )
}

'use client'
export const dynamic = 'force-dynamic'

import ThreadClient from '@/components/ThreadClient'
import Link from 'next/link'

export default function ForumThreadPage(props: any) {
  const { category, thread } = props.params

  return (
    <main className="container py-4">
      <Link href={`/forums/${category}`} className="mb-3 d-block">
        ← Back to threads
      </Link>
      <ThreadClient categoryId={category} threadId={thread} />
    </main>
  )
}

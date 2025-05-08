'use client';

import { useEffect, useState } from 'react';
import PostCard, { Post } from '@/components/PostCard';
import RichTextEditor from '@/components/RichTextEditor';

export default function ThreadClient({
  categoryId,
  threadId,
}: {
  categoryId: string;
  threadId: string;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    fetch(`/api/forum/${categoryId}/threads/${threadId}`, {
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((data: Post[]) => setPosts(data));
  }, [categoryId, threadId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Submit logic not wired up yet');
    setNewContent('');
  };

  return (
    <main className="container py-4">
      <h1 className="mb-4">Thread: {threadId}</h1>

      <section>
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </section>

      <section className="mt-5">
        <h3>Your Reply</h3>
        <form onSubmit={handleSubmit}>
          <RichTextEditor value={newContent} onChange={setNewContent} />
          <button className="btn btn-primary mt-2">Post Reply</button>
        </form>
      </section>
    </main>
  );
}

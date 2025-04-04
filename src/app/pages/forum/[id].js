import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export async function getServerSideProps(context) {
  const { id } = context.params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/forum/threads/${id}`);
  const thread = await res.json();
  return { props: { thread } };
}

export default function ThreadDetailPage({ thread }) {
  const router = useRouter();
  const [posts, setPosts] = useState(thread.posts);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (storedUser && token) {
        setIsLoggedIn(true);
        setCurrentUser(JSON.parse(storedUser));
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/forum/threads/${thread.id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to post');
      } else {
        // Append new post to list
        const newPost = {
          id: data.post_id,
          content: content,
          user: { id: currentUser.id, name: currentUser.name },
          created_at: new Date().toISOString()
        };
        setPosts([...posts, newPost]);
        setContent('');
      }
    } catch (err) {
      console.error('Error posting reply', err);
      setError('Failed to post');
    }
  };

  return (
    <div>
      <h2>{thread.title}</h2>
      <p className="text-muted">
        Started by {thread.user.name} on {new Date(thread.created_at).toLocaleString()}
      </p>
      <div className="mb-4">
        {posts.map(post => (
          <div key={post.id} className="mb-3">
            <div className="fw-bold">{post.user.name}</div>
            <p>{post.content}</p>
            <div className="text-muted small">
              {new Date(post.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      {isLoggedIn ? (
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="mb-3">
            <label className="form-label">Your Message</label>
            <textarea 
              className="form-control" 
              rows="3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary">Post Reply</button>
        </form>
      ) : (
        <p>
          <Link href="/auth/login" className="btn btn-outline-primary">Login to post a reply</Link>
        </p>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function NewThreadPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/auth/login');
      }
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/forum/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ title, content })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to create thread');
      } else {
        router.push(`/forum/${data.thread_id}`);
      }
    } catch (err) {
      console.error('Error creating thread', err);
      setError('Failed to create thread');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <h2>Start a New Thread</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input 
              type="text" 
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Content</label>
            <textarea 
              className="form-control" 
              rows="5"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary">Create Thread</button>
        </form>
      </div>
    </div>
  );
}
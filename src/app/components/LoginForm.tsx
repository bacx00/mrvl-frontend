'use client';
import { useState, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const { login } = useContext(AuthContext);
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState<string| null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      const data = await res.json();
      login(data.user, data.token);  // assuming API returns user info and token
      router.push('/');  // redirect to home after login
    } else {
      const err = await res.json();
      setError(err.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card card-body bg-dark text-light">
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="mb-3">
        <label className="form-label">Username</label>
        <input name="username" type="text" className="form-control" value={form.username} onChange={handleChange} required />
      </div>
      <div className="mb-3">
        <label className="form-label">Password</label>
        <input name="password" type="password" className="form-control" value={form.password} onChange={handleChange} required />
      </div>
      <button type="submit" className="btn btn-primary w-100">Log In</button>
    </form>
  );
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    let currentUser = stored ? JSON.parse(stored) : null;
    if (!currentUser || !(currentUser.roles || []).includes('admin')) {
      router.replace('/');
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to fetch stats', err));
  }, [router]);

  return (
    <div>
      <h2>Admin Dashboard</h2>
      {stats ? (
        <div className="row">
          <div className="col-md-4 mb-3">
            <div className="card"><div className="card-body">
              <h5 className="card-title">Users</h5>
              <p className="card-text">{stats.users}</p>
            </div></div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card"><div className="card-body">
              <h5 className="card-title">Threads</h5>
              <p className="card-text">{stats.threads}</p>
            </div></div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card"><div className="card-body">
              <h5 className="card-title">Posts</h5>
              <p className="card-text">{stats.posts}</p>
            </div></div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card"><div className="card-body">
              <h5 className="card-title">Matches</h5>
              <p className="card-text">{stats.matches}</p>
            </div></div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card"><div className="card-body">
              <h5 className="card-title">Events</h5>
              <p className="card-text">{stats.events}</p>
            </div></div>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}

      <h3 className="mt-4">User Management</h3>
      <p>
        <a href="/admin/users" className="btn btn-secondary">Manage Users</a>
      </p>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    const currentUser = stored ? JSON.parse(stored) : null;
    if (!currentUser || !(currentUser.roles || []).includes('admin')) {
      router.replace('/');
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Failed to fetch users', err));
  }, [router]);

  const handleRoleToggle = async (userId, currentRole) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => (u.id === userId ? updatedUser : u)));
      } else {
        console.error('Failed to update role');
      }
    } catch (err) {
      console.error('Error updating role', err);
    }
  };

  return (
    <div>
      <h2>Manage Users</h2>
      <table className="table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.roles.join(', ')}</td>
              <td>
                {u.roles.includes('admin') ? (
                  <button className="btn btn-sm btn-danger"
                          onClick={() => handleRoleToggle(u.id, 'admin')}>
                    Revoke Admin
                  </button>
                ) : (
                  <button className="btn btn-sm btn-success"
                          onClick={() => handleRoleToggle(u.id, 'user')}>
                    Make Admin
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
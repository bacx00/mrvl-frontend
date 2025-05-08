// src/app/admin/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useContext, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.replace('/auth/login');
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return <div className="container py-4">Redirecting to login…</div>;
  }

  return (
    <main className="container py-4">
      <h1>Admin Dashboard</h1>
      <p>
        Welcome, <strong>{user.username}</strong>. You have <strong>admin</strong> privileges.
      </p>
      {/* Add your admin widgets here */}
    </main>
  );
}

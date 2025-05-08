'use client';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="container py-5" style={{ maxWidth: 460 }}>
      <h1 className="mb-4 text-center">Log in</h1>
      <LoginForm />
    </main>
  );
}

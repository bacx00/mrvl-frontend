// src/app/_not-found/page.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ padding: '4rem', textAlign: 'center' }}>
      <h1>404 – Page Not Found</h1>
      <p>Sorry, we couldn’t find the page you requested.</p>
      <Link href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
        Go back home
      </Link>
    </main>
  );
}

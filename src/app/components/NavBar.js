import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const NavBar = () => {
  const router = useRouter();
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserName(user.name);
    }
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token }
        });
      } catch {}
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserName(null);
    router.push('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link href="/" className="navbar-brand">MRVL Esports</Link>
        <ul className="navbar-nav me-auto">
          <li className="nav-item"><Link href="/forum" className="nav-link">Forum</Link></li>
          <li className="nav-item"><Link href="/matches" className="nav-link">Matches</Link></li>
          <li className="nav-item"><Link href="/rankings" className="nav-link">Rankings</Link></li>
        </ul>
        <ul className="navbar-nav">
          {userName ? (
            <>
              <li className="nav-item">
                <span className="navbar-text me-2">Hello, {userName}</span>
              </li>
              <li className="nav-item">
                <a href="#" onClick={handleLogout} className="nav-link">Logout</a>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item"><Link href="/auth/login" className="nav-link">Login</Link></li>
              <li className="nav-item"><Link href="/auth/register" className="nav-link">Register</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
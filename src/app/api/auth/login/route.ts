import { NextResponse } from 'next/server';

const users = [
  { username: 'admin', password: 'adminpass', role: 'admin' },
  { username: 'editor', password: 'editorpass', role: 'editor' },
  { username: 'user', password: 'userpass', role: 'user' },
];

export async function POST(request: Request) {
  const { username, password } = await request.json();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  return NextResponse.json({ username: user.username, role: user.role });
}

import { NextResponse } from 'next/server';

const users: Array<{ username: string; password: string; role: string }> = [];

export async function POST(request: Request) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Username & password required' }, { status: 400 });
  }
  if (users.find(u => u.username === username)) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }
  users.push({ username, password, role: 'user' });
  return NextResponse.json({ username, role: 'user' }, { status: 201 });
}

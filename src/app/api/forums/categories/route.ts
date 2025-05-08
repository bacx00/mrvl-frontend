import { NextResponse } from 'next/server'

// mock for now – replace with DB call later
export async function GET () {
  return NextResponse.json([
    { id: 'general',       name: 'General Discussion', description: 'Anything goes',      threads: 42,  posts: 9001 },
    { id: 'patch-notes',   name: 'Patch Notes',        description: 'Official changes',   threads: 18,  posts: 512  },
    { id: 'memes',         name: 'Memes & Highlights', description: 'Have some laughs',   threads: 27,  posts: 321  }
  ])
}

import { NextResponse } from 'next/server'

export async function GET () {
  // return a subset of popular categories
  return NextResponse.json([
    { id: 'general',     name: 'General Discussion',   posts: 1234 },
    { id: 'patch-notes', name: 'Patch Notes',          posts: 845  },
    { id: 'memes',       name: 'Memes & Highlights',   posts: 432  }
  ])
}

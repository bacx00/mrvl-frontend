// src/app/forums/[category]/[thread]/page.tsx - VLR.gg Quality Thread Wrapper
'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ThreadClient from '@/components/ThreadClient';

export default function ForumThreadPage() {
  const { category, thread } = useParams();

  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* Quick Navigation */}
      <div className="bg-[#1a242d] border-b border-[#2b3d4d]">
        <div className="container mx-auto py-3">
          <div className="flex items-center text-sm text-[#768894]">
            <Link href="/" className="hover:text-[#fa4454] transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/forums" className="hover:text-[#fa4454] transition-colors">Forums</Link>
            <span className="mx-2">/</span>
            <Link 
              href={`/forums/${category}`} 
              className="hover:text-[#fa4454] transition-colors capitalize"
            >
              {String(category).replace('-', ' ')}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Thread</span>
          </div>
          
          <Link 
            href={`/forums/${category}`}
            className="inline-flex items-center text-[#fa4454] hover:underline mt-2 text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {String(category).replace('-', ' ')} threads
          </Link>
        </div>
      </div>

      {/* Thread Content */}
      <div className="container mx-auto py-6">
        <ThreadClient 
          categoryId={category as string} 
          threadId={thread as string} 
        />
      </div>
    </div>
  );
}

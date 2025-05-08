// src/app/components/PostCard.tsx
import React from "react";

export interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <div className="card mb-3 bg-dark text-light">
      <div className="card-header">
        {post.author} —{" "}
        <small>{new Date(post.timestamp).toLocaleString()}</small>
      </div>
      <div className="card-body">
        <p className="card-text">{post.content}</p>
      </div>
    </div>
  );
}

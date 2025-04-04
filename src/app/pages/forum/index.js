import Link from 'next/link';

export async function getServerSideProps() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/forum/threads`);
  const threads = await res.json();
  return { props: { threads } };
}

export default function ForumIndexPage({ threads }) {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <h2>Forum Threads</h2>
        <Link href="/forum/new" className="btn btn-primary">New Thread</Link>
      </div>
      <ul className="list-group">
        {threads.map(thread => (
          <li key={thread.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <Link href={`/forum/${thread.id}`} className="fw-bold">{thread.title}</Link>
              <div className="small text-muted">
                Started by {thread.user.name} on {new Date(thread.created_at).toLocaleString()}
              </div>
            </div>
            <span className="badge bg-secondary rounded-pill">{thread.posts_count} posts</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
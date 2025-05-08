import Link from 'next/link';

export default function NewsCard({ article }: { article: any }) {
  return (
    <div className="card bg-dark text-light h-100">
      {article.image && <img src={article.image} className="card-img-top" alt={article.title} />}
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{article.title}</h5>
        <p className="card-text flex-grow-1">{article.excerpt}</p>
        <Link href={`/news/${article.id}`} className="btn btn-outline-primary mt-auto">Read More</Link>
      </div>
    </div>
  );
}

export default function StatsCard({ title, value }: { title: string, value: number }) {
  return (
    <div className="card bg-secondary text-light text-center">
      <div className="card-body">
        <h4 className="card-title">{value}</h4>
        <p className="card-text">{title}</p>
      </div>
    </div>
  );
}

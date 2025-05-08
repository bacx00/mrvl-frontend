"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";

// Dynamically import the Line chart (no SSR)
const LineChart = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Line),
  { ssr: false }
);

interface StatsResponse {
  months: string[];
  matchesPerMonth: number[];
  totalMatches: number;
  totalPlayers: number;
  totalTournaments: number;
  totalTeams: number;
}

export default function StatsDashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) return <div className="container py-4">Loading statistics…</div>;

  const chartData = {
    labels: stats.months,
    datasets: [
      {
        label: "Matches played",
        data: stats.matchesPerMonth,
        fill: true,
        backgroundColor: "rgba(75,192,192,0.2)",
        borderColor: "rgba(75,192,192,1)",
      },
    ],
  };

  return (
    <main className="container py-4">
      <h1 className="mb-4">Overall Statistics</h1>

      {/* Summary Cards */}
      <div className="row mb-5">
        <div className="col-sm-6 col-lg-3 mb-3">
          <StatsCard title="Total Matches" value={stats.totalMatches} />
        </div>
        <div className="col-sm-6 col-lg-3 mb-3">
          <StatsCard title="Total Players" value={stats.totalPlayers} />
        </div>
        <div className="col-sm-6 col-lg-3 mb-3">
          <StatsCard title="Tournaments" value={stats.totalTournaments} />
        </div>
        <div className="col-sm-6 col-lg-3 mb-3">
          <StatsCard title="Active Teams" value={stats.totalTeams} />
        </div>
      </div>

      {/* Line Chart */}
      <section>
        <h3>Matches per Month</h3>
        <div style={{ maxWidth: 600 }}>
          <LineChart
            data={chartData}
            options={{
              responsive: true,
              plugins: { legend: { display: true } },
            }}
          />
        </div>
      </section>
    </main>
  );
}

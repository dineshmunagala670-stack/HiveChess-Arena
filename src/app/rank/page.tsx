import Link from "next/link";
import { prisma } from "../../lib/prisma";
import LeaderboardDeck from "../../components/LeaderboardDeck";

// Forces Next.js to pull fresh database entries instead of serving stale cached layouts
export const dynamic = "force-dynamic";

export default async function RankPage() {
  // 1. Fetch top 50 human profiles sorted by humanElo
  const topHumans = await prisma.user.findMany({
    orderBy: {
      humanElo: "desc",
    },
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      humanElo: true,
    },
  });

  // 2. Fetch top 50 AI engine profiles sorted by aiElo
  const topBots = await prisma.botProfile.findMany({
    orderBy: {
      aiElo: "desc",
    },
    take: 50,
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 max-w-5xl mx-auto space-y-6">
      {/* Premium Header Navigation Block */}
      <header className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm">
        <div className="space-y-0.5">
          <Link 
            href="/" 
            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 block transition-colors"
          >
            ← Return to Control Deck
          </Link>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Leaderboard Registry</h1>
        </div>
        <div className="text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 text-slate-500">
          Status: <span className="text-emerald-500 font-semibold animate-pulse">Live Matrix</span>
        </div>
      </header>

      {/* Render the interactive presentation layer */}
      <LeaderboardDeck initialHumans={topHumans} initialBots={topBots} />
    </main>
  );
}
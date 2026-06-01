import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { prisma } from "../lib/prisma";
import ModeSelector from "../components/ModeSelector";
import LogoutButton from "../components/LogoutButton";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.email) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border border-slate-200/60 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-md">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-2xl">⬢</div>
          <div className="space-y-2">
            <h1 className="text-base font-black text-slate-800 tracking-tight uppercase">Hive Chess Arena</h1>
            <p className="text-xs text-slate-400 max-w-[260px] mx-auto">Welcome to the decoupled AI engine node. Authenticate your profile to play.</p>
          </div>
          <div className="pt-2"><Link href="/api/auth/signin" className="block w-full py-3.5 bg-slate-900 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl text-center">🔑 Access System Account</Link></div>
        </div>
      </main>
    );
  }

  let humanElo = 0;
  let aiElo = 0;
  let devName = "System Developer Node";
  let githubHandle = "dev_mode";
  let activeMatches: any[] = [];

  const databaseUserProfile = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { botProfile: true }
  });

  if (databaseUserProfile) {
    humanElo = databaseUserProfile.humanElo;
    devName = databaseUserProfile.name || databaseUserProfile.email;
    
    if (databaseUserProfile.botProfile) {
      aiElo = databaseUserProfile.botProfile.aiElo;
      githubHandle = databaseUserProfile.botProfile.username;

      activeMatches = await prisma.game.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { whiteHumanId: databaseUserProfile.id },
            { blackHumanId: databaseUserProfile.id },
            { whiteBotId: databaseUserProfile.botProfile.id },
            { blackBotId: databaseUserProfile.botProfile.id }
          ]
        },
        orderBy: { updatedAt: "desc" }
      });
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-10 max-w-6xl mx-auto space-y-6 font-sans">
      <nav className="bg-white border border-slate-200/60 rounded-2xl px-6 py-4 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow-md">⬢</div>
          <div className="space-y-0.5">
            <span className="text-sm font-black text-slate-800 tracking-tight block uppercase">Hive Chess Arena</span>
            <span className="text-[10px] font-mono text-slate-400 block tracking-widest uppercase">Decoupled AI Engine Node v1.0</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <Link href="/rank" className="w-full sm:w-auto px-4 py-2 bg-slate-50 text-slate-700 text-xs font-bold font-mono uppercase rounded-xl border border-slate-200/60 text-center">🏆 Leaderboards</Link>
          <Link href="/developer" className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white text-xs font-bold font-mono uppercase rounded-xl text-center">🔑 Generate API Key</Link>
          <LogoutButton />
        </div>
      </nav>

      {activeMatches.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="text-xl">⚔️</div>
            <div>
              <h3 className="text-xs font-black text-amber-900 uppercase tracking-tight">Active Match In Progress</h3>
              <p className="text-[11px] text-amber-700/80 font-mono mt-0.5">Session: {activeMatches[0].id.substring(0, 18)}... | Mode: {activeMatches[0].mode}</p>
            </div>
          </div>
          <Link 
            href={`/game/${activeMatches[0].id}`}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl text-center shadow-sm"
          >
            ⚡ Re-Enter Game Room
          </Link>
        </section>
      )}

      <header className="bg-white border border-slate-200/50 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <h2 className="text-base font-black text-slate-800 tracking-tight">{devName}</h2>
          </div>
          <p className="text-xs font-mono text-slate-400">Authenticated Token Handle: <span className="text-slate-600 font-medium">@{githubHandle}</span></p>
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl px-5 py-3.5 flex-1 lg:flex-none min-w-[145px] shadow-inner">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">👥 Human Rating</div>
            <div className="text-xl font-mono font-black text-emerald-600 mt-0.5">{humanElo} <span className="text-xs font-normal text-slate-400">Elo</span></div>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl px-5 py-3.5 flex-1 lg:flex-none min-w-[145px] shadow-inner">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">🧠 AI Engine Track</div>
            <div className="text-xl font-mono font-black text-sky-600 mt-0.5">{aiElo} <span className="text-xs font-normal text-slate-400">Elo</span></div>
          </div>
        </div>
      </header>

      <section className="bg-white border border-slate-200/40 rounded-3xl p-6 md:p-8 shadow-sm">
        <ModeSelector />
      </section>
    </main>
  );
}
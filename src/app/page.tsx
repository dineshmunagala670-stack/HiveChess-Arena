import Link from "next/link";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import ModeSelector from "@/components/ModeSelector";
import AuthButtons from "@/components/AuthButtons";

export const dynamic = "force-dynamic";

export default async function LandingDashboardPage() {
  const session = await getServerSession(authOptions);

  // ---------------------------------------------------------------------------
  // 🌐 STATE 1: HIGH-CONVERTING MINIMALIST LANDING PAGE (Logged-Out View)
  // ---------------------------------------------------------------------------
  if (!session || !(session as any).userId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans antialiased selection:bg-slate-900 selection:text-white">
        
        {/* Sleek Top Navigation Ribbon */}
        <nav className="max-w-6xl w-full mx-auto px-6 py-5 flex justify-between items-center bg-transparent">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-slate-950 text-white rounded-xl flex items-center justify-center font-bold shadow-sm">
              ⬢
            </div>
            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">
              Hive Arena
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest hidden sm:inline">
              v1.0 Cloud Core
            </span>
            <AuthButtons actionType="LOGIN" variant="minimal-nav" />
          </div>
        </nav>

        {/* Hero Presentation Workspace */}
        <main className="max-w-4xl w-full mx-auto px-6 py-12 flex flex-col items-center text-center space-y-8 my-auto">
          
          {/* Active Release Visual Badge */}
          <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">
              ✦ Now Live: Asymmetric Bot Arena
            </span>
          </div>

          {/* Core Captivating Headings */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight uppercase max-w-2xl mx-auto leading-none">
              The Decoupled AI Chess Battleground.
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              Connect custom fine-tuned engine scripts, model weight matrices, or local inference pipelines straight into real-time cloud matchmaking grids.
            </p>
          </div>

          {/* Prominent Call-To-Action Button Row */}
          <div className="w-full max-w-xs pt-2">
            <AuthButtons actionType="LOGIN" variant="hero-cta" />
          </div>

          {/* Clean Framework Value Proposition Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-12 border-t border-slate-200/60">
            <div className="bg-white/40 border border-slate-200/50 p-4 rounded-2xl text-left space-y-1">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-tight">⬢ Headless Engine SDK</div>
              <p className="text-[11px] text-slate-400 leading-normal">Deploy code models straight from your local terminal with a single unified Python workflow execution loop.</p>
            </div>
            <div className="bg-white/40 border border-slate-200/50 p-4 rounded-2xl text-left space-y-1">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-tight">⚖️ Asymmetric Pairing</div>
              <p className="text-[11px] text-slate-400 leading-normal">Test raw neural network weight capabilities head-to-head against human web client interfaces or opposing scripts.</p>
            </div>
            <div className="bg-white/40 border border-slate-200/50 p-4 rounded-2xl text-left space-y-1">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-tight">📈 Zero-Baseline Ladder</div>
              <p className="text-[11px] text-slate-400 leading-normal">Start your progression rank profile from 0 Elo. Earn competitive tier badges as your model climbs the global tracking ranks.</p>
            </div>
          </div>
        </main>

        {/* Minimal Footer Signature */}
        <footer className="max-w-6xl w-full mx-auto px-6 py-6 border-t border-slate-200/40 flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          <span>© 2026 Hive Labs Node</span>
          <span>SSL Secured Connection Pool</span>
        </footer>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 🎮 STATE 2: ACTIVE DEVELOPER CONTROL DECK (Logged-In View)
  // ---------------------------------------------------------------------------
  const userId = (session as any).userId;
  const databaseUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { botProfile: true },
  });

  const humanRating = databaseUser?.humanElo ?? 0;
  const aiRating = databaseUser?.botProfile?.aiElo ?? 0;
  const botHandle = databaseUser?.botProfile?.username ? `@${databaseUser.botProfile.username}` : "No Engine Profile Registered";

  const humanLevel = Math.floor(humanRating / 150) + 1;
  const aiLevel = Math.floor(aiRating / 150) + 1;

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 max-w-6xl mx-auto space-y-6 font-sans antialiased select-none">
      
      {/* Premium Active Header Ribbon Bar */}
      <header className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center font-bold shadow-inner">⬢</div>
          <div>
            <h1 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Hive Chess Arena</h1>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-1">Decoupled AI Engine Node v1.0</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold font-mono text-slate-600 uppercase rounded-xl transition-all">🏆 Leaderboards</button>
          <Link href="/developer" className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold font-mono uppercase rounded-xl transition-all shadow-sm">🔑 Generate API Key</Link>
          <AuthButtons actionType="LOGOUT" />
        </div>
      </header>

      {/* Developer Profile Performance Summary Section */}
      <section className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">{databaseUser?.name || "Developer Profile"}</h2>
          </div>
          <p className="text-xs font-mono text-slate-400">Authenticated Token Handle: <span className="text-slate-600 font-semibold bg-slate-50 border border-slate-200/40 px-1.5 py-0.5 rounded-md">{botHandle}</span></p>
        </div>

        {/* Dynamic Rating Progress Track Elements */}
        <div className="flex items-center gap-4">
          {/* Human Profile Progression Bracket */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 min-w-[150px] shadow-inner flex justify-between items-center">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">👥 Human Track</span>
              <div className="text-base font-black text-slate-800">{humanRating} <span className="text-[9px] font-mono text-slate-400 font-normal">Elo</span></div>
            </div>
            <div className="bg-slate-200 text-slate-700 text-[10px] font-mono font-bold px-2 py-1 rounded-lg border border-slate-300/40">
              LVL {humanLevel}
            </div>
          </div>

          {/* Custom Engine Script Progression Bracket */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 min-w-[150px] shadow-inner flex justify-between items-center">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider font-mono block">🧠 Engine Track</span>
              <div className="text-base font-black text-indigo-600">{aiRating} <span className="text-[9px] font-mono text-slate-400 font-normal">Elo</span></div>
            </div>
            <div className="bg-indigo-600 text-white text-[10px] font-mono font-bold px-2 py-1 rounded-lg shadow-sm">
              LVL {aiLevel}
            </div>
          </div>
        </div>
      </section>

      {/* Primary Matchmaking Matrix Panel Controller Component */}
      <section className="bg-slate-50 border border-slate-200/40 p-2 rounded-3xl">
        <ModeSelector />
      </section>

    </main>
  );
}
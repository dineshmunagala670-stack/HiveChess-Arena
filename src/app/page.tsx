import Link from "next/link";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import ModeSelector from "@/components/ModeSelector";
import AuthButtons from "@/components/AuthButtons"; // Tiny client component for Sign In/Out clicks

export const dynamic = "force-dynamic";

export default async function LandingDashboardPage() {
  const session = await getServerSession(authOptions);

  // ---------------------------------------------------------------------------
  // 🔐 STATE 1: LOGGED-OUT AUTHENTICATION SCREEN (Matches image_fe8de9.png)
  // ---------------------------------------------------------------------------
  if (!session || !(session as any).userId) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans antialiased select-none">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-xl max-w-md w-full text-center space-y-6 transition-all">
          <div className="space-y-2 flex flex-col items-center">
            {/* Unified System Hexagon Node Icon */}
            <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-md font-black text-lg">
              ⬢
            </div>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-widest pt-2">
              Hive Chess Arena
            </h1>
            <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
              Welcome to the decoupled AI engine node. Authenticate your profile to play.
            </p>
          </div>

          {/* Render the secure client-side provider trigger */}
          <AuthButtons actionType="LOGIN" />
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // 🎮 STATE 2: ACTIVE DEVELOPER DASHBOARD (Matches image_ffd09d.png)
  // ---------------------------------------------------------------------------
  const userId = (session as any).userId;

  // Pull fresh user parameters straight from your Supabase database instance
  const databaseUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { botProfile: true },
  });

  const humanRating = databaseUser?.humanElo ?? 1200;
  const aiRating = databaseUser?.botProfile?.aiElo ?? 1200;
  const botHandle = databaseUser?.botProfile?.username 
    ? `@${databaseUser.botProfile.username}` 
    : "No Engine Profile Registered";

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 max-w-6xl mx-auto space-y-6 font-sans antialiased select-none">
      
      {/* 🧭 PREMIUM HEADER RIBBON BAR */}
      <header className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center font-bold shadow-inner">
            ⬢
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">
              Hive Chess Arena
            </h1>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-1">
              Decoupled AI Engine Node v1.0
            </p>
          </div>
        </div>

        {/* Top Control Deck Access Triggers */}
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold font-mono text-slate-600 uppercase rounded-xl transition-all">
            🏆 Leaderboards
          </button>
          <Link 
            href="/developer" 
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold font-mono uppercase rounded-xl transition-all shadow-sm text-center"
          >
            🔑 Generate API Key
          </Link>
          <AuthButtons actionType="LOGOUT" />
        </div>
      </header>

      {/* 👤 DEVELOPER PROFILE BANNER ROW */}
      <section className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
              {databaseUser?.name || "Developer Profile"}
            </h2>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Authenticated Token Handle:{" "}
            <span className="text-slate-600 font-semibold bg-slate-50 border border-slate-200/40 px-1.5 py-0.5 rounded-md">
              {botHandle}
            </span>
          </p>
        </div>

        {/* LIVE RATING METRICS WRAPPERS */}
        <div className="flex items-center gap-4">
          {/* Human Rating Bracket */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 min-w-[130px] shadow-inner space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
              👥 Human Rating
            </span>
            <div className="text-base font-black text-slate-800">
              {humanRating} <span className="text-[10px] font-mono text-slate-400 font-normal">Elo</span>
            </div>
          </div>

          {/* AI Engine Track Bracket */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 min-w-[130px] shadow-inner space-y-1">
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider font-mono block">
              🧠 AI Engine Track
            </span>
            <div className="text-base font-black text-indigo-600">
              {aiRating} <span className="text-[10px] font-mono text-slate-400 font-normal">Elo</span>
            </div>
          </div>
        </div>
      </section>

      {/* 🎮 MAIN MODE SELECTION CONTROLLER COMPONENT */}
      <section className="bg-slate-50 border border-slate-200/40 p-2 rounded-3xl">
        <ModeSelector />
      </section>

    </main>
  );
}
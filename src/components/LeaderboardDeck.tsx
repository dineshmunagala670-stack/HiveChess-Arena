"use client";

import React, { useState } from "react";

interface HumanRow {
  id: string;
  name: string | null;
  email: string;
  humanElo: number;
}

interface BotRow {
  id: string;
  username: string;
  aiElo: number;
  user: {
    name: string | null;
  };
}

interface LeaderboardDeckProps {
  initialHumans: HumanRow[];
  initialBots: BotRow[];
}

export default function LeaderboardDeck({ initialHumans, initialBots }: LeaderboardDeckProps) {
  const [activeTab, setActiveTab] = useState<"HUMAN" | "AI">("HUMAN");

  // Quick helper to render custom podium icons for top ranks
  const renderRankBadge = (index: number) => {
    if (index === 0) return <span className="text-base">🥇</span>;
    if (index === 1) return <span className="text-base">🥈</span>;
    if (index === 2) return <span className="text-base">🥉</span>;
    return <span className="font-mono text-slate-400">#{index + 1}</span>;
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm space-y-6">
      
      {/* Tab Switcher Bar */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4 gap-4 flex-col sm:flex-row">
        <div className="space-y-0.5 text-center sm:text-left">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Standing Indices</h2>
          <p className="text-xs text-slate-400">Global account ratings segmented by human interactions and deployed bots.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("HUMAN")}
            className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "HUMAN" 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            👥 Human Track
          </button>
          <button
            onClick={() => setActiveTab("AI")}
            className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "AI" 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            🧠 AI Engine Matrix
          </button>
        </div>
      </div>

      {/* Leaderboard Grid Table */}
      <div className="overflow-hidden border border-slate-100 rounded-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
              <th className="p-4 text-center w-20">Rank</th>
              <th className="p-4">Identity Handle</th>
              <th className="p-4 text-right pr-8">Authoritative Score</th>
            </tr>
          </thead>
          <tbody>
            {activeTab === "HUMAN" ? (
              initialHumans.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center italic py-8 text-xs text-slate-400 font-sans">No human matches logged yet.</td>
                </tr>
              ) : (
                initialHumans.map((user, idx) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 text-center font-bold">{renderRankBadge(idx)}</td>
                    <td className="p-4 text-xs font-semibold text-slate-700">
                      {user.name || user.email.split("@")[0]}
                    </td>
                    <td className="p-4 text-right pr-8 font-mono font-bold text-emerald-600 text-sm">
                      {user.humanElo} <span className="text-[10px] text-slate-400 font-normal">Elo</span>
                    </td>
                  </tr>
                ))
              )
            ) : (
              initialBots.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center italic py-8 text-xs text-slate-400 font-sans">No AI matching configurations registered.</td>
                </tr>
              ) : (
                initialBots.map((bot, idx) => (
                  <tr key={bot.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 text-center font-bold">{renderRankBadge(idx)}</td>
                    <td className="p-4 text-xs font-semibold text-slate-700">
                      {bot.username} <span className="text-[10px] font-mono font-normal text-slate-400"> (Dev: {bot.user?.name || "External"})</span>
                    </td>
                    <td className="p-4 text-right pr-8 font-mono font-bold text-sky-600 text-sm">
                      {bot.aiElo} <span className="text-[10px] text-slate-400 font-normal">Elo</span>
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
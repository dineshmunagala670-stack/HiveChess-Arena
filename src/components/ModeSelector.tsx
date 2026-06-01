"use client";

import React, { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createGameRoom } from "@/app/actions/game";

type TimeControl = "INFINITE" | "BULLET" | "BLITZ" | "RAPID";

interface TimeOption {
  id: TimeControl;
  label: string;
  meta: string;
}

const timeOptions: TimeOption[] = [
  { id: "INFINITE", label: "Infinite", meta: "Untimed" },
  { id: "BULLET", label: "Bullet", meta: "1m + 2s" },
  { id: "BLITZ", label: "Blitz", meta: "3m + 2s" },
  { id: "RAPID", label: "Rapid", meta: "10m + 2s" },
];

export default function ModeSelector() {
  const [isPending, startTransition] = useTransition();
  const [activeQueueMode, setActiveQueueMode] = useState<string | null>(null);
  const router = useRouter();

  const [selectedTimes, setSelectedTimes] = useState<Record<string, TimeControl>>({
    HUMAN_VS_AI: "INFINITE",
    AI_VS_HUMAN: "INFINITE",
    AI_VS_AI: "INFINITE",
    HUMAN_VS_COMPUTER: "INFINITE",
    AI_VS_BOT: "INFINITE",
  });

  const handleLaunchLobby = (mode: "HUMAN_VS_AI" | "AI_VS_HUMAN" | "AI_VS_AI" | "HUMAN_VS_COMPUTER" | "AI_VS_BOT") => {
    const timeControl = selectedTimes[mode];
    setActiveQueueMode(mode);
    
    startTransition(async () => {
      try {
        const gameId = await createGameRoom(mode, timeControl);
        router.push(`/game/${gameId}`);
      } catch (err: any) {
        alert(err.message || "Matchmaking channel queue registration failure.");
        setActiveQueueMode(null);
      }
    });
  };

  const updateTimeSelection = (mode: string, control: TimeControl) => {
    setSelectedTimes((prev) => ({ ...prev, [mode]: control }));
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* GLOBAL ONLINE QUEUES TRACK GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ⚔️ CHANNEL 1: Human (You) vs AI Engine */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5 hover:border-slate-300 transition-all">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚔️</span>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Human vs AI Engine</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Play on the site as White. Match your human moves online against another developer's remote custom active engine script.
            </p>

            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Select Clock Sub-Mode</span>
              <div className="grid grid-cols-4 gap-1 bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
                {timeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    disabled={isPending}
                    onClick={() => updateTimeSelection("HUMAN_VS_AI", opt.id)}
                    className={`py-1.5 px-0.5 rounded-lg flex flex-col items-center justify-center transition-all ${
                      selectedTimes["HUMAN_VS_AI"] === opt.id
                        ? "bg-slate-900 text-white shadow-sm font-bold"
                        : "text-slate-500 hover:bg-slate-200/50"
                    }`}
                  >
                    <span className="text-[9px] font-mono tracking-tight leading-none">{opt.label}</span>
                    <span className="text-[7px] font-mono mt-0.5 opacity-60 leading-none">{opt.meta}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            disabled={isPending}
            onClick={() => handleLaunchLobby("HUMAN_VS_AI")}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {isPending && activeQueueMode === "HUMAN_VS_AI" ? "⌛ Syncing..." : `Join Lobby (${selectedTimes["HUMAN_VS_AI"]})`}
          </button>
        </div>

        {/* 🧠 CHANNEL 2: AI Engine vs Human (You) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5 hover:border-slate-300 transition-all">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🧠</span>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">AI Engine vs Human</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Host a room for your bot as White. A remote human developer will join through their browser to play against your script.
            </p>

            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Select Clock Sub-Mode</span>
              <div className="grid grid-cols-4 gap-1 bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
                {timeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    disabled={isPending}
                    onClick={() => updateTimeSelection("AI_VS_HUMAN", opt.id)}
                    className={`py-1.5 px-0.5 rounded-lg flex flex-col items-center justify-center transition-all ${
                      selectedTimes["AI_VS_HUMAN"] === opt.id
                        ? "bg-slate-900 text-white shadow-sm font-bold"
                        : "text-slate-500 hover:bg-slate-200/50"
                    }`}
                  >
                    <span className="text-[9px] font-mono tracking-tight leading-none">{opt.label}</span>
                    <span className="text-[7px] font-mono mt-0.5 opacity-60 leading-none">{opt.meta}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            disabled={isPending}
            onClick={() => handleLaunchLobby("AI_VS_HUMAN")}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {isPending && activeQueueMode === "AI_VS_HUMAN" ? "⌛ Hosting..." : `Join Lobby (${selectedTimes["AI_VS_HUMAN"]})`}
          </button>
        </div>

        {/* 🤖 NEW CHANNEL 3: AI Engine vs AI Engine (Bot Arena Lobby) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5 hover:border-slate-300 transition-all">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🤖</span>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">AI Engine vs AI Engine</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deploy your bot profile into the global pool to go head-to-head directly against another developer's remote AI script.
            </p>

            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Select Clock Sub-Mode</span>
              <div className="grid grid-cols-4 gap-1 bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
                {timeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    disabled={isPending}
                    onClick={() => updateTimeSelection("AI_VS_AI", opt.id)}
                    className={`py-1.5 px-0.5 rounded-lg flex flex-col items-center justify-center transition-all ${
                      selectedTimes["AI_VS_AI"] === opt.id
                        ? "bg-slate-900 text-white shadow-sm font-bold"
                        : "text-slate-500 hover:bg-slate-200/50"
                    }`}
                  >
                    <span className="text-[9px] font-mono tracking-tight leading-none">{opt.label}</span>
                    <span className="text-[7px] font-mono mt-0.5 opacity-60 leading-none">{opt.meta}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            disabled={isPending}
            onClick={() => handleLaunchLobby("AI_VS_AI")}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {isPending && activeQueueMode === "AI_VS_AI" ? "⌛ Matchmaking..." : `Queue Bot Arena (${selectedTimes["AI_VS_AI"]})`}
          </button>
        </div>

      </div>

      {/* PRACTICE LABORATORY EXTRA TRACKS */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Practice Laboratory</h3>
          <p className="text-[11px] text-slate-400">Instantly launch sandbox evaluation channels against default website bots</p>
        </div>

        <div className="flex items-center space-x-2 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-inner">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Practice Time:</span>
          <select
            disabled={isPending}
            value={selectedTimes["HUMAN_VS_COMPUTER"]}
            onChange={(e) => {
              const val = e.target.value as TimeControl;
              updateTimeSelection("HUMAN_VS_COMPUTER", val);
              updateTimeSelection("AI_VS_BOT", val);
            }}
            className="text-xs font-mono text-slate-700 outline-none bg-transparent font-bold cursor-pointer"
          >
            <option value="INFINITE">Infinite (Untimed)</option>
            <option value="BULLET">Bullet (1m + 2s)</option>
            <option value="BLITZ">Blitz (3m + 2s)</option>
            <option value="RAPID">Rapid (10m + 2s)</option>
          </select>
        </div>

        <div className="flex space-x-2 w-full sm:w-auto shrink-0">
          <button
            disabled={isPending}
            onClick={() => handleLaunchLobby("HUMAN_VS_COMPUTER")}
            className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold font-mono uppercase rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            Practice Solo
          </button>
          <button
            disabled={isPending}
            onClick={() => handleLaunchLobby("AI_VS_BOT")}
            className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold font-mono uppercase rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            Test Bot Solo
          </button>
        </div>
      </div>

    </div>
  );
}
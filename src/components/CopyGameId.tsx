"use client";

import React, { useState } from "react";

interface CopyGameIdProps {
  gameId: string;
}

export default function CopyGameId({ gameId }: CopyGameIdProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center justify-between gap-3 font-sans">
      <div className="space-y-0.5 min-w-0 flex-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
          Active Environment Session ID
        </span>
        <span className="text-xs font-mono text-slate-600 truncate block select-all">
          {gameId}
        </span>
      </div>
      
      <button
        onClick={handleCopy}
        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-all select-none shadow-sm shrink-0 border border-transparent active:scale-[0.98]
          ${copied 
            ? "bg-emerald-600 text-white" 
            : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
      >
        {copied ? "✓ Copied!" : "📋 Copy ID"}
      </button>
    </div>
  );
}
"use client";

import React from "react";

interface CapturedPiecesProps {
  fen: string;
  side: "WHITE" | "BLACK";
}

export default function CapturedPieces({ fen, side }: CapturedPiecesProps) {
  const baseCounts: Record<string, number> = {
    P: 8, N: 2, B: 2, R: 2, Q: 1,
    p: 8, n: 2, b: 2, r: 2, q: 1
  };

  const pieceSymbols: Record<string, string> = {
    P: "♙", N: "♘", B: "♗", R: "♖", Q: "♕",
    p: "♟", n: "♞", b: "♝", r: "♜", q: "♛"
  };

  const pieceLayout = fen.split(" ")[0] || "";
  const currentCounts: Record<string, number> = {};

  for (const char of pieceLayout) {
    if (baseCounts[char] !== undefined) {
      currentCounts[char] = (currentCounts[char] || 0) + 1;
    }
  }

  const capturedElements: React.ReactNode[] = [];
  const targetKeys = side === "WHITE" ? ["p", "n", "b", "r", "q"] : ["P", "N", "B", "R", "Q"];

  targetKeys.forEach((key) => {
    const totalOriginal = baseCounts[key];
    const totalCurrent = currentCounts[key] || 0;
    const totalCaptured = totalOriginal - totalCurrent;

    for (let i = 0; i < totalCaptured; i++) {
      // 🛠️ FIXED: Swapped .append() out for the correct native .push() method
      capturedElements.push(
        <span key={`${key}-${i}`} className="text-sm font-sans tracking-tighter opacity-75 selection:bg-transparent">
          {pieceSymbols[key]}
        </span>
      );
    }
  });

  return (
    <div className="flex items-center space-x-1 min-h-[20px] px-1 py-0.5 bg-slate-50 border border-slate-200/40 rounded-lg text-slate-500 font-mono text-xs">
      {capturedElements.length > 0 ? (
        <div className="flex items-center gap-0.5 animate-fade-in">{capturedElements}</div>
      ) : (
        <span className="text-[9px] text-slate-300 uppercase tracking-widest font-mono">Clean Sheet</span>
      )}
    </div>
  );
}
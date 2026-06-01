"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
// 🛠️ FIXED: Using absolute path aliasing to bypass relative counting issues
import { abortActiveMatch } from "@/app/actions/game";

interface AbortButtonProps {
  gameId: string;
}

export default function AbortButton({ gameId }: AbortButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAbort = () => {
    if (!confirm("Are you sure you want to terminate this live engine environment match?")) return;
    
    startTransition(async () => {
      await abortActiveMatch(gameId);
      router.push("/");
    });
  };

  return (
    <button
      disabled={isPending}
      onClick={handleAbort}
      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold font-mono uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] w-full text-center"
    >
      {isPending ? "⌛ Terminating..." : "💥 Abort Match"}
    </button>
  );
}
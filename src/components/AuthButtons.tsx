"use client";

import React from "react";
import { signIn, signOut } from "next-auth/react";

interface AuthButtonProps {
  actionType: "LOGIN" | "LOGOUT";
  variant?: "hero-cta" | "minimal-nav";
}

export default function AuthButtons({ actionType, variant }: AuthButtonProps) {
  if (actionType === "LOGIN") {
    if (variant === "minimal-nav") {
      return (
        <button
          onClick={() => signIn("github")}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.98]"
        >
          Sign In
        </button>
      );
    }

    // Default primary high-converting "Get Started" landing block
    return (
      <button
        onClick={() => signIn("github")}
        className="w-full py-3.5 bg-slate-950 hover:bg-slate-850 text-white font-mono font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.99] border border-transparent hover:border-slate-800 text-center select-none"
      >
        🚀 Get Started
      </button>
    );
  }

  // Active secure Logout navigation control node
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.98] select-none"
    >
      🛑 Logout
    </button>
  );
}
"use client";

import React from "react";
import { signIn, signOut } from "next-auth/react";

interface AuthButtonProps {
  actionType: "LOGIN" | "LOGOUT";
}

export default function AuthButtons({ actionType }: AuthButtonProps) {
  if (actionType === "LOGIN") {
    return (
      <button
        onClick={() => signIn("github")}
        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.99] block select-none"
      >
        🔑 Access System Account
      </button>
    );
  }

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold font-mono uppercase rounded-xl transition-all shadow-sm active:scale-[0.98] select-none"
    >
      🛑 Logout
    </button>
  );
}
"use client";

import { signIn } from "next-auth/react";

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn("github", { callbackUrl: "/" })}
      className="neomorphic-interactive w-full py-4 px-6 bg-slate-50 text-slate-800 rounded-xl border border-slate-200/40 shadow-neomorphic active:shadow-neomorphic-inset font-semibold text-sm flex items-center justify-center space-x-3 group"
    >
      <span>Connect GitHub Account</span>
      <span className="transition-transform group-hover:translate-x-1">→</span>
    </button>
  );
}
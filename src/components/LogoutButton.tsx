"use client";

import React from "react";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex-1 sm:flex-none px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold font-mono uppercase tracking-wider rounded-xl border border-rose-200/60 transition-all text-center flex items-center justify-center space-x-1.5 active:scale-[0.99]"
    >
      <span>🛑 Logout</span>
    </button>
  );
}
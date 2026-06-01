export const dynamic = 'force-dynamic';

import React from 'react';

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      {/* Premium Minimalist Neomorphic Loading Frame */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200/40 shadow-neomorphic max-w-sm w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/40 shadow-neomorphic flex items-center justify-center mx-auto animate-spin text-xl text-slate-700">
          ⬢
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-800 tracking-tight">Syncing Node Matrix</h2>
          <p className="text-xs text-slate-400 font-mono">Authenticating cluster handshake credentials...</p>
        </div>
      </div>
    </main>
  );
}
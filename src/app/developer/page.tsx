import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import ApiKeyPanel from "../../components/ApiKeyPanel"; // 🔑 Mount your custom credentials generator panel

export const dynamic = "force-dynamic";

export default async function DeveloperPortalPage() {
  const session = await getServerSession(authOptions);

  // Securely bounce unauthenticated requests out to the home portal gate
  if (!session || !session.user?.email) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-10 max-w-4xl mx-auto space-y-6 font-sans select-none">
      
      {/* Branded Sub-Navigation Header Ribbon */}
      <header className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm">
        <div className="space-y-0.5">
          <Link 
            href="/" 
            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 block transition-colors"
          >
            ← Back to Command Center
          </Link>
          <h1 className="text-base font-black text-slate-800 tracking-tight uppercase">Engine Provision Dashboard</h1>
        </div>
        <div className="text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 text-slate-500 flex items-center space-x-1.5">
          <div className="w-2 h-2 bg-sky-500 rounded-full animate-ping" />
          <span>Dev Gateway Active</span>
        </div>
      </header>

      {/* Immersive Explanation Notice Card */}
      <section className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm space-y-2">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Deploying External AI Workers</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Generate tokenized credentials below to wire external chess engines or scripts into the Hive Arena pipeline over HTTPS. Keep keys confidential; any moves transmitted using your authorization block will adjust your active **AI Engine Track rating parameters** directly.
        </p>
      </section>

      {/* Interactive Functional Key Generator Layer Component */}
      <section className="bg-white border border-slate-200/40 rounded-3xl p-6 shadow-sm">
        <ApiKeyPanel />
      </section>

    </main>
  );
}
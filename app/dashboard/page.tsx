"use client";

import { useState } from "react";
import { syncFluxClientSide } from "@/lib/clientScraper";
import { RefreshCw, ShieldCheck, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await syncFluxClientSide();
      setData(result);
    } catch (err: any) {
      if (err.message === "SESSION_EXPIRED") {
        setError("SESSION_EXPIRED: Please log in to Academia in a new tab first.");
      } else {
        setError("TUNNEL_FAILED: Ensure you are on a stable internet connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-6 md:p-12">
      {/* Background Glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
              <ShieldCheck className="text-blue-500" size={36} /> SRM FLUX
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Authorized Agent: Aarav Walia</p>
          </div>

          <button 
            onClick={handleSync}
            disabled={loading}
            className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all overflow-hidden ${
              loading 
              ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 active:scale-95"
            }`}
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Lock size={20} />}
            <span className="relative z-10">{loading ? "DECRYPTING..." : "SECURE SYNC"}</span>
          </button>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl mb-10 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="text-red-500 shrink-0" size={24} />
            <p className="text-sm font-medium text-red-200">{error}</p>
          </div>
        )}

        {!data.length && !loading && !error && (
          <div className="text-center py-20 bg-slate-900/40 border border-white/5 rounded-[40px] backdrop-blur-md">
            <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="text-blue-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white">System Locked</h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto">Log into your Academia Portal in another tab, then click Secure Sync to tunnel data.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((course, idx) => (
            <div 
              key={idx}
              className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[32px] hover:border-blue-500/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="h-2 w-12 bg-blue-600/20 rounded-full group-hover:bg-blue-500/40 transition-colors" />
                <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">75% THRESHOLD</span>
              </div>
              
              <h4 className="text-lg font-bold text-white mb-6 line-clamp-2 leading-tight h-12 uppercase">{course.name}</h4>
              
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-black text-white">{course.percentage}%</p>
                  <p className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${course.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    Bunks Remaining: {course.margin}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Record</p>
                  <p className="text-sm font-bold text-slate-300">{course.present} / {course.total}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
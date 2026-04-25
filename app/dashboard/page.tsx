"use client";

import { useState } from "react";
import * as cheerio from 'cheerio';
import { 
  LayoutDashboard, ShieldCheck, Zap, RefreshCw, 
  AlertTriangle, CheckCircle2, Lock
} from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- THE CLIENT-SIDE TUNNEL ---
  const syncFluxData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Using a CORS bypass to talk to SRM from the browser
      const PROXY = "https://api.allorigins.win/get?url=";
      const TARGET = encodeURIComponent("https://academia.srmist.edu.in/attendance.jsp");
      
      const response = await fetch(`${PROXY}${TARGET}`);
      const json = await response.json();
      const html = json.contents;

      if (html.includes("txtUsername") || html.includes("login")) {
        throw new Error("SESSION_EXPIRED");
      }

      const $ = cheerio.load(html);
      const subjects: any[] = [];

      $('table tr').each((i, el) => {
        const td = $(el).find('td');
        if (td.length >= 4) {
          const name = $(td[1]).text().trim();
          const present = parseInt($(td[2]).text().trim());
          const absent = parseInt($(td[3]).text().trim());
          
          if (name && !isNaN(present) && name !== "Subject Name") {
            const total = present + absent;
            subjects.push({
              name,
              present,
              absent,
              percentage: total > 0 ? ((present / total) * 100).toFixed(2) : "0",
              margin: Math.floor((present / 0.75) - total)
            });
          }
        }
      });

      if (subjects.length === 0) throw new Error("NO_DATA");
      
      setData(subjects);
    } catch (err: any) {
      setError(err.message === "SESSION_EXPIRED" 
        ? "Please log in to Academia in a new tab, then return here." 
        : "Direct Tunnel Failed. Ensure you are logged into Academia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/40 backdrop-blur-xl border-r border-white/5 p-6 hidden md:flex flex-col">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">SRM FLUX</span>
        </div>
        <nav className="flex-1 space-y-2">
            <div className="px-4 py-3 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center gap-3 cursor-default">
                <LayoutDashboard size={20} />
                <span className="font-medium">Overview</span>
            </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none" />

        <header className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Cyber Command</h2>
            <p className="text-slate-500 mt-1">Authorized Access: Aarav Walia</p>
          </div>
          
          <button 
            onClick={syncFluxData}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
              loading 
              ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95"
            }`}
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            {loading ? "DECRYPTING..." : "SECURE SYNC"}
          </button>
        </header>

        {/* Info Banner */}
        {!data.length && !error && (
            <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl mb-10 flex items-center gap-5">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400">
                    <Lock size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-white">Connection Required</h4>
                    <p className="text-sm text-slate-400">To bypass the cloud firewall, open <b>Academia</b> in a new tab, log in, then click <b>Secure Sync</b> above.</p>
                </div>
            </div>
        )}

        {/* Error State */}
        {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl mb-10 flex items-center gap-5 animate-pulse">
                <AlertTriangle className="text-red-500" size={24} />
                <div>
                    <h4 className="font-bold text-red-500">Sync Interrupted</h4>
                    <p className="text-sm text-slate-400">{error}</p>
                </div>
            </div>
        )}

        {/* Stats Grid */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[24px]">
              <p className="text-[10px] font-black tracking-widest text-slate-500 mb-2 uppercase">AVG ATTENDANCE</p>
              <h3 className="text-3xl font-bold text-emerald-400">
                {(data.reduce((acc, curr) => acc + parseFloat(curr.percentage), 0) / data.length).toFixed(2)}%
              </h3>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[24px]">
              <p className="text-[10px] font-black tracking-widest text-slate-500 mb-2 uppercase">TOTAL COURSES</p>
              <h3 className="text-3xl font-bold text-blue-400">{data.length}</h3>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[24px]">
              <p className="text-[10px] font-black tracking-widest text-slate-500 mb-2 uppercase">STATUS</p>
              <h3 className="text-3xl font-bold text-blue-400 flex items-center gap-2">
                SECURE <CheckCircle2 className="text-emerald-500" size={24} />
              </h3>
            </div>
          </div>
        )}

        {/* Course List */}
        <div className="space-y-4">
          {data.map((course) => (
            <div key={course.name} className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:bg-slate-800/40 transition-all">
              <div className="space-y-1">
                <h5 className="font-bold text-white uppercase tracking-tight">{course.name}</h5>
                <p className="text-xs text-slate-500">Attendance: {course.present}/{course.present + course.absent}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white">{course.percentage}%</p>
                <p className={`text-[10px] font-bold uppercase ${course.margin >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  BUNK MARGIN: {course.margin}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
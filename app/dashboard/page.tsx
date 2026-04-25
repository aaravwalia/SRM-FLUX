"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  GraduationCap, 
  Layout, 
  Calendar, 
  Clock, 
  Bell, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2,
  LogOut
} from 'lucide-react';

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-[#0a0a0a] border border-zinc-800/50 p-6 rounded-[2rem] hover:border-zinc-700 transition-all shadow-2xl group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">{title}</p>
        <h3 className={`text-3xl font-bold mt-2 tracking-tighter ${color}`}>{value}</h3>
      </div>
      <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5 text-zinc-300" />
      </div>
    </div>
  </div>
);

const PredictionCard = ({ subject, present, absent }: { subject: string, present: number, absent: number }) => {
  const total = present + absent;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
  const isBelow = percentage < 75;

  let val = 0;
  if (isBelow) {
    val = Math.ceil(((0.75 * total) - present) / 0.25);
  } else {
    val = Math.floor((present - (0.75 * total)) / 0.75);
  }

  return (
    <div className="p-6 bg-[#0d0d0d] border border-zinc-800/60 rounded-[2.2rem] mb-4 hover:border-zinc-700 transition-all group">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <div>
          <h4 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{subject}</h4>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Official Academia Record</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            {isBelow ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            <span className={`text-3xl font-black ${isBelow ? 'text-red-500' : 'text-emerald-500'}`}>{percentage}%</span>
          </div>
        </div>
      </div>
      
      <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-5">
        <div className={`h-full transition-all duration-1000 ${isBelow ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${percentage}%` }}></div>
      </div>
      
      <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-zinc-800/30">
        <div className="flex gap-4">
          <div className="flex flex-col"><span className="text-[9px] text-zinc-500 font-bold uppercase">P</span><span className="text-xs font-bold text-emerald-500">{present}</span></div>
          <div className="flex flex-col"><span className="text-[9px] text-zinc-500 font-bold uppercase">A</span><span className="text-xs font-bold text-red-500">{absent}</span></div>
          <div className="flex flex-col"><span className="text-[9px] text-zinc-500 font-bold uppercase">T</span><span className="text-xs font-bold text-zinc-300">{total}</span></div>
        </div>
        <div className="text-right">
            <p className="text-[9px] text-zinc-500 font-bold uppercase">{isBelow ? 'Required' : 'Margin'}</p>
            <p className={`text-sm font-black ${isBelow ? 'text-red-400' : 'text-emerald-400'}`}>{val} Classes</p>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---

export default function Dashboard() {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [userName, setUserName] = useState("STUDENT");
  const [overall, setOverall] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const rawData = localStorage.getItem('flux_data');
    const name = localStorage.getItem('user_name');

    if (!rawData) {
      router.push('/login');
      return;
    }

    const parsedData = JSON.parse(rawData);
    setAttendanceData(parsedData);
    if (name) setUserName(name.toUpperCase());

    // Calculate overall average
    const totalPresent = parsedData.reduce((acc: number, curr: any) => acc + curr.present, 0);
    const totalClasses = parsedData.reduce((acc: number, curr: any) => acc + (curr.present + curr.absent), 0);
    setOverall(totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-12 max-w-7xl mx-auto">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center font-black italic shadow-[0_0_30px_rgba(37,99,235,0.3)]">F</div>
          <span className="font-black text-2xl tracking-tighter uppercase italic">Flux</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-red-500/10 hover:border-red-500/50 transition-all text-zinc-500 hover:text-red-500">
            <LogOut className="w-5 h-5" />
          </button>
          <div className="h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center font-black text-blue-500 underline decoration-2">
            {userName[0]}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="mb-12">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
          Welcome, <span className="text-blue-600">{userName}</span>
        </h1>
        <p className="text-zinc-500 mt-4 font-bold tracking-widest text-sm flex items-center gap-2">
           <Calendar className="w-4 h-4" /> SESSION: FEB - JUN 2026
        </p>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <StatCard title="Overall" value={`${overall}%`} icon={TrendingUp} color="text-emerald-400" />
        <StatCard title="Subjects" value={attendanceData.length} icon={BookOpen} color="text-blue-400" />
        <StatCard title="Day Order" value="DO 2" icon={Clock} color="text-purple-400" />
        <StatCard title="Status" value="ACTIVE" icon={Layout} color="text-amber-400" />
      </div>

      {/* Attendance List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-black mb-8 tracking-tight uppercase flex items-center gap-3">
            <span className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></span>
            Real-time Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attendanceData.map((item, idx) => (
              <PredictionCard 
                key={idx}
                subject={item.name}
                present={item.present}
                absent={item.absent}
              />
            ))}
          </div>
        </div>
      </div>
      
      <footer className="mt-20 py-10 border-t border-zinc-900 text-center">
        <p className="text-[10px] font-black text-zinc-700 tracking-[0.5em] uppercase">
          SRM Flux • Data Synced via Secure Tunnel
        </p>
      </footer>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  CalendarDays, 
  BookOpen, 
  Calculator, 
  UserCircle, 
  LogOut, 
  ChevronRight, 
  Zap,
  ShieldCheck,
  Clock
} from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Example stats - in a real app, these would be calculated from 'data'
  const stats = [
    { label: "ATTENDANCE", value: "84.2%", color: "text-emerald-400", glow: "shadow-emerald-500/20" },
    { label: "OVERALL MARKS", value: "88.5", color: "text-blue-400", glow: "shadow-blue-500/20" },
    { label: "TOTAL SUBJECTS", value: "9", color: "text-purple-400", glow: "shadow-purple-500/20" },
    { label: "DAY ORDER", value: "1", color: "text-orange-400", glow: "shadow-orange-500/20" },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-hidden">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-slate-900/40 backdrop-blur-xl border-r border-white/5 flex flex-col p-6 hidden md:flex">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">SRM FLUX</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { icon: LayoutDashboard, label: "Overview", active: true },
            { icon: CalendarDays, label: "Attendance", active: false },
            { icon: BookOpen, label: "Marks & Grades", active: false },
            { icon: Clock, label: "Timetable", active: false },
            { icon: Calculator, label: "GPA Calculator", active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                item.active 
                ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
                : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <button className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 transition-colors w-full">
            <LogOut size={20} />
            <span className="font-medium">Logout System</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none" />

        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back, Aarav</h2>
            <p className="text-slate-500 mt-1">Here is your academic status for Saturday, April 25.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-900/50 border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
              <Zap size={14} fill="currentColor" /> PRO ACCESS
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center font-bold text-white">
              A
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className={`bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[24px] hover:border-white/10 transition-all ${stat.glow}`}>
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 mb-2 uppercase">{stat.label}</p>
              <div className="flex items-end justify-between">
                <h3 className={`text-3xl font-bold ${stat.color} tracking-tight`}>{stat.value}</h3>
                <ChevronRight size={18} className="text-slate-700" />
              </div>
            </div>
          ))}
        </section>

        {/* Schedule / Tasks Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen size={20} className="text-blue-500" /> Current Courses
            </h4>
            
            {/* Example Course List */}
            {[
              { name: "Design and Analysis of Algorithms", attendance: 84, margin: 4, prof: "Mahendran M" },
              { name: "Probability and Queueing Theory", attendance: 76, margin: 1, prof: "Dr. Saurabh Kumar" },
              { name: "Cybersecurity Forensics", attendance: 92, margin: 8, prof: "Dr. Rajesh K" },
            ].map((course) => (
              <div key={course.name} className="group bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:bg-slate-800/40 transition-all">
                <div className="space-y-1">
                  <h5 className="font-bold text-white group-hover:text-blue-400 transition-colors">{course.name}</h5>
                  <p className="text-xs text-slate-500">{course.prof} • Theory</p>
                </div>
                <div className="flex items-center gap-8">
                   <div className="text-right">
                      <p className="text-2xl font-black text-white">{course.attendance}%</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        Margin: <span className={course.margin > 2 ? "text-emerald-500" : "text-red-500"}>{course.margin}</span>
                      </p>
                   </div>
                   <div className="w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-b-2 border-blue-500 animate-pulse" />
                   </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Sidebar Info */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarDays size={20} className="text-blue-500" /> Quick Glance
            </h4>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[32px] text-white shadow-xl shadow-blue-900/20">
               <p className="text-sm font-medium opacity-80 mb-1">Upcoming Milestone</p>
               <h5 className="text-xl font-bold mb-4">Internal Assessment 2</h5>
               <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider">Starts in</span>
                  <span className="text-lg font-black">4 Days</span>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
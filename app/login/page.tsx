"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ShieldCheck, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [netid, setNetid] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        body: JSON.stringify({ netid, password }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError("Invalid credentials or Academia is down.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Background: Subtle Grid + Aurora Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[440px] z-10">
        {/* Logo / Title Area */}
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-xl shadow-blue-500/20">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            SRM <span className="text-blue-500">FLUX</span>
          </h1>
          <p className="text-slate-400 font-medium tracking-wide text-sm uppercase">
            Secure Academic Tunnel
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8 rounded-[32px] shadow-2xl relative group">
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

          <form onSubmit={handleLogin} className="space-y-6 relative">
            <div className="space-y-4">
              {/* NetID Input */}
              <div className="group/input relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  placeholder="NetID (e.g. aw2771)"
                  required
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-300"
                  value={netid}
                  onChange={(e) => setNetid(e.target.value)}
                />
              </div>

              {/* Password Input */}
              <div className="group/input relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-blue-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 py-2 px-4 rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group/btn"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Decrypting Data...</span>
                </>
              ) : (
                <>
                  <span>Initialize Tunnel</span>
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center mt-8 text-slate-500 text-sm font-medium">
          Powered by SRM FLUX Engine v2.0
        </p>
      </div>
    </div>
  );
}
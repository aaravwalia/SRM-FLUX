"use client";
import { useState } from 'react';
import { Shield, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [netid, setNetid] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ netid, password }),
      });

      const result = await response.json();

      if (result.success) {
        // Save the scraped data to localStorage so the dashboard can read it
        localStorage.setItem('flux_data', JSON.stringify(result.attendance));
        localStorage.setItem('user_name', netid.split('@')[0]); // Simple name extract
        
        router.push('/dashboard');
      } else {
        setError(result.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError("Connection error. Is Academia down?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/40 border border-zinc-800 p-10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(37,99,235,0.3)]">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white italic uppercase">SRM FLUX</h1>
          <p className="text-zinc-500 mt-2 font-bold text-sm tracking-wide">ACADEMIA WRAPPER</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" 
            placeholder="NetID (ex: aw1234)" 
            value={netid}
            onChange={(e) => setNetid(e.target.value)}
            className="w-full p-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-zinc-700 font-medium"
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-zinc-700 font-medium"
            required
          />

          <button 
            type="submit" 
            disabled={loading}
            className="w-full p-5 bg-white text-black rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                <span>FETCHING FROM ACADEMIA...</span>
              </>
            ) : (
              <>SIGN IN <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-zinc-800/50 text-center">
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">
                Secure End-to-End Tunnel
            </p>
        </div>
      </div>
    </div>
  );
}
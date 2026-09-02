'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, ArrowRight, Monitor } from 'lucide-react';
import Link from 'next/link';

export default function RootAutoHostPage() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    // Instant zero-delay redirect to fresh room lobby
    const freshCode = `PANIC${Math.floor(1000 + Math.random() * 9000)}`;
    router.replace(`/host/${freshCode}`);
  }, [router]);

  const handleManualJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const clean = manualCode.trim().toUpperCase();
    router.push(`/host/${clean}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#06080d] font-mono text-slate-100 p-4 sm:p-6 text-center select-none">
      <div className="max-w-md w-full bg-[#0b0e17] border-2 border-amber-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl glow-yellow flex flex-col items-center gap-5 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-amber-500/20 blur-2xl pointer-events-none" />

        {/* Logo / Icon */}
        <div className="p-4 bg-amber-500/20 border-2 border-amber-400 rounded-3xl glow-yellow">
          <Flame className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 fill-amber-400 animate-bounce" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            11:59 <span className="text-amber-400">DEADLINE PANIC</span>
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            LEARNIT CLUB STALL CO-OP GAME
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 py-3 w-full">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin glow-yellow" />
          <span className="text-xs text-amber-300 font-bold uppercase tracking-widest">
            LAUNCHING BOOTH MISSION CONTROL...
          </span>
        </div>

        {/* Manual Fallback in case client router is slow */}
        <form onSubmit={handleManualJoin} className="w-full border-t border-slate-800 pt-3 flex gap-2">
          <input
            type="text"
            placeholder="ROOM CODE (e.g. PANIC1234)"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-center text-amber-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1"
          >
            <span>GO</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <Link
          href="/sim"
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Open 3-Phone Multi-Device Simulator →</span>
        </Link>
      </div>
    </main>
  );
}

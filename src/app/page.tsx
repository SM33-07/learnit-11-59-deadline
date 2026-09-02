'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, RotateCcw, ArrowRight, Smartphone, Monitor, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type BootstrapState = 'BOOTING' | 'READY' | 'ERROR';

export default function RootAutoHostPage() {
  const router = useRouter();
  const [state, setState] = useState<BootstrapState>('BOOTING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  const initRoom = () => {
    setState('BOOTING');
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('[APP_BOOT] Initialization timeout triggered (4000ms). Falling back to error/manual choice.');
      setState('ERROR');
      setErrorMessage('Server connection timed out. You can launch an instant local room or retry.');
    }, 4000);

    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE' }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        clearTimeout(timeoutId);
        const targetCode = data.code || data.room?.code || `PANIC${Math.floor(1000 + Math.random() * 9000)}`;
        if (data.hostToken && typeof window !== 'undefined') {
          localStorage.setItem(`panic_host_token_${targetCode}`, data.hostToken);
        }
        console.log(`[APP_BOOT_SUCCESS] Created room ${targetCode}`);
        setState('READY');
        router.replace(`/host/${targetCode}`);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') return;
        console.error('[APP_BOOT_ERROR]', err);
        setState('ERROR');
        setErrorMessage(err.message || 'Failed to initialize stall room');
      });
  };

  useEffect(() => {
    initRoom();
  }, []);

  const handleInstantLocalLaunch = () => {
    const fallbackCode = `PANIC${Math.floor(1000 + Math.random() * 9000)}`;
    router.push(`/host/${fallbackCode}`);
  };

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

        {/* State 1: Booting / Launching */}
        {state === 'BOOTING' && (
          <div className="flex flex-col items-center gap-3 py-4 w-full">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin glow-yellow" />
            <span className="text-xs text-amber-300 font-bold uppercase tracking-widest animate-pulse">
              LAUNCHING BOOTH MISSION CONTROL...
            </span>
            <span className="text-[11px] text-slate-400">
              Connecting to game server...
            </span>
          </div>
        )}

        {/* State 2: Ready */}
        {state === 'READY' && (
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">
              ✓ MISSION CONTROL READY. REDIRECTING...
            </span>
          </div>
        )}

        {/* State 3: Error / Offline Recovery */}
        {state === 'ERROR' && (
          <div className="flex flex-col items-center gap-4 w-full animate-in fade-in">
            <div className="bg-[#1f0a14] border border-rose-500/60 rounded-2xl p-3.5 flex items-start gap-2.5 text-left w-full">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col text-xs text-rose-200">
                <span className="font-bold uppercase tracking-wider text-rose-300">Connection Timeout</span>
                <span className="text-[11px] text-rose-200/80 mt-0.5">{errorMessage}</span>
              </div>
            </div>

            <div className="flex flex-col w-full gap-2.5">
              <button
                onClick={handleInstantLocalLaunch}
                className="tactile-btn w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-yellow"
              >
                <span>⚡ LAUNCH INSTANT STALL ROOM</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={initRoom}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>RETRY SERVER CONNECTION</span>
              </button>
            </div>

            {/* Manual Room Code Input */}
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
                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-300 text-xs font-bold rounded-xl"
              >
                OPEN
              </button>
            </form>

            <Link
              href="/sim"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors pt-1"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Open 3-Phone Multi-Device Simulator →</span>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, Smartphone, Zap, Sparkles, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const [roomInput, setRoomInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isCreatingHost, setIsCreatingHost] = useState(false);

  useEffect(() => {
    // Check saved player name
    const saved = localStorage.getItem('panic_player_name');
    if (saved) setNameInput(saved);
  }, []);

  const handleCreateHost = async () => {
    setIsCreatingHost(true);
    try {
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE' }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        router.push(`/host/${data.room.code}`);
      }
    } catch (err) {
      console.error('Error creating host room:', err);
    } finally {
      setIsCreatingHost(false);
    }
  };

  const handleJoinPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim() || !nameInput.trim()) return;
    localStorage.setItem('panic_player_name', nameInput.trim());
    router.push(`/play/${roomInput.trim().toUpperCase()}?name=${encodeURIComponent(nameInput.trim())}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 scanlines relative overflow-hidden">
      {/* Background Neon Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full flex flex-col items-center text-center z-10">
        {/* Learnit Club Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold tracking-widest uppercase mb-6 shadow-lg glow-blue">
          <Sparkles className="w-3.5 h-3.5" />
          <span>LEARNIT CLUB MEMBERSHIP DRIVE</span>
        </div>

        {/* Game Title */}
        <h1 className="font-mono text-5xl sm:text-7xl font-black tracking-tight text-white uppercase drop-shadow-2xl mb-2">
          11:59 <span className="text-amber-400">PANIC</span>
        </h1>
        
        {/* Tagline */}
        <p className="font-mono text-base sm:text-lg text-slate-300 font-bold mb-8 max-w-md">
          3 people. 75 seconds. SAVE THE SUBMISSION.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
          {/* Card 1: Host on Big Screen */}
          <div className="bg-[#101422]/90 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl glow-yellow backdrop-blur-md flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase font-bold tracking-wider mb-2">
                <Monitor className="w-5 h-5" />
                <span>BOOTH DISPLAY</span>
              </div>
              <h2 className="font-mono text-xl font-black text-white mb-2">HOST ON LAPTOP / TV</h2>
              <p className="text-xs text-slate-400 font-mono mb-4">
                Generates a QR code for passerby students to scan and join instantly.
              </p>
            </div>

            <button
              onClick={handleCreateHost}
              disabled={isCreatingHost}
              className="tactile-btn w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-sm rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-yellow"
            >
              <Zap className="w-4 h-4" />
              <span>{isCreatingHost ? 'STARTING...' : 'LAUNCH HOST SCREEN'}</span>
            </button>
          </div>

          {/* Card 2: Join on Phone */}
          <div className="bg-[#101422]/90 border-2 border-cyan-500/50 rounded-3xl p-6 shadow-2xl glow-blue backdrop-blur-md flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase font-bold tracking-wider mb-2">
                <Smartphone className="w-5 h-5" />
                <span>PARTICIPANT CONTROLLER</span>
              </div>
              <h2 className="font-mono text-xl font-black text-white mb-2">JOIN ON PHONE</h2>
              <p className="text-xs text-slate-400 font-mono mb-3">
                Enter your nickname and the 4-digit code shown on the booth screen.
              </p>
            </div>

            <form onSubmit={handleJoinPhone} className="flex flex-col gap-2.5">
              <input
                type="text"
                placeholder="Your Name (e.g. Alex)"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                className="bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                placeholder="Room Code (e.g. PANIC42)"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                required
                className="bg-black/60 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 font-bold uppercase tracking-wider focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="tactile-btn w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black text-sm rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-blue"
              >
                <span>ENTER GAME</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* 1-Click Simulator Link */}
        <Link
          href="/sim"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-amber-400 transition-colors bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-full"
        >
          <Monitor className="w-3.5 h-3.5 text-amber-400" />
          <span>Need to test alone? <strong>Launch 3-Phone Desktop Simulator →</strong></span>
        </Link>
      </div>
    </main>
  );
}

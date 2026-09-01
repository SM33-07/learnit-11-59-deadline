'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Monitor, Smartphone, RotateCcw, Play, Zap, ArrowLeft } from 'lucide-react';

export default function SimulatorPage() {
  const [roomCode, setRoomCode] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Generate a dedicated test room code
    const code = `TEST${Math.floor(100 + Math.random() * 900)}`;
    setRoomCode(code);

    // Initialize room on server
    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE', code }),
    }).then(() => setIsReady(true));
  }, []);

  const autoJoinAndStart = async () => {
    if (!roomCode) return;
    try {
      // Join Player 1 (Yellow)
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'JOIN', code: roomCode, playerId: 'sim_p1', name: 'Yellow (Controls)' }),
      });
      // Join Player 2 (Purple)
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'JOIN', code: roomCode, playerId: 'sim_p2', name: 'Purple (Blueprints)' }),
      });
      // Join Player 3 (Blue)
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'JOIN', code: roomCode, playerId: 'sim_p3', name: 'Blue (Directives)' }),
      });
      // Start Game
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START', code: roomCode }),
      });
    } catch (err) {
      console.error('Error auto-starting simulation:', err);
    }
  };

  const handleReset = async () => {
    if (!roomCode) return;
    await fetch(`/api/room/${roomCode}/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'RESET' }),
    });
  };

  if (!isReady || !roomCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090e] text-amber-400 font-mono text-xs">
        INITIALIZING 3-PHONE SIMULATOR...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 p-3 flex flex-col gap-3 scanlines">
      {/* Top Bar */}
      <header className="flex items-center justify-between bg-[#0f131f] border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            <span>HOME</span>
          </Link>
          <span className="text-slate-600">|</span>
          <span className="font-bold text-amber-400">3-PHONE SIMULATOR (ROOM: {roomCode})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={autoJoinAndStart}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-lg transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>1-CLICK AUTO JOIN & START</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 rounded-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </header>

      {/* Simulator Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 flex-1">
        {/* Host Screen Frame */}
        <div className="xl:col-span-1 bg-[#0b0e17] border-2 border-amber-500/50 rounded-2xl overflow-hidden flex flex-col shadow-xl">
          <div className="bg-amber-950/60 border-b border-amber-500/40 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-amber-300 font-bold">
            <div className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5" />
              <span>HOST / SPECTATOR SCREEN</span>
            </div>
            <Link href={`/host/${roomCode}`} target="_blank" className="hover:underline text-[10px] text-amber-400">
              OPEN POPUP ↗
            </Link>
          </div>
          <iframe
            src={`/host/${roomCode}`}
            className="w-full flex-1 min-h-[500px] border-none"
          />
        </div>

        {/* Phone 1: Yellow (Controls) */}
        <div className="bg-[#0b0e17] border-2 border-yellow-500/60 rounded-2xl overflow-hidden flex flex-col shadow-xl glow-yellow">
          <div className="bg-yellow-950/60 border-b border-yellow-500/40 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-yellow-300 font-bold">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-yellow-400" />
              <span>PHONE 1: 🟡 CONTROLS</span>
            </div>
            <span className="text-[10px] text-yellow-400">TACTILE BOARD</span>
          </div>
          <iframe
            src={`/play/${roomCode}?name=PlayerYellow`}
            className="w-full flex-1 min-h-[500px] border-none"
          />
        </div>

        {/* Phone 2: Purple (Blueprints) */}
        <div className="bg-[#0b0e17] border-2 border-purple-500/60 rounded-2xl overflow-hidden flex flex-col shadow-xl glow-purple">
          <div className="bg-purple-950/60 border-b border-purple-500/40 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-purple-300 font-bold">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span>PHONE 2: 🟣 BLUEPRINTS</span>
            </div>
            <span className="text-[10px] text-purple-400">SAFE/TRAP CODES</span>
          </div>
          <iframe
            src={`/play/${roomCode}?name=PlayerPurple`}
            className="w-full flex-1 min-h-[500px] border-none"
          />
        </div>

        {/* Phone 3: Blue (Directives) */}
        <div className="bg-[#0b0e17] border-2 border-blue-500/60 rounded-2xl overflow-hidden flex flex-col shadow-xl glow-blue">
          <div className="bg-blue-950/60 border-b border-blue-500/40 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-blue-300 font-bold">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              <span>PHONE 3: 🔵 DIRECTIVES</span>
            </div>
            <span className="text-[10px] text-blue-400">SHOUT SEQUENCE</span>
          </div>
          <iframe
            src={`/play/${roomCode}?name=PlayerBlue`}
            className="w-full flex-1 min-h-[500px] border-none"
          />
        </div>
      </div>
    </div>
  );
}

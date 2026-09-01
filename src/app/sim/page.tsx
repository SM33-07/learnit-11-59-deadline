'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Monitor, Smartphone, RotateCcw, Play, ArrowLeft, RefreshCw } from 'lucide-react';

export default function SimulatorPage() {
  const [roomCode, setRoomCode] = useState<string>('');
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);

  const initializeFreshSimulation = async () => {
    setIsReady(false);
    try {
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE' }),
      });
      const data = await res.json();
      const newCode = data.code || data.room?.code || `TEST${Math.floor(100 + Math.random() * 900)}`;
      setRoomCode(newCode);
      if (data.hostToken) {
        setHostToken(data.hostToken);
        localStorage.setItem(`panic_host_token_${newCode}`, data.hostToken);
      }
      setIframeKey((k) => k + 1);
      setIsReady(true);
    } catch (err) {
      console.error('Error initializing simulator room:', err);
    }
  };

  useEffect(() => {
    initializeFreshSimulation();
  }, []);

  const autoJoinAndStart = async () => {
    if (!roomCode) return;
    try {
      // 1. Join Player 1 (Yellow - Controls)
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'JOIN',
          code: roomCode,
          playerId: 'sim_player_1',
          name: 'Alex (Controls)',
        }),
      });

      // 2. Join Player 2 (Purple - Blueprints)
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'JOIN',
          code: roomCode,
          playerId: 'sim_player_2',
          name: 'Sam (Blueprints)',
        }),
      });

      // 3. Join Player 3 (Blue - Directives)
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'JOIN',
          code: roomCode,
          playerId: 'sim_player_3',
          name: 'Riley (Directives)',
        }),
      });

      // 4. Start Briefing / Game
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START', code: roomCode, hostToken }),
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
      body: JSON.stringify({ command: 'RESET', hostToken }),
    });
  };

  if (!isReady || !roomCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080d] text-amber-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin glow-yellow" />
          <span>INITIALIZING 3-PHONE MULTI-USER SIMULATOR...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 p-4 flex flex-col font-mono selection:bg-amber-500 selection:text-black">
      {/* Top Simulator Control Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/host/${roomCode}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>HOST HUD</span>
          </Link>
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <h1 className="text-sm font-black text-white uppercase tracking-wider">
              3-PHONE STALL SIMULATOR
            </h1>
            <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
              ROOM: {roomCode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={autoJoinAndStart}
            className="tactile-btn flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl uppercase tracking-wider shadow-lg glow-yellow transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>AUTO-JOIN 3 PHONES & LAUNCH</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-500/60 text-red-300 rounded-xl text-xs font-bold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
          <button
            onClick={initializeFreshSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>NEW ROOM</span>
          </button>
        </div>
      </header>

      {/* 3 Sim Phone Frames Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl w-full mx-auto">
        {/* Phone 1: Yellow (Controls) */}
        <div className="flex flex-col bg-black/60 border-2 border-yellow-500/40 rounded-3xl p-3 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-yellow-400">
              <Smartphone className="w-4 h-4" />
              <span>PHONE 1: 🟡 CONTROLS</span>
            </div>
            <span className="text-[10px] text-slate-400">Alex</span>
          </div>
          <iframe
            key={`p1_${iframeKey}`}
            src={`/play/${roomCode}?pid=sim_player_1&name=Alex%20(Controls)`}
            className="w-full flex-1 min-h-[560px] rounded-2xl border border-slate-800 bg-[#07090e]"
          />
        </div>

        {/* Phone 2: Purple (Blueprints) */}
        <div className="flex flex-col bg-black/60 border-2 border-purple-500/40 rounded-3xl p-3 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
              <Smartphone className="w-4 h-4" />
              <span>PHONE 2: 🟣 BLUEPRINTS</span>
            </div>
            <span className="text-[10px] text-slate-400">Sam</span>
          </div>
          <iframe
            key={`p2_${iframeKey}`}
            src={`/play/${roomCode}?pid=sim_player_2&name=Sam%20(Blueprints)`}
            className="w-full flex-1 min-h-[560px] rounded-2xl border border-slate-800 bg-[#07090e]"
          />
        </div>

        {/* Phone 3: Blue (Directives) */}
        <div className="flex flex-col bg-black/60 border-2 border-cyan-500/40 rounded-3xl p-3 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Smartphone className="w-4 h-4" />
              <span>PHONE 3: 🔵 DIRECTIVES</span>
            </div>
            <span className="text-[10px] text-slate-400">Riley</span>
          </div>
          <iframe
            key={`p3_${iframeKey}`}
            src={`/play/${roomCode}?pid=sim_player_3&name=Riley%20(Directives)`}
            className="w-full flex-1 min-h-[560px] rounded-2xl border border-slate-800 bg-[#07090e]"
          />
        </div>
      </main>
    </div>
  );
}

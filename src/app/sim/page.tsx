'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Monitor, Smartphone, RotateCcw, Play, ArrowLeft, RefreshCw } from 'lucide-react';

export default function SimulatorPage() {
  const [roomCode, setRoomCode] = useState<string>('');
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
      <div className="min-h-screen flex items-center justify-center bg-[#06080d] text-amber-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin glow-yellow" />
          <span>INITIALIZING 3-PHONE MULTI-USER SIMULATOR...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 p-3 flex flex-col gap-3">
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between bg-[#0f131f] border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-mono gap-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>HOME</span>
          </Link>
          <span className="text-slate-600">|</span>
          <span className="font-bold text-amber-400">
            3-PHONE SIMULATOR [ROOM: <span className="text-white">{roomCode}</span>]
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={initializeFreshSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>NEW ROOM</span>
          </button>
          <button
            onClick={autoJoinAndStart}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl transition-all shadow-lg glow-green"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>⚡ 1-CLICK AUTO JOIN & START</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </header>

      {/* Simulator Grid (1 Host + 3 Distinct User Phones) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 flex-1">
        {/* Host Screen Frame */}
        <div className="bg-[#0b0e17] border-2 border-amber-500/50 rounded-2xl overflow-hidden flex flex-col shadow-xl">
          <div className="bg-amber-950/70 border-b border-amber-500/40 px-3 py-2 flex items-center justify-between text-[11px] font-mono text-amber-300 font-bold">
            <div className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-amber-400" />
              <span>DESK HOST SCREEN</span>
            </div>
            <Link href={`/host/${roomCode}`} target="_blank" className="hover:underline text-[10px] text-amber-400">
              POPUP ↗
            </Link>
          </div>
          <iframe
            key={`host_${iframeKey}`}
            src={`/host/${roomCode}`}
            className="w-full flex-1 min-h-[560px] border-none"
          />
        </div>

        {/* Phone 1: Alex (Yellow - Controls) */}
        <div className="bg-[#0b0e17] border-2 border-yellow-400 rounded-2xl overflow-hidden flex flex-col shadow-xl glow-yellow">
          <div className="bg-yellow-950/70 border-b border-yellow-500/40 px-3 py-2 flex items-center justify-between text-[11px] font-mono text-yellow-300 font-bold">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-yellow-400" />
              <span>PHONE 1: 🟡 ALEX (CONTROLS)</span>
            </div>
            <span className="text-[10px] text-yellow-400 bg-yellow-950/80 px-2 py-0.5 rounded border border-yellow-500/60 font-black">
              SWITCHES
            </span>
          </div>
          <iframe
            key={`p1_${iframeKey}`}
            src={`/play/${roomCode}?pid=sim_player_1&name=Alex%20(Controls)`}
            className="w-full flex-1 min-h-[560px] border-none"
          />
        </div>

        {/* Phone 2: Sam (Purple - Blueprints) */}
        <div className="bg-[#0b0e17] border-2 border-purple-400 rounded-2xl overflow-hidden flex flex-col shadow-xl glow-purple">
          <div className="bg-purple-950/70 border-b border-purple-500/40 px-3 py-2 flex items-center justify-between text-[11px] font-mono text-purple-300 font-bold">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span>PHONE 2: 🟣 SAM (BLUEPRINTS)</span>
            </div>
            <span className="text-[10px] text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/60 font-black">
              CODES
            </span>
          </div>
          <iframe
            key={`p2_${iframeKey}`}
            src={`/play/${roomCode}?pid=sim_player_2&name=Sam%20(Blueprints)`}
            className="w-full flex-1 min-h-[560px] border-none"
          />
        </div>

        {/* Phone 3: Riley (Blue - Directives) */}
        <div className="bg-[#0b0e17] border-2 border-cyan-400 rounded-2xl overflow-hidden flex flex-col shadow-xl glow-blue">
          <div className="bg-blue-950/70 border-b border-cyan-500/40 px-3 py-2 flex items-center justify-between text-[11px] font-mono text-cyan-300 font-bold">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>PHONE 3: 🔵 RILEY (DIRECTIVES)</span>
            </div>
            <span className="text-[10px] text-cyan-400 bg-blue-950/80 px-2 py-0.5 rounded border border-cyan-500/60 font-black">
              SHOUT
            </span>
          </div>
          <iframe
            key={`p3_${iframeKey}`}
            src={`/play/${roomCode}?pid=sim_player_3&name=Riley%20(Directives)`}
            className="w-full flex-1 min-h-[560px] border-none"
          />
        </div>
      </div>
    </div>
  );
}

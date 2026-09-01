'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { GameRoom } from '@/lib/types';
import { QRCodeCard } from '@/components/QRCodeCard';
import { HostSpectatorHUD } from '@/components/HostSpectatorHUD';
import { AudioController } from '@/components/AudioSynthesizer';
import { AdminDrawer } from '@/components/AdminDrawer';
import { Users, Play, ShieldCheck, Flame, Smartphone, Radio, Sparkles, AlertCircle } from 'lucide-react';

export default function HostScreen({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const upperCode = code.toUpperCase();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [lanIp, setLanIp] = useState<string>('localhost');
  const [isStarting, setIsStarting] = useState(false);

  // Fetch LAN IP for QR resolution
  useEffect(() => {
    fetch('/api/room')
      .then((res) => res.json())
      .then((data) => {
        if (data.lanIp) setLanIp(data.lanIp);
      })
      .catch(() => {});
  }, []);

  // Connect to real-time Server-Sent Events stream
  useEffect(() => {
    const eventSource = new EventSource(`/api/room/${upperCode}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const updatedRoom = JSON.parse(event.data) as GameRoom;
        setRoom(updatedRoom);
      } catch (err) {
        console.error('Error parsing SSE room state:', err);
      }
    };

    eventSource.onerror = () => {
      // Reconnect handled automatically by EventSource
    };

    return () => {
      eventSource.close();
    };
  }, [upperCode]);

  const handleStartGame = async () => {
    setIsStarting(true);
    try {
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START', code: upperCode }),
      });
    } catch (err) {
      console.error('Error starting game:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleProceed = async () => {
    try {
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PROCEED', code: upperCode }),
      });
    } catch (err) {
      console.error('Error proceeding to game:', err);
    }
  };

  const router = useRouter();

  const handleRestart = async () => {
    try {
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE' }),
      });
      const data = await res.json();
      if (data.code) {
        router.push(`/host/${data.code}`);
      } else {
        await fetch(`/api/room/${upperCode}/admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'RESET' }),
        });
      }
    } catch (err) {
      console.error('Error creating next round:', err);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080d] font-mono text-amber-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin glow-yellow" />
          <span className="text-sm font-black tracking-widest uppercase">INITIALIZING MISSION CONTROL [{upperCode}]...</span>
        </div>
      </div>
    );
  }

  const playersList = Object.values(room.players);
  const totalJoined = playersList.length;
  const isLobby = room.phase === 'LOBBY';
  const isBriefing = room.phase === 'BRIEFING';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#06080d] text-slate-100 p-4 sm:p-6 relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* Top Ambient Glow Radiance */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-500/10 blur-[100px] pointer-events-none" />

      {/* TOP COMMAND BAR */}
      <header className="flex items-center justify-between border-b-2 border-slate-800/80 pb-4 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-2 border-amber-500/50 rounded-2xl text-amber-400 font-mono text-xs sm:text-sm font-black tracking-widest uppercase flex items-center gap-2 glow-yellow">
            <Flame className="w-4 h-4 fill-amber-400 animate-bounce" />
            <span>11:59 DEADLINE PANIC</span>
          </div>
          <div className="hidden md:flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LEARNIT CLUB BOOTH</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AudioController
            phase={room.phase}
            comboCount={room.comboCount}
            uploadPercent={room.uploadPercent}
            verdict={room.verdict}
            isHost={true}
          />
          <AdminDrawer roomCode={upperCode} onCommandTriggered={() => {}} />
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col items-center justify-center my-6 z-10">
        {isLobby ? (
          // -------------------------------------------------------------
          // LOBBY VIEW: DYNAMIC QR CODE + 3 NEON PLAYER PODS
          // -------------------------------------------------------------
          <div className="max-w-5xl w-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 animate-in fade-in zoom-in-95 duration-200">
            {/* Left: Dynamic QR Code Scanner Card */}
            <div className="flex-shrink-0">
              <QRCodeCard roomCode={upperCode} lanIp={lanIp} />
            </div>

            {/* Right: Connected Squad Pods & Launch Action */}
            <div className="flex-1 max-w-lg w-full flex flex-col gap-4">
              {/* Header Status */}
              <div className="flex items-center justify-between arcade-panel rounded-2xl px-5 py-3 border border-amber-500/40">
                <div className="flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span className="font-mono text-xs sm:text-sm uppercase tracking-widest text-slate-200 font-black">
                    CREW SLOTS ({totalJoined}/3)
                  </span>
                </div>
                {totalJoined >= 2 ? (
                  <span className="text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500 px-3 py-0.5 rounded-full font-black animate-pulse glow-green">
                    READY TO LAUNCH
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-amber-400/80 animate-pulse">
                    WAITING FOR SQUAD...
                  </span>
                )}
              </div>

              {/* 3 Neon Player Identity Pods */}
              <div className="flex flex-col gap-3">
                {/* Pod 1: Yellow (Controls) */}
                <div
                  className={`p-4 rounded-2xl border-2 font-mono flex items-center justify-between transition-all ${
                    playersList[0]
                      ? 'bg-[#181408] border-yellow-400 text-yellow-200 glow-yellow shadow-xl'
                      : 'bg-black/40 border-dashed border-yellow-500/30 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl">🟡</span>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-black text-white">
                        {playersList[0] ? playersList[0].name : 'WAITING FOR PLAYER 1...'}
                      </span>
                      <span className="text-[11px] text-yellow-400 font-bold uppercase tracking-wider">
                        ROLE: THE CONTROLS (SWITCHES & DIALS)
                      </span>
                    </div>
                  </div>
                  {playersList[0] && <ShieldCheck className="w-6 h-6 text-yellow-400" />}
                </div>

                {/* Pod 2: Purple (Blueprints) */}
                <div
                  className={`p-4 rounded-2xl border-2 font-mono flex items-center justify-between transition-all ${
                    playersList[1]
                      ? 'bg-[#160a22] border-purple-400 text-purple-200 glow-purple shadow-xl'
                      : 'bg-black/40 border-dashed border-purple-500/30 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl">🟣</span>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-black text-white">
                        {playersList[1] ? playersList[1].name : 'WAITING FOR PLAYER 2...'}
                      </span>
                      <span className="text-[11px] text-purple-400 font-bold uppercase tracking-wider">
                        ROLE: THE BLUEPRINTS (TRAP & SAFE CODES)
                      </span>
                    </div>
                  </div>
                  {playersList[1] && <ShieldCheck className="w-6 h-6 text-purple-400" />}
                </div>

                {/* Pod 3: Blue (Directives) */}
                <div
                  className={`p-4 rounded-2xl border-2 font-mono flex items-center justify-between transition-all ${
                    playersList[2]
                      ? 'bg-[#081524] border-cyan-400 text-cyan-200 glow-blue shadow-xl'
                      : 'bg-black/40 border-dashed border-cyan-500/30 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl">🔵</span>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-black text-white">
                        {playersList[2] ? playersList[2].name : 'WAITING FOR PLAYER 3 (OPTIONAL)'}
                      </span>
                      <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
                        ROLE: THE DIRECTIVES (SHOUT SEQUENCER)
                      </span>
                    </div>
                  </div>
                  {playersList[2] && <ShieldCheck className="w-6 h-6 text-cyan-400" />}
                </div>
              </div>

              {/* Start Button / Stall Prompt */}
              <div className="mt-2">
                {totalJoined >= 2 ? (
                  <button
                    onClick={handleStartGame}
                    disabled={isStarting}
                    className="tactile-btn w-full py-4.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-mono font-black text-lg rounded-2xl uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(251,191,36,0.5)] glow-yellow hover:scale-[1.02] active:scale-95 border-2 border-yellow-200"
                  >
                    <Play className="w-6 h-6 fill-black" />
                    <span>
                      {totalJoined === 2 ? '⚡ REVIEW RULES (2 PLAYERS)' : '⚡ REVIEW RULES (3 PLAYERS)'}
                    </span>
                  </button>
                ) : (
                  <div className="p-4 bg-black/60 border-2 border-slate-800 rounded-2xl text-center text-xs font-mono text-slate-300 flex items-center justify-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Point phone camera at the QR code on the left to join!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : isBriefing ? (
          // -------------------------------------------------------------
          // BRIEFING VIEW: INSTRUCTION & RULES BAR WITH PROCEED BUTTON
          // -------------------------------------------------------------
          <div className="max-w-4xl w-full arcade-panel rounded-3xl p-8 border-2 border-amber-500 shadow-2xl glow-yellow animate-in fade-in zoom-in-95 duration-150 text-center relative overflow-hidden">
            {/* Top Hazard Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 hazard-tape" />

            <div className="inline-block px-4 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono text-xs font-black tracking-widest uppercase mb-3 mt-1">
              📋 SQUAD MISSION BRIEFING
            </div>

            <h1 className="font-mono text-3xl sm:text-5xl font-black text-white uppercase tracking-tight mb-2">
              HOW TO SURVIVE 11:59 DEADLINE
            </h1>
            <p className="text-slate-300 font-mono text-sm sm:text-base max-w-xl mx-auto mb-8">
              Portal locks out in 75 seconds. Read your job below and communicate loudly!
            </p>

            {/* 4 Rules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-8 max-w-3xl mx-auto font-mono">
              {/* Rule 1: Directives */}
              <div className="bg-[#081524]/90 border-2 border-cyan-400 p-4 rounded-2xl shadow-lg glow-blue">
                <div className="flex items-center gap-2 text-cyan-300 font-black text-sm mb-1 uppercase">
                  <span>🔵 1. DIRECTIVES (SHOUT!)</span>
                </div>
                <p className="text-xs text-slate-300">
                  You see the sequence. <strong>Scream the commands out loud</strong> to your squad!
                </p>
              </div>

              {/* Rule 2: Blueprints */}
              <div className="bg-[#160a22]/90 border-2 border-purple-400 p-4 rounded-2xl shadow-lg glow-purple">
                <div className="flex items-center gap-2 text-purple-300 font-black text-sm mb-1 uppercase">
                  <span>🟣 2. BLUEPRINTS (DECODE!)</span>
                </div>
                <p className="text-xs text-slate-300">
                  You see the schematics. <strong>Warn the squad which buttons are SAFE vs TRAPS!</strong>
                </p>
              </div>

              {/* Rule 3: Controls */}
              <div className="bg-[#181408]/90 border-2 border-yellow-400 p-4 rounded-2xl shadow-lg glow-yellow">
                <div className="flex items-center gap-2 text-yellow-300 font-black text-sm mb-1 uppercase">
                  <span>🟡 3. CONTROLS (EXECUTE!)</span>
                </div>
                <p className="text-xs text-slate-300">
                  You have the tactile hardware. <strong>Listen to teammates and press the safe buttons!</strong>
                </p>
              </div>

              {/* Rule 4: Boss Crisis */}
              <div className="bg-[#1f0a14]/90 border-2 border-rose-500 p-4 rounded-2xl shadow-lg glow-red">
                <div className="flex items-center gap-2 text-rose-300 font-black text-sm mb-1 uppercase">
                  <span>🚨 4. CAMPUS CRISIS (SYNC!)</span>
                </div>
                <p className="text-xs text-slate-300">
                  When alarms flash, <strong>ALL squad members must HOLD the sync button together for 3s!</strong>
                </p>
              </div>
            </div>

            {/* Big Proceed Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
              <button
                onClick={handleRestart}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl border-2 border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-mono text-sm font-bold transition-all"
              >
                ← BACK TO LOBBY
              </button>

              <button
                onClick={handleProceed}
                className="tactile-btn flex-1 w-full py-4.5 px-8 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-black font-mono font-black text-lg rounded-2xl uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(16,185,129,0.6)] glow-green hover:scale-[1.02] active:scale-95 border-2 border-emerald-200"
              >
                <Play className="w-6 h-6 fill-black" />
                <span>⚡ PROCEED TO DEADLINE (START)</span>
              </button>
            </div>
          </div>
        ) : (
          // -------------------------------------------------------------
          // LIVE SPECTATOR HUD (ACTIVE PLAYING OR RESOLVED)
          // -------------------------------------------------------------
          <HostSpectatorHUD room={room} onRestart={handleRestart} />
        )}
      </main>

      {/* FOOTER */}
      <footer className="flex items-center justify-between text-xs font-mono text-slate-500 border-t border-slate-800/80 pt-3 z-10">
        <span className="font-bold text-slate-400">LEARNIT CLUB • 2026 MEMBERSHIP DRIVE</span>
        <span className="text-[11px] text-slate-500">Stall Controls: Press <kbd className="text-amber-400 font-bold">Shift+A</kbd></span>
      </footer>
    </div>
  );
}

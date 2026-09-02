'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { GameRoom } from '@/lib/types';
import { QRCodeCard } from '@/components/QRCodeCard';
import { HostSpectatorHUD } from '@/components/HostSpectatorHUD';
import { AudioController } from '@/components/AudioSynthesizer';
import { AdminDrawer } from '@/components/AdminDrawer';
import { Users, Play, ShieldCheck, Flame, Smartphone, Sparkles, Home } from 'lucide-react';

export default function HostScreen({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const upperCode = code.toUpperCase();

  // Create immediate default room state so host UI never gets stuck on a loading screen
  const defaultInitialRoom: GameRoom = {
    code: upperCode,
    hostId: 'host',
    hostToken: (typeof window !== 'undefined' ? localStorage.getItem(`panic_host_token_${upperCode}`) : '') || '',
    mode: '3_PLAYER',
    phase: 'LOBBY',
    startTime: null,
    endTime: null,
    elapsedMs: 0,
    players: {},
    uploadPercent: 0,
    chaosLevel: 10,
    comboCount: 0,
    maxCombo: 0,
    successfulTasks: 0,
    failedTasks: 0,
    activeTasks: [],
    controlWidgets: [],
    activeCrisis: null,
    spectatorLogs: [
      {
        id: `log_init_${Date.now()}`,
        timestamp: Date.now(),
        text: 'Mission Control ready. Scan QR code to connect!',
        type: 'info',
      },
    ],
    spectatorHeadline: 'WAITING FOR SQUAD TO SCAN QR...',
    verdict: null,
    processedActionIds: new Set<string>(),
  };

  const [room, setRoom] = useState<GameRoom>(defaultInitialRoom);
  const [lanIp, setLanIp] = useState<string>('localhost');
  const [hostToken, setHostToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem(`panic_host_token_${upperCode}`) : null
  );
  const [isStarting, setIsStarting] = useState(false);

  // Initialize or Claim Room State on Mount
  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(`panic_host_token_${upperCode}`) : null;

    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE', code: upperCode, hostToken: storedToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.lanIp) setLanIp(data.lanIp);
        if (data.hostToken) {
          setHostToken(data.hostToken);
          localStorage.setItem(`panic_host_token_${upperCode}`, data.hostToken);
        }
        if (data.room) {
          setRoom(data.room);
        }
      })
      .catch((err) => {
        console.warn('Initial room registration warning:', err);
      });
  }, [upperCode]);

  // Connect to real-time Server-Sent Events stream + Polling fallback
  useEffect(() => {
    let eventSource: EventSource | null = null;
    const token = hostToken || (typeof window !== 'undefined' ? localStorage.getItem(`panic_host_token_${upperCode}`) : null);

    if (token) {
      try {
        eventSource = new EventSource(`/api/room/${upperCode}/stream?playerId=host&hostToken=${token}`);
        eventSource.onmessage = (event) => {
          try {
            const updatedRoom = JSON.parse(event.data) as GameRoom;
            setRoom(updatedRoom);
            if (updatedRoom.hostToken) {
              setHostToken(updatedRoom.hostToken);
              localStorage.setItem(`panic_host_token_${upperCode}`, updatedRoom.hostToken);
            }
          } catch (err) {
            console.error('Error parsing SSE room state:', err);
          }
        };
      } catch (err) {
        console.error('SSE connection error:', err);
      }
    }

    // Polling fallback to ensure continuous synchronization
    const pollInterval = setInterval(() => {
      const currentToken = hostToken || (typeof window !== 'undefined' ? localStorage.getItem(`panic_host_token_${upperCode}`) : null);
      if (!currentToken) return;

      fetch(`/api/room/${upperCode}/state?playerId=host&hostToken=${currentToken}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.room) {
            setRoom(data.room);
          }
        })
        .catch(() => {});
    }, 1000);

    return () => {
      eventSource?.close();
      clearInterval(pollInterval);
    };
  }, [upperCode, hostToken]);

  const handleStartGame = async () => {
    setIsStarting(true);
    try {
      const token = hostToken || (typeof window !== 'undefined' ? localStorage.getItem(`panic_host_token_${upperCode}`) : null);
      await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START', code: upperCode, hostToken: token }),
      });
    } catch (err) {
      console.error('Error starting game:', err);
    } finally {
      setIsStarting(false);
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
        if (data.hostToken) {
          localStorage.setItem(`panic_host_token_${data.code}`, data.hostToken);
        }
        router.push(`/host/${data.code}`);
      }
    } catch (err) {
      console.error('Error creating next round:', err);
    }
  };

  const playersList = Object.values(room.players || {});
  const totalJoined = playersList.length;
  const isLobby = room.phase === 'LOBBY';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#06080d] text-slate-100 p-4 sm:p-6 relative overflow-x-hidden selection:bg-amber-500 selection:text-black select-none">
      {/* Top Ambient Glow */}
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

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleRestart}
            title="Create Fresh Room / New Lobby"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/60 text-slate-300 hover:text-amber-400 rounded-2xl text-xs font-mono font-bold transition-all backdrop-blur-md shadow-lg active:scale-95"
          >
            <Home className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">NEW LOBBY</span>
          </button>
          <AudioController
            phase={room.phase}
            comboCount={room.comboCount}
            uploadPercent={room.uploadPercent}
            verdict={room.verdict}
            isHost={true}
          />
          <AdminDrawer roomCode={upperCode} hostToken={hostToken || undefined} onCommandTriggered={() => {}} />
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col items-center justify-center my-6 z-10">
        {isLobby ? (
          // -------------------------------------------------------------
          // LOBBY VIEW: HIGH-THROUGHPUT STALL SCANNER & PODS
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
                    SQUAD SLOTS ({totalJoined}/3)
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

              {/* Start Button */}
              <div className="mt-2">
                {totalJoined >= 2 ? (
                  <button
                    onClick={handleStartGame}
                    disabled={isStarting}
                    className="tactile-btn w-full py-4.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-mono font-black text-lg rounded-2xl uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(251,191,36,0.5)] glow-yellow hover:scale-[1.02] active:scale-95 border-2 border-yellow-200"
                  >
                    <Play className="w-6 h-6 fill-black" />
                    <span>
                      {totalJoined === 2 ? '⚡ LAUNCH 2-PLAYER PANIC (90s)' : '⚡ LAUNCH 3-PLAYER PANIC (90s)'}
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
        ) : (
          // -------------------------------------------------------------
          // LIVE SPECTATOR HUD (GIANT COUNTDOWN CLOCK & UPLOAD BAR)
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

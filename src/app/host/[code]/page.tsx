'use client';

import React, { useEffect, useState, use } from 'react';
import { GameRoom } from '@/lib/types';
import { QRCodeCard } from '@/components/QRCodeCard';
import { HostSpectatorHUD } from '@/components/HostSpectatorHUD';
import { AudioController } from '@/components/AudioSynthesizer';
import { AdminDrawer } from '@/components/AdminDrawer';
import { Users, Play, Sparkles, ShieldCheck, Flame, Smartphone } from 'lucide-react';

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

  const handleRestart = async () => {
    try {
      await fetch(`/api/room/${upperCode}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'RESET' }),
      });
    } catch (err) {
      console.error('Error resetting room:', err);
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090e] font-mono text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>CONNECTING TO COMMAND CENTER [{upperCode}]...</span>
        </div>
      </div>
    );
  }

  const playersList = Object.values(room.players);
  const totalJoined = playersList.length;
  const isLobby = room.phase === 'LOBBY';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#07090e] text-slate-100 p-4 sm:p-6 scanlines relative overflow-hidden">
      {/* TOP COMMAND BAR */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-3 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 font-mono text-xs font-black tracking-widest uppercase flex items-center gap-1.5 glow-yellow">
            <Flame className="w-4 h-4" />
            <span>11:59 DEADLINE PANIC</span>
          </div>
          <span className="font-mono text-xs text-slate-400 hidden sm:inline">
            ROOM: <strong className="text-amber-400">{upperCode}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
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
          // LOBBY VIEW: QR CODE + 2/3 PLAYER JOIN SLOTS
          // -------------------------------------------------------------
          <div className="max-w-4xl w-full flex flex-col md:flex-row items-center justify-center gap-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Left: Dynamic QR Code */}
            <QRCodeCard roomCode={upperCode} lanIp={lanIp} />

            {/* Right: Player Slots & Launch Controls */}
            <div className="flex-1 max-w-md w-full flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-300 font-bold">
                    CONNECTED SQUAD ({totalJoined}/3)
                  </span>
                </div>
                {totalJoined >= 2 && (
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2.5 py-0.5 rounded-full font-black animate-pulse">
                    READY TO LAUNCH
                  </span>
                )}
              </div>

              {/* 3 Player Slots */}
              <div className="flex flex-col gap-2.5">
                {/* Player 1 Slot: Controls (Yellow) */}
                <div
                  className={`p-4 rounded-2xl border-2 font-mono flex items-center justify-between transition-all ${
                    playersList[0]
                      ? 'bg-[#18150a] border-yellow-500 text-yellow-300 glow-yellow'
                      : 'bg-black/40 border-dashed border-slate-800 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🟡</span>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-black">
                        {playersList[0] ? playersList[0].name : 'WAITING FOR PLAYER 1...'}
                      </span>
                      <span className="text-[10px] text-yellow-400/80">ROLE: THE CONTROLS</span>
                    </div>
                  </div>
                  {playersList[0] && <ShieldCheck className="w-5 h-5 text-yellow-400" />}
                </div>

                {/* Player 2 Slot: Blueprints (Purple) */}
                <div
                  className={`p-4 rounded-2xl border-2 font-mono flex items-center justify-between transition-all ${
                    playersList[1]
                      ? 'bg-[#160d1f] border-purple-500 text-purple-300 glow-purple'
                      : 'bg-black/40 border-dashed border-slate-800 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🟣</span>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-black">
                        {playersList[1] ? playersList[1].name : 'WAITING FOR PLAYER 2...'}
                      </span>
                      <span className="text-[10px] text-purple-400/80">ROLE: THE BLUEPRINTS</span>
                    </div>
                  </div>
                  {playersList[1] && <ShieldCheck className="w-5 h-5 text-purple-400" />}
                </div>

                {/* Player 3 Slot: Directives (Blue) */}
                <div
                  className={`p-4 rounded-2xl border-2 font-mono flex items-center justify-between transition-all ${
                    playersList[2]
                      ? 'bg-[#091522] border-blue-500 text-blue-300 glow-blue'
                      : 'bg-black/40 border-dashed border-slate-800 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔵</span>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-black">
                        {playersList[2] ? playersList[2].name : 'WAITING FOR PLAYER 3 (OPTIONAL)'}
                      </span>
                      <span className="text-[10px] text-blue-400/80">ROLE: THE DIRECTIVES</span>
                    </div>
                  </div>
                  {playersList[2] && <ShieldCheck className="w-5 h-5 text-blue-400" />}
                </div>
              </div>

              {/* Start Game Buttons */}
              <div className="flex flex-col gap-2 mt-2">
                {totalJoined >= 2 ? (
                  <button
                    onClick={handleStartGame}
                    disabled={isStarting}
                    className="tactile-btn w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-black font-mono font-black text-base rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl glow-yellow hover:scale-[1.02] active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-black" />
                    <span>
                      {totalJoined === 2 ? 'START WITH 2 PLAYERS' : 'START 3-PLAYER GAME'}
                    </span>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Scan QR with at least 2 phones to start</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // -------------------------------------------------------------
          // LIVE SPECTATOR HUD (BRIEFING, PLAYING, OR RESOLVED)
          // -------------------------------------------------------------
          <HostSpectatorHUD room={room} onRestart={handleRestart} />
        )}
      </main>

      {/* FOOTER */}
      <footer className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-3 z-10">
        <span>LEARNIT CLUB • MEMBERSHIP DRIVE 2026</span>
        <span className="text-[11px] text-slate-400">Press Shift+A for stall admin panel</span>
      </footer>
    </div>
  );
}

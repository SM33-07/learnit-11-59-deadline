'use client';

import React, { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { GameRoom, Player } from '@/lib/types';
import { MobileControlBoard } from '@/components/MobileControlBoard';
import { MobileBlueprintCard } from '@/components/MobileBlueprintCard';
import { MobileDirectiveCard } from '@/components/MobileDirectiveCard';
import { CrisisOverlay } from '@/components/CrisisOverlay';
import { formatTimeRemaining } from '@/lib/phase-manager';
import { Sparkles, ArrowRight, ShieldAlert, CheckCircle, Clock, Volume2 } from 'lucide-react';

export default function PlayScreen({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const upperCode = code.toUpperCase();
  const searchParams = useSearchParams();

  const [playerId, setPlayerId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isJoined, setIsJoined] = useState(false);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Initialize or restore player session
  useEffect(() => {
    let pid = localStorage.getItem('panic_player_id');
    if (!pid) {
      pid = `p_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('panic_player_id', pid);
    }
    setPlayerId(pid);

    const queryName = searchParams.get('name');
    const storedName = localStorage.getItem('panic_player_name');
    const initialName = queryName || storedName || '';
    if (initialName) {
      setName(initialName);
      // Auto-join if name is already present
      joinGame(pid, initialName);
    }
  }, [searchParams]);

  // Connect to SSE stream
  useEffect(() => {
    if (!isJoined) return;

    const eventSource = new EventSource(`/api/room/${upperCode}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const updatedRoom = JSON.parse(event.data) as GameRoom;
        setRoom(updatedRoom);
        if (playerId && updatedRoom.players[playerId]) {
          setMyPlayer(updatedRoom.players[playerId]);
        }
      } catch (err) {
        console.error('Error parsing SSE room:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [isJoined, upperCode, playerId]);

  const joinGame = async (pid: string, playerName: string) => {
    try {
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'JOIN',
          code: upperCode,
          playerId: pid,
          name: playerName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMyPlayer(data.player);
        setRoom(data.room);
        setIsJoined(true);
        localStorage.setItem('panic_player_name', playerName);
      }
    } catch (err) {
      console.error('Join error:', err);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !playerId) return;
    joinGame(playerId, name.trim());
  };

  const handleControlAction = async (widgetId: string, value: any) => {
    if (!playerId) return;
    try {
      const res = await fetch(`/api/room/${upperCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          action: {
            type: 'CONTROL_CHANGE',
            widgetId,
            value,
          },
        }),
      });
      const data = await res.json();
      if (data.message) {
        setActionFeedback(data.message);
        setTimeout(() => setActionFeedback(null), 2000);
      }
    } catch (err) {
      console.error('Action error:', err);
    }
  };

  const handleCrisisHoldStart = async () => {
    if (!playerId) return;
    await fetch(`/api/room/${upperCode}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId,
        action: { type: 'CRISIS_HOLD_START' },
      }),
    });
  };

  const handleCrisisHoldEnd = async () => {
    if (!playerId) return;
    await fetch(`/api/room/${upperCode}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId,
        action: { type: 'CRISIS_HOLD_END' },
      }),
    });
  };

  // 1. JOIN FORM IF NOT YET JOINED
  if (!isJoined) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#07090e] text-slate-100 font-mono scanlines">
        <div className="max-w-sm w-full bg-[#101422] border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl glow-yellow text-center">
          <div className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-[10px] text-amber-300 font-bold uppercase tracking-widest mb-3">
            ROOM: {upperCode}
          </div>
          <h1 className="text-2xl font-black text-white mb-2">ENTER YOUR NICKNAME</h1>
          <p className="text-xs text-slate-400 mb-6">
            Join your crew to tackle the 11:59 PM deadline panic!
          </p>

          <form onSubmit={handleJoinSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="e.g. Sam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              className="bg-black/60 border border-amber-500/40 rounded-xl px-4 py-3 text-sm text-center text-amber-300 font-bold focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="tactile-btn py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-yellow"
            >
              <span>JOIN CREW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Waiting for room stream
  if (!room || !myPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090e] text-amber-400 font-mono text-xs">
        CONNECTING TO ROOM [{upperCode}]...
      </div>
    );
  }

  const { displayTime, remainingSec } = formatTimeRemaining(room.elapsedMs);
  const is2Player = room.mode === '2_PLAYER';

  // -------------------------------------------------------------
  // LOBBY STATE (WAITING FOR HOST TO CLICK START)
  // -------------------------------------------------------------
  if (room.phase === 'LOBBY') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#07090e] text-slate-100 font-mono text-center scanlines">
        <div
          className={`max-w-md w-full rounded-3xl p-6 border-2 shadow-2xl backdrop-blur-md flex flex-col items-center gap-4 ${
            myPlayer.color === 'yellow'
              ? 'bg-[#18150a] border-yellow-500 glow-yellow'
              : myPlayer.color === 'purple'
              ? 'bg-[#160d1f] border-purple-500 glow-purple'
              : 'bg-[#091522] border-blue-500 glow-blue'
          }`}
        >
          <div className="text-4xl animate-bounce">
            {myPlayer.color === 'yellow' ? '🟡' : myPlayer.color === 'purple' ? '🟣' : '🔵'}
          </div>

          <span className="text-xs uppercase tracking-widest text-slate-400">YOU ARE CONNECTED AS</span>
          <h2 className="text-2xl font-black text-white">{myPlayer.name}</h2>

          <div className="w-full bg-black/60 border border-slate-700/60 rounded-2xl p-4 text-left">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">YOUR ASSIGNED ROLE:</span>
            <span className="text-lg font-black text-white block uppercase">
              {myPlayer.role === 'CONTROLS'
                ? '🟡 THE CONTROLS'
                : myPlayer.role === 'BLUEPRINTS'
                ? '🟣 THE BLUEPRINTS'
                : '🔵 THE DIRECTIVES'}
            </span>
            <p className="text-xs text-slate-300 mt-2">
              {myPlayer.role === 'CONTROLS'
                ? 'You have tactile switches & dials. Listen to teammates!'
                : myPlayer.role === 'BLUEPRINTS'
                ? 'You have the security schematics. Warn about traps & safe codes!'
                : 'You have the action sequence. Shout instructions out loud!'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold animate-pulse">
            <span>WAITING FOR HOST TO START GAME...</span>
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // BRIEFING OVERLAY ON PHONE (WAITING FOR HOST TO PROCEED)
  // -------------------------------------------------------------
  if (room.phase === 'BRIEFING') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#06080d] text-slate-100 font-mono text-center relative overflow-hidden">
        <div
          className={`max-w-md w-full rounded-3xl p-8 border-2 shadow-2xl flex flex-col items-center gap-5 ${
            myPlayer.color === 'yellow'
              ? 'bg-[#181408] border-yellow-400 glow-yellow'
              : myPlayer.color === 'purple'
              ? 'bg-[#160a22] border-purple-400 glow-purple'
              : 'bg-[#081524] border-cyan-400 glow-blue'
          }`}
        >
          <div className="inline-block px-4 py-1 rounded-full bg-black/60 border border-slate-700 text-[10px] text-amber-300 font-black uppercase tracking-widest">
            📋 SQUAD MISSION BRIEFING
          </div>

          <div className="text-4xl animate-bounce">
            {myPlayer.color === 'yellow' ? '🟡' : myPlayer.color === 'purple' ? '🟣' : '🔵'}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            YOUR ASSIGNED ROLE
          </h1>

          <div className="bg-black/80 p-5 rounded-2xl border border-slate-700/80 text-left w-full shadow-inner">
            <span className="text-xs font-black text-amber-400 block mb-1 uppercase tracking-wider">
              {myPlayer.role === 'CONTROLS'
                ? '🟡 THE CONTROLS'
                : myPlayer.role === 'BLUEPRINTS'
                ? '🟣 THE BLUEPRINTS'
                : '🔵 THE DIRECTIVES'}
            </span>
            <p className="text-sm font-bold text-slate-200 leading-relaxed">
              {myPlayer.role === 'CONTROLS'
                ? 'Keep your fingers on the switches & dials. Listen closely to teammates and execute what they shout!'
                : myPlayer.role === 'BLUEPRINTS'
                ? 'Decode the schematics on your screen. Warn your crew which buttons are SAFE vs TRAPS!'
                : 'You see the sequence. Scream the action instructions out loud to your squad!'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-black animate-pulse">
            <span>HOST IS REVIEWING RULES... GET READY TO SHOUT!</span>
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // ENDGAME RESOLUTION ON PHONE
  // -------------------------------------------------------------
  if (room.phase === 'RESOLVED') {
    const isVictory = room.verdict === 'VICTORY';
    const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScdpwK6YjFtwWux8XXBr7tJRYrIlJSdsTNbfT3mahZShdCxHQ/viewform';

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#06080d] text-slate-100 font-mono text-center relative overflow-hidden">
        <div
          className={`max-w-md w-full rounded-3xl p-6 sm:p-8 border-2 shadow-2xl flex flex-col items-center ${
            isVictory ? 'bg-[#0a1f18] border-emerald-500 glow-green' : 'bg-[#1f0a10] border-rose-500 glow-red'
          }`}
        >
          <div className="text-5xl mb-3">{isVictory ? '🎉' : '💀'}</div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase mb-2">
            {isVictory ? 'SUBMISSION SUCCESSFUL!' : 'PORTAL LOCKED OUT!'}
          </h1>
          <p className="text-sm text-slate-300 mb-6">
            {isVictory ? 'You and your crew beat the 11:59:59 deadline!' : 'Deadline missed! Check the main screen for squad summary.'}
          </p>

          {/* Official LearnIT Club Membership Box */}
          <div className="bg-[#0b1324] border-2 border-cyan-400/80 rounded-2xl p-5 mb-4 text-left w-full glow-blue shadow-xl">
            <div className="flex items-center gap-1.5 text-cyan-300 font-black text-xs uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>LEARNIT CLUB MEMBERSHIP</span>
            </div>
            <p className="text-sm font-bold text-white mb-3">
              "Join our club for more such fun experiences and cool peeps!"
            </p>
            <a
              href={googleFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tactile-btn w-full py-3.5 px-4 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 text-black font-black text-xs rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-blue"
            >
              <span>🚀 TAP TO REGISTER (GOOGLE FORM)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="text-[11px] text-slate-400">
            Look up at the main booth screen for the full breakdown!
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE GAME CONTROLLER SCREEN
  // -------------------------------------------------------------
  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#07090e] text-slate-100 p-4 scanlines relative">
      {/* Top Status HUD on Mobile */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-lg">
            {myPlayer.color === 'yellow' ? '🟡' : myPlayer.color === 'purple' ? '🟣' : '🔵'}
          </span>
          <span className="text-xs font-black uppercase tracking-wider">{myPlayer.name}</span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span className="text-xs bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">
            {displayTime}
          </span>
          <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/40">
            {room.uploadPercent}%
          </span>
        </div>
      </div>

      {/* 2-Player Dynamic Active Channel Banner (1 channel at a time) */}
      {is2Player && myPlayer.role === 'BLUEPRINTS' && (
        <div className="mb-3 w-full font-mono text-xs font-black uppercase tracking-wider transition-all">
          {myPlayer.activeSubRole === 'DIRECTIVES' ? (
            <div className="w-full bg-blue-950/90 border-2 border-blue-400 text-blue-200 p-2.5 rounded-xl glow-blue flex items-center justify-center gap-2 shadow-lg">
              <span className="text-lg animate-bounce">🔵</span>
              <span>DIRECTIVE ACTIVE — SHOUT TO PLAYER 1!</span>
            </div>
          ) : (
            <div className="w-full bg-purple-950/90 border-2 border-purple-400 text-purple-200 p-2.5 rounded-xl glow-purple flex items-center justify-center gap-2 shadow-lg">
              <span className="text-lg animate-pulse">🟣</span>
              <span>BLUEPRINT ACTIVE — DECODE & WARN PLAYER 1!</span>
            </div>
          )}
        </div>
      )}

      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-black/90 border border-amber-400 text-amber-300 px-4 py-2 rounded-xl text-xs font-mono font-bold shadow-2xl animate-in fade-in slide-in-from-top-4 duration-150">
          {actionFeedback}
        </div>
      )}

      {/* Active Role Content */}
      <div className="flex-1 flex flex-col items-center justify-start max-w-lg w-full mx-auto my-2">
        {myPlayer.role === 'CONTROLS' && (
          <MobileControlBoard widgets={room.controlWidgets} onAction={handleControlAction} />
        )}

        {myPlayer.role === 'BLUEPRINTS' && (
          // In 2-player mode, if activeSubRole toggles to DIRECTIVES, show directives; otherwise blueprint
          myPlayer.activeSubRole === 'DIRECTIVES' ? (
            <MobileDirectiveCard tasks={room.activeTasks} />
          ) : (
            <MobileBlueprintCard tasks={room.activeTasks} />
          )
        )}

        {myPlayer.role === 'DIRECTIVES' && (
          <MobileDirectiveCard tasks={room.activeTasks} />
        )}
      </div>

      {/* Synchronized Boss Crisis Overlay */}
      <CrisisOverlay
        crisis={room.activeCrisis}
        playerId={playerId}
        totalPlayers={Object.keys(room.players).length}
        onHoldStart={handleCrisisHoldStart}
        onHoldEnd={handleCrisisHoldEnd}
      />

      {/* Footer info */}
      <div className="text-center font-mono text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
        ROOM {upperCode} • 11:59 PANIC
      </div>
    </main>
  );
}

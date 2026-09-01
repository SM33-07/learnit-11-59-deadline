'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GameRoom, Player } from '@/lib/types';
import { MobileControlBoard } from '@/components/MobileControlBoard';
import { MobileBlueprintCard } from '@/components/MobileBlueprintCard';
import { MobileDirectiveCard } from '@/components/MobileDirectiveCard';
import { CrisisOverlay } from '@/components/CrisisOverlay';
import { formatTimeRemaining } from '@/lib/phase-manager';
import { Sparkles, ArrowRight, ShieldAlert, CheckCircle, Clock, Volume2, Home } from 'lucide-react';

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
    let queryPid: string | null = null;
    let queryName: string | null = null;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      queryPid = urlParams.get('pid');
      queryName = urlParams.get('name');
    }

    let pid = queryPid;
    if (!pid && typeof window !== 'undefined') {
      pid = sessionStorage.getItem('panic_player_id') || localStorage.getItem('panic_player_id');
    }
    if (!pid) {
      pid = `p_${Math.random().toString(36).substring(2, 9)}`;
    }

    if (queryPid) {
      sessionStorage.setItem('panic_player_id', queryPid);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('panic_player_id', pid);
    }

    setPlayerId(pid);

    const storedName = typeof window !== 'undefined' ? (queryPid ? '' : localStorage.getItem('panic_player_name')) : '';
    const initialName = queryName || storedName || '';
    if (initialName) {
      setName(initialName);
      // Auto-join if name is already present
      joinGame(pid, initialName);
    }
  }, []);

  // Connect to SSE stream + Polling fallback for guaranteed multi-phone sync
  useEffect(() => {
    if (!isJoined) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/room/${upperCode}/stream`);
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
    } catch (err) {
      console.error('SSE initialization error:', err);
    }

    // Fast polling fallback to guarantee 100% sync in iframes & mobile
    const pollInterval = setInterval(() => {
      fetch(`/api/room/${upperCode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.room) {
            setRoom(data.room);
            if (playerId && data.room.players[playerId]) {
              setMyPlayer(data.room.players[playerId]);
            }
          }
        })
        .catch(() => {});
    }, 1000);

    return () => {
      eventSource?.close();
      clearInterval(pollInterval);
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
  // LOBBY STATE (SHOWS FULL RULES & ROLE INSTRUCTIONS ON PLAYER'S PHONE)
  // -------------------------------------------------------------
  if (room.phase === 'LOBBY' || room.phase === 'BRIEFING') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#06080d] text-slate-100 font-mono text-center relative overflow-hidden">
        <div
          className={`max-w-md w-full rounded-3xl p-6 border-2 shadow-2xl backdrop-blur-md flex flex-col items-center gap-4 ${
            myPlayer.color === 'yellow'
              ? 'bg-[#181408] border-yellow-400 glow-yellow'
              : myPlayer.color === 'purple'
              ? 'bg-[#160a22] border-purple-400 glow-purple'
              : 'bg-[#081524] border-cyan-400 glow-blue'
          }`}
        >
          {/* Header Identity */}
          <div className="flex items-center justify-between w-full border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">
                {myPlayer.color === 'yellow' ? '🟡' : myPlayer.color === 'purple' ? '🟣' : '🔵'}
              </span>
              <div className="text-left">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">CONNECTED AS</span>
                <span className="text-base font-black text-white">{myPlayer.name}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-black/60 px-2.5 py-1 rounded-full border border-slate-700 text-amber-300 font-bold">
              ROOM {upperCode}
            </span>
          </div>

          {/* Assigned Role Banner */}
          <div className="w-full bg-black/80 border-2 border-slate-700/80 rounded-2xl p-4 text-left shadow-inner">
            <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black block mb-1">
              🎯 YOUR ASSIGNED SQUAD ROLE:
            </span>
            <span className="text-xl font-black text-white block uppercase mb-3">
              {myPlayer.role === 'CONTROLS'
                ? '🟡 THE CONTROLS (EXECUTE)'
                : myPlayer.role === 'BLUEPRINTS'
                ? '🟣 THE BLUEPRINTS (DECODE)'
                : '🔵 THE DIRECTIVES (SHOUT)'}
            </span>

            {/* 3 Step Role Instructions */}
            <div className="space-y-2 text-xs font-mono text-slate-200">
              {myPlayer.role === 'CONTROLS' ? (
                <>
                  <div className="flex items-start gap-2 bg-yellow-950/30 p-2 rounded-xl border border-yellow-500/20">
                    <span>1.</span>
                    <span><strong>Keep hands on buttons:</strong> Your phone will show switches, rotary dials, sliders, and levers.</span>
                  </div>
                  <div className="flex items-start gap-2 bg-yellow-950/30 p-2 rounded-xl border border-yellow-500/20">
                    <span>2.</span>
                    <span><strong>Listen to squad shouts:</strong> Directives will shout what to flip—listen closely!</span>
                  </div>
                  <div className="flex items-start gap-2 bg-yellow-950/30 p-2 rounded-xl border border-yellow-500/20">
                    <span>3.</span>
                    <span><strong>Avoid traps:</strong> Blueprints will verify safe buttons so you don't get electrocuted!</span>
                  </div>
                </>
              ) : myPlayer.role === 'BLUEPRINTS' ? (
                <>
                  <div className="flex items-start gap-2 bg-purple-950/30 p-2 rounded-xl border border-purple-500/20">
                    <span>1.</span>
                    <span><strong>Decode security:</strong> Your phone displays schematics showing SAFE targets vs ELECTRIFIED TRAPS.</span>
                  </div>
                  <div className="flex items-start gap-2 bg-purple-950/30 p-2 rounded-xl border border-purple-500/20">
                    <span>2.</span>
                    <span><strong>Warn teammates:</strong> When Directives shouts an action, immediately verify if it's safe and shout the warning!</span>
                  </div>
                  <div className="flex items-start gap-2 bg-purple-950/30 p-2 rounded-xl border border-purple-500/20">
                    <span>3.</span>
                    <span><strong>Confirm values:</strong> Give the exact dial number or color code to Controls.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 bg-blue-950/30 p-2 rounded-xl border border-blue-500/20">
                    <span>1.</span>
                    <span><strong>Scream commands:</strong> Your phone shows the action sequence. SHOUT each instruction LOUDLY to the squad!</span>
                  </div>
                  <div className="flex items-start gap-2 bg-blue-950/30 p-2 rounded-xl border border-blue-500/20">
                    <span>2.</span>
                    <span><strong>Speed matters:</strong> Keep the pace moving fast before the 11:59:59 midnight deadline strikes.</span>
                  </div>
                  <div className="flex items-start gap-2 bg-blue-950/30 p-2 rounded-xl border border-blue-500/20">
                    <span>3.</span>
                    <span><strong>Wait for confirmation:</strong> Once Controls executes the step, shout the next directive!</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Universal Emergency Rule */}
          <div className="w-full bg-[#1f0a14] border border-rose-500/40 rounded-xl p-3 text-left">
            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block mb-0.5">
              🚨 SQUAD CRISIS PROTOCOL:
            </span>
            <p className="text-[11px] text-rose-200">
              When campus Wi-Fi alarms sound, <strong>ALL squad members must hold down the emergency button together for 3 seconds!</strong>
            </p>
          </div>

          {/* Waiting Status */}
          <div className="flex items-center gap-2 text-xs text-amber-400 font-black animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>SQUAD CONNECTED • WAITING FOR HOST TO LAUNCH 75s CLOCK</span>
          </div>

          <div className="pt-2 border-t border-slate-800/80 w-full">
            <Link
              href="/"
              onClick={() => {
                sessionStorage.removeItem('panic_player_id');
                localStorage.removeItem('panic_player_id');
                localStorage.removeItem('panic_player_name');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 font-mono transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Leave Lobby / Go Home</span>
            </Link>
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

'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { PlayerRoomView, PlayerRole } from '@/lib/types';
import { formatTimeRemaining } from '@/lib/phase-manager';
import { MobileControlBoard } from '@/components/MobileControlBoard';
import { MobileBlueprintCard } from '@/components/MobileBlueprintCard';
import { MobileDirectiveCard } from '@/components/MobileDirectiveCard';
import { CrisisOverlay } from '@/components/CrisisOverlay';
import { ArrowRight, Home, Sparkles, Smartphone, RotateCcw, AlertTriangle } from 'lucide-react';

interface PlayPageProps {
  params: Promise<{ code: string }>;
}

export default function PlayPage({ params }: PlayPageProps) {
  const { code } = use(params);
  const upperCode = code.toUpperCase();

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [view, setView] = useState<PlayerRoomView | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Initialize player session on mount
  useEffect(() => {
    let queryPid: string | null = null;
    let queryName: string | null = null;

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      queryPid = urlParams.get('pid');
      queryName = urlParams.get('name');
    }

    let pid = queryPid || (typeof window !== 'undefined' ? sessionStorage.getItem('panic_player_id') || localStorage.getItem('panic_player_id') : null);
    if (!pid) {
      pid = `p_${Math.random().toString(36).substring(2, 9)}`;
    }

    if (queryPid) {
      sessionStorage.setItem('panic_player_id', queryPid);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('panic_player_id', pid);
    }

    const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem(`panic_token_${upperCode}`) : null;
    if (storedToken) setSessionToken(storedToken);

    setPlayerId(pid);

    const storedName = typeof window !== 'undefined' ? (queryPid ? '' : localStorage.getItem('panic_player_name')) : '';
    const initialName = queryName || storedName || '';
    if (initialName) {
      setName(initialName);
      joinGame(pid, initialName);
    }
  }, [upperCode]);

  // Connect to sanitized SSE stream + Periodic state sync
  useEffect(() => {
    if (!isJoined || !playerId || !sessionToken) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/room/${upperCode}/stream?playerId=${playerId}&sessionToken=${sessionToken}`);
      eventSource.onmessage = (event) => {
        try {
          const updatedView = JSON.parse(event.data) as PlayerRoomView;
          setView(updatedView);
        } catch {}
      };
    } catch {}

    // Polling fallback to sanitized endpoint
    const pollInterval = setInterval(() => {
      fetch(`/api/room/${upperCode}/state?playerId=${playerId}&sessionToken=${sessionToken}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.view) {
            setView(data.view);
          }
        })
        .catch(() => {});
    }, 1000);

    // Heartbeat every 3s
    const heartbeatInterval = setInterval(() => {
      fetch(`/api/room/${upperCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'HEARTBEAT',
          playerId,
          sessionToken,
        }),
      }).catch(() => {});
    }, 3000);

    return () => {
      eventSource?.close();
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
    };
  }, [isJoined, upperCode, playerId, sessionToken]);

  const joinGame = async (pid: string, playerName: string) => {
    setIsJoining(true);
    setErrorMessage(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'JOIN',
          code: upperCode,
          playerId: pid,
          name: playerName,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.success) {
        if (data.player?.sessionToken) {
          setSessionToken(data.player.sessionToken);
          sessionStorage.setItem(`panic_token_${upperCode}`, data.player.sessionToken);
        }
        if (data.view) {
          setView(data.view);
        }
        setIsJoined(true);
        localStorage.setItem('panic_player_name', playerName);
      } else {
        setErrorMessage(data.error || 'Failed to join room. Room may be full (3 max).');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setErrorMessage('Connection timed out while joining. Please retry.');
      } else {
        setErrorMessage(err.message || 'Connection error');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !playerId) return;
    joinGame(playerId, name.trim());
  };

  const handleControlAction = async (widgetId: string, value: any) => {
    if (!playerId || !sessionToken) return;
    try {
      const actionId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const res = await fetch(`/api/room/${upperCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CONTROL_CHANGE',
          actionId,
          widgetId,
          value,
          playerId,
          sessionToken,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setActionFeedback(data.message);
        setTimeout(() => setActionFeedback(null), 1500);
      }
    } catch (err) {
      console.error('Action error:', err);
    }
  };

  const handleHintRequest = async () => {
    if (!playerId || !sessionToken) return;
    try {
      const res = await fetch(`/api/room/${upperCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'REQUEST_HINT',
          playerId,
          sessionToken,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setActionFeedback(data.message);
        setTimeout(() => setActionFeedback(null), 2500);
      }
    } catch (err) {
      console.error('Hint error:', err);
    }
  };

  const handleCrisisHoldStart = async () => {
    if (!playerId || !sessionToken) return;
    try {
      await fetch(`/api/room/${upperCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CRISIS_HOLD_START',
          playerId,
          sessionToken,
        }),
      });
    } catch (err) {
      console.error('Crisis hold start error:', err);
    }
  };

  const handleCrisisHoldEnd = async () => {
    if (!playerId || !sessionToken) return;
    try {
      await fetch(`/api/room/${upperCode}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CRISIS_HOLD_END',
          playerId,
          sessionToken,
        }),
      });
    } catch (err) {
      console.error('Crisis hold end error:', err);
    }
  };

  // Join Screen
  if (!isJoined) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#07090e] text-slate-100 font-mono text-center select-none touch-none">
        <div className="max-w-md w-full bg-[#0d131f] border-2 border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl glow-yellow flex flex-col items-center gap-5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs tracking-widest uppercase">
            <Smartphone className="w-4 h-4" />
            <span>SQUAD JOIN • ROOM {upperCode}</span>
          </div>

          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            11:59: DEADLINE
          </h1>

          <p className="text-xs text-slate-300">
            Enter your name to connect to the desk session!
          </p>

          {errorMessage && (
            <div className="bg-[#1f0a14] border border-rose-500/60 rounded-2xl p-3.5 flex items-start gap-2 text-left w-full">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-rose-200 leading-snug">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleJoinSubmit} className="w-full flex flex-col gap-4">
            <input
              type="text"
              placeholder="e.g. Sam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              disabled={isJoining}
              className="bg-black/60 border border-amber-500/40 rounded-xl px-4 py-3 text-sm text-center text-amber-300 font-bold focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={isJoining || !name.trim()}
              className="tactile-btn py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-yellow disabled:opacity-50"
            >
              {isJoining ? (
                <span>CONNECTING...</span>
              ) : (
                <>
                  <span>JOIN CREW</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 w-full">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 font-mono transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Waiting for stream projection
  if (!view) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#07090e] text-amber-400 font-mono text-xs select-none gap-4">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin glow-yellow" />
        <span>SYNCING ASYMMETRIC CONTROLS [{upperCode}]...</span>
        <button
          onClick={() => playerId && joinGame(playerId, name)}
          className="mt-2 text-[11px] text-slate-400 underline hover:text-amber-300"
        >
          Taking long? Tap to resync
        </button>
      </div>
    );
  }

  const { displayTime } = formatTimeRemaining(view.elapsedMs);
  const myPlayer = view.myPlayer;
  const is2Player = view.mode === '2_PLAYER';

  // -------------------------------------------------------------
  // LOBBY STATE (COMPACT 5-SECOND GLANCEABLE CARD)
  // -------------------------------------------------------------
  if (view.phase === 'LOBBY' || view.phase === 'BRIEFING') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#06080d] text-slate-100 font-mono text-center relative overflow-hidden select-none touch-none">
        <div
          className={`max-w-md w-full rounded-3xl p-6 border-2 shadow-2xl flex flex-col items-center gap-4 ${
            myPlayer.color === 'yellow'
              ? 'bg-[#181408] border-yellow-400 glow-yellow'
              : myPlayer.color === 'purple'
              ? 'bg-[#160a22] border-purple-400 glow-purple'
              : 'bg-[#081524] border-cyan-400 glow-blue'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between w-full border-b border-slate-800 pb-3">
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

          {/* Assigned Role Box */}
          <div className="w-full bg-black/80 border-2 border-slate-700 rounded-2xl p-4 text-left shadow-inner">
            <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black block mb-1">
              YOUR ROLE:
            </span>
            <span className="text-xl font-black text-white block uppercase mb-2">
              {myPlayer.role === 'CONTROLS'
                ? '🟡 THE CONTROLS'
                : myPlayer.role === 'BLUEPRINTS'
                ? '🟣 THE BLUEPRINTS'
                : '🔵 THE DIRECTIVES'}
            </span>

            {/* 1 Sentence Job */}
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-slate-200">
              {myPlayer.role === 'CONTROLS' && (
                <span>👉 <strong>EXECUTE HARDWARE:</strong> You have the switches & dials. Listen to what teammates shout!</span>
              )}
              {myPlayer.role === 'BLUEPRINTS' && (
                <span>👉 <strong>DECODE SCHEMATICS:</strong> You see safe codes & trap warnings. Warn squad before they press!</span>
              )}
              {myPlayer.role === 'DIRECTIVES' && (
                <span>👉 <strong>SHOUT COMMANDS:</strong> You see the action sequence. Scream instructions out loud!</span>
              )}
            </div>
          </div>

          {/* Universal Emergency Rule */}
          <div className="w-full bg-[#1f0a14] border border-rose-500/40 rounded-xl p-3 text-left">
            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block mb-0.5">
              🚨 TEAM CRISIS RULE:
            </span>
            <p className="text-[11px] text-rose-200">
              When Wi-Fi alarms flash, <strong>ALL squad members must HOLD the sync button together for 3 seconds!</strong>
            </p>
          </div>

          {/* Ready Status */}
          <div className="flex items-center gap-2 text-xs text-amber-400 font-black animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>CONNECTED • HOST WILL LAUNCH 90s COUNTDOWN</span>
          </div>

          <div className="pt-2 border-t border-slate-800 w-full">
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
  if (view.phase === 'RESOLVED') {
    const isVictory = view.verdict === 'VICTORY';
    const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScdpwK6YjFtwWux8XXBr7tJRYrIlJSdsTNbfT3mahZShdCxHQ/viewform';

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#06080d] text-slate-100 font-mono text-center select-none touch-none">
        <div
          className={`max-w-md w-full rounded-3xl p-6 sm:p-8 border-2 shadow-2xl flex flex-col items-center gap-4 ${
            isVictory ? 'bg-[#081812] border-emerald-400 glow-green' : 'bg-[#18080c] border-rose-500 glow-red'
          }`}
        >
          <div className="text-5xl">{isVictory ? '🎉' : '💀'}</div>

          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            {isVictory ? 'SUBMISSION ACCEPTED!' : 'PORTAL LOCKED OUT!'}
          </h1>

          <p className="text-xs text-slate-300 mb-2">
            Final Upload: <strong>{view.uploadPercent}%</strong>
          </p>

          {/* Official LearnIT Club Membership Box */}
          <div className="bg-[#0b1324] border-2 border-cyan-400 rounded-2xl p-5 mb-2 text-left w-full glow-blue shadow-xl">
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
            Look up at the booth screen for your team breakdown!
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE GAME CONTROLLER SCREEN
  // -------------------------------------------------------------
  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#07090e] text-slate-100 p-4 relative select-none touch-none">
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
            {view.uploadPercent}%
          </span>
        </div>
      </div>

      {/* 2-Player Dynamic Active Channel Banner */}
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

      {/* Active Role Content (Pure Asymmetric Projection) */}
      <div className="flex-1 flex flex-col items-center justify-start max-w-lg w-full mx-auto my-2">
        {myPlayer.role === 'CONTROLS' && view.controlWidgets && (
          <MobileControlBoard widgets={view.controlWidgets} onAction={handleControlAction} />
        )}

        {(myPlayer.role === 'BLUEPRINTS' || (is2Player && myPlayer.activeSubRole === 'BLUEPRINTS')) && view.schematics && (
          <MobileBlueprintCard schematics={view.schematics} onHintRequest={handleHintRequest} />
        )}

        {(myPlayer.role === 'DIRECTIVES' || (is2Player && myPlayer.activeSubRole === 'DIRECTIVES')) && view.directives && (
          <MobileDirectiveCard directives={view.directives} onHintRequest={handleHintRequest} />
        )}
      </div>

      {/* Synchronized Boss Crisis Overlay */}
      <CrisisOverlay
        crisis={view.crisis}
        playerId={playerId || ''}
        totalPlayers={view.mode === '2_PLAYER' ? 2 : 3}
        onHoldStart={handleCrisisHoldStart}
        onHoldEnd={handleCrisisHoldEnd}
      />

      {/* Footer info */}
      <div className="text-center font-mono text-[10px] text-slate-400 pt-2 border-t border-slate-800">
        ROOM {upperCode} • 11:59 PANIC
      </div>
    </main>
  );
}

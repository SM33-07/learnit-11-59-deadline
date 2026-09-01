'use client';

import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { GameRoom } from '@/lib/types';
import { formatTimeRemaining } from '@/lib/phase-manager';
import { getEndgameSummary } from '@/lib/score-manager';
import { Flame, AlertTriangle, ShieldCheck, Zap, ArrowRight, RotateCcw, Clock, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';

interface HostSpectatorHUDProps {
  room: GameRoom;
  onRestart?: () => void;
}

export function HostSpectatorHUD({ room, onRestart }: HostSpectatorHUDProps) {
  const { displayTime, remainingSec } = formatTimeRemaining(room.elapsedMs);
  const isMeltdown = room.phase === 'MELTDOWN' || remainingSec <= 15;
  const isCrisis = room.phase === 'CRISIS' && room.activeCrisis && !room.activeCrisis.resolved;
  const ctaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger celebratory confetti on victory
  useEffect(() => {
    if (room.phase === 'RESOLVED' && room.verdict === 'VICTORY') {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#facc15', '#38bdf8', '#c084fc', '#22c55e', '#ff3366'],
      });
    }
  }, [room.phase, room.verdict]);

  // Generate QR for LearnIT CTA at endgame
  useEffect(() => {
    if (room.phase === 'RESOLVED' && ctaCanvasRef.current) {
      QRCode.toCanvas(ctaCanvasRef.current, 'https://github.com/learnit-club', {
        width: 140,
        margin: 2,
        color: {
          dark: '#07090e',
          light: '#38bdf8',
        },
      });
    }
  }, [room.phase]);

  // -------------------------------------------------------------
  // ENDGAME RESOLUTION SCREEN
  // -------------------------------------------------------------
  if (room.phase === 'RESOLVED') {
    const isVictory = room.verdict === 'VICTORY';
    const elapsedSec = (room.endTime ? room.endTime - (room.startTime || 0) : 75000) / 1000;
    const summary = getEndgameSummary(isVictory, room.uploadPercent, room.maxCombo, elapsedSec);

    return (
      <div className="flex flex-col items-center justify-center max-w-4xl w-full mx-auto p-6 animate-in fade-in zoom-in-95 duration-200">
        <div
          className={`w-full rounded-3xl p-8 border-2 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden ${
            isVictory
              ? 'bg-[#0b1b17]/90 border-emerald-500/60 glow-green'
              : 'bg-[#1e0d13]/90 border-rose-500/60 glow-red'
          }`}
        >
          {/* Grade Badge */}
          <div className="inline-block px-6 py-2 rounded-full font-mono text-xl font-black tracking-widest uppercase mb-4 border bg-black/60 shadow-lg">
            {isVictory ? (
              <span className="text-emerald-400">GRADE: {summary.grade} ⭐</span>
            ) : (
              <span className="text-rose-400">GRADE: {summary.grade} 💀</span>
            )}
          </div>

          <h1 className="font-mono text-4xl sm:text-6xl font-black tracking-tight mb-3 uppercase text-white drop-shadow-md">
            {summary.title}
          </h1>

          <p className="text-base sm:text-xl text-slate-300 font-mono mb-8 max-w-2xl mx-auto">
            {summary.subtext}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
            <div className="bg-black/40 border border-slate-700/50 rounded-2xl p-4">
              <span className="text-xs font-mono text-slate-400 block">FINAL UPLOAD</span>
              <span className={`text-3xl font-black font-mono ${isVictory ? 'text-emerald-400' : 'text-rose-400'}`}>
                {room.uploadPercent}%
              </span>
            </div>
            <div className="bg-black/40 border border-slate-700/50 rounded-2xl p-4">
              <span className="text-xs font-mono text-slate-400 block">MAX COMBO</span>
              <span className="text-3xl font-black font-mono text-amber-400">
                x{room.maxCombo}
              </span>
            </div>
            <div className="bg-black/40 border border-slate-700/50 rounded-2xl p-4">
              <span className="text-xs font-mono text-slate-400 block">SOLVED TASKS</span>
              <span className="text-3xl font-black font-mono text-cyan-400">
                {room.successfulTasks}
              </span>
            </div>
            <div className="bg-black/40 border border-slate-700/50 rounded-2xl p-4">
              <span className="text-xs font-mono text-slate-400 block">MISTAKES</span>
              <span className="text-3xl font-black font-mono text-rose-400">
                {room.failedTasks}
              </span>
            </div>
          </div>

          {/* Playful LearnIT Club CTA */}
          <div className="bg-[#0f1424] border-2 border-cyan-500/40 rounded-2xl p-6 mb-8 max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-6 text-left glow-blue">
            <div className="flex-shrink-0 bg-cyan-400 p-2 rounded-xl border border-cyan-300">
              <canvas ref={ctaCanvasRef} className="rounded-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest font-bold mb-1">
                <Sparkles className="w-4 h-4" />
                <span>LEARNIT CLUB EXCLUSIVE</span>
              </div>
              <p className="text-slate-200 font-mono text-sm mb-3 italic">
                "{summary.learnitQuote}"
              </p>
              <span className="inline-flex items-center gap-2 font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-500/40">
                {summary.learnitCta}
              </span>
            </div>
          </div>

          {/* Play Again Button */}
          {onRestart && (
            <button
              onClick={onRestart}
              className="inline-flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-lg rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 glow-yellow"
            >
              <RotateCcw className="w-6 h-6" />
              <span>PLAY NEXT ROUND →</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LIVE SPECTATOR HUD (BRIEFING OR ACTIVE PLAY) - 2-4m Stall Readability
  // -------------------------------------------------------------
  return (
    <div className={`w-full max-w-6xl mx-auto flex flex-col gap-6 p-4 ${isMeltdown ? 'alarm-flashing' : ''}`}>
      {/* TOP HEADER: Giant 11:59 Clock & Massive Upload Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* Giant Clock */}
        <div className="bg-[#101422]/95 border-2 border-slate-700/80 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm font-mono tracking-widest text-slate-300 font-bold uppercase mb-1">
            <Clock className={`w-5 h-5 ${isMeltdown ? 'text-rose-500 animate-spin' : 'text-amber-400'}`} />
            <span>PORTAL DEADLINE</span>
          </div>
          <div className={`font-mono text-6xl sm:text-8xl font-black tracking-tight ${isMeltdown ? 'text-rose-500 animate-pulse' : 'text-amber-400'}`}>
            {displayTime}
          </div>
          <span className="text-xs sm:text-sm font-mono text-slate-300 font-bold mt-1 uppercase tracking-wider">
            {remainingSec}s TO 11:59:59
          </span>
        </div>

        {/* Giant Upload Health Bar */}
        <div className="md:col-span-2 bg-[#101422]/95 border-2 border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-sm sm:text-base font-black uppercase tracking-widest text-slate-300">
              SUBMISSION STATUS
            </span>
            <div className="flex items-center gap-3">
              {room.comboCount >= 2 && (
                <span className="flex items-center gap-1.5 font-mono text-sm font-black text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500 animate-bounce shadow-lg glow-yellow">
                  <Flame className="w-4 h-4 fill-amber-400" />
                  <span>COMBO x{room.comboCount}</span>
                </span>
              )}
              <span className="font-mono text-5xl sm:text-6xl font-black text-emerald-400 drop-shadow-md">
                {room.uploadPercent}%
              </span>
            </div>
          </div>

          {/* Huge Progress Bar with glowing milestones */}
          <div className="w-full bg-[#07090e] h-10 rounded-2xl p-1.5 border-2 border-slate-700 relative overflow-hidden shadow-inner">
            <div
              className="h-full rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 glow-green relative"
              style={{ width: `${room.uploadPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-slate-300 font-bold mt-2">
            <span className="text-rose-400">0% (CORRUPTED)</span>
            <span className="text-amber-300">50% (HALFWAY)</span>
            <span className="text-emerald-400 font-black text-sm">100% (SUBMITTED)</span>
          </div>
        </div>
      </div>

      {/* DYNAMIC SPECTATOR HEADLINE TICKER (Giant 2-4m Banner) */}
      <div className="bg-[#0b0e17]/95 border-2 border-amber-500/80 rounded-3xl p-6 text-center shadow-2xl glow-yellow">
        <span className="font-mono text-xs sm:text-sm text-amber-400 uppercase tracking-widest font-black block mb-2">
          📢 LIVE PANIC BROADCAST
        </span>
        <span className="font-mono text-2xl sm:text-4xl font-black text-white tracking-wide block leading-tight">
          {room.spectatorHeadline}
        </span>
      </div>

      {/* 3-PLAYER ARCADE POD CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Yellow: Controls */}
        <div className="bg-[#181408]/95 border-2 border-yellow-400 rounded-3xl p-5 shadow-xl glow-yellow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-black text-yellow-300 uppercase tracking-wider">🟡 THE CONTROLS</span>
            <span className="text-[10px] font-mono bg-yellow-950/80 px-2.5 py-0.5 rounded-full text-yellow-300 border border-yellow-500 font-bold">
              SWITCHES & DIALS
            </span>
          </div>
          <p className="text-xs text-slate-300 font-mono">
            Has the tactile hardware. Must listen closely to team shouts!
          </p>
        </div>

        {/* Purple: Blueprints */}
        <div className="bg-[#160a22]/95 border-2 border-purple-400 rounded-3xl p-5 shadow-xl glow-purple flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-black text-purple-300 uppercase tracking-wider">🟣 THE BLUEPRINTS</span>
            <span className="text-[10px] font-mono bg-purple-950/80 px-2.5 py-0.5 rounded-full text-purple-300 border border-purple-500 font-bold">
              TRAP & SAFE CODES
            </span>
          </div>
          <p className="text-xs text-slate-300 font-mono">
            Has the security schematics. Decodes the traps & safe targets!
          </p>
        </div>

        {/* Blue: Directives */}
        <div className="bg-[#081524]/95 border-2 border-cyan-400 rounded-3xl p-5 shadow-xl glow-blue flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-black text-cyan-300 uppercase tracking-wider">🔵 THE DIRECTIVES</span>
            <span className="text-[10px] font-mono bg-blue-950/80 px-2.5 py-0.5 rounded-full text-cyan-300 border border-cyan-500 font-bold">
              SHOUT SEQUENCER
            </span>
          </div>
          <p className="text-xs text-slate-300 font-mono">
            Has the step order. Must shout instructions loudly & clearly!
          </p>
        </div>
      </div>

      {/* SPECTATOR LOGS FEED */}
      <div className="bg-[#0a0d16]/80 border border-slate-800 rounded-2xl p-4 max-h-40 overflow-y-auto font-mono text-xs space-y-1.5">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">STALL ACTION FEED</span>
        {room.spectatorLogs.slice(0, 6).map((log) => (
          <div
            key={log.id}
            className={`flex items-center gap-2 ${
              log.type === 'success'
                ? 'text-emerald-400'
                : log.type === 'danger'
                ? 'text-rose-400'
                : log.type === 'warning'
                ? 'text-amber-300'
                : 'text-slate-300'
            }`}
          >
            <span className="text-[10px] text-slate-400">
              [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}]
            </span>
            <span>{log.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

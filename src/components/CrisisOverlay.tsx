'use client';

import React, { useState } from 'react';
import { SanitizedCrisis } from '@/lib/types';
import { AlertOctagon, Users, Zap } from 'lucide-react';

interface CrisisOverlayProps {
  crisis: SanitizedCrisis | null;
  playerId: string;
  totalPlayers: number;
  onHoldStart: () => void;
  onHoldEnd: () => void;
}

export function CrisisOverlay({ crisis, playerId, totalPlayers, onHoldStart, onHoldEnd }: CrisisOverlayProps) {
  const [isHolding, setIsHolding] = useState(false);

  if (!crisis || crisis.resolved) return null;

  const currentHoldersCount = crisis.playersHolding.length;
  const isMeHolding = crisis.playersHolding.includes(playerId);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsHolding(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    onHoldStart();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsHolding(false);
    onHoldEnd();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none touch-none animate-in fade-in duration-150">
      <div className="bg-[#1f0b12] border-4 border-rose-500 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl glow-red flex flex-col items-center gap-4">
        {/* Flashing Icon */}
        <div className="p-3 bg-rose-500/20 rounded-full border-2 border-rose-500 animate-bounce">
          <AlertOctagon className="w-10 h-10 text-rose-500" />
        </div>

        <h2 className="font-mono text-2xl sm:text-3xl font-black text-rose-400 tracking-tight uppercase">
          {crisis.title}
        </h2>

        <p className="font-mono text-sm sm:text-base text-slate-200 font-bold leading-snug">
          {crisis.instruction}
        </p>

        {/* Live Holders Status */}
        <div className="flex items-center justify-center gap-2 bg-black/60 border border-rose-500/40 rounded-xl px-4 py-2 font-mono text-xs text-rose-300">
          <Users className="w-4 h-4" />
          <span>
            {currentHoldersCount} / {crisis.activePlayersNeeded || totalPlayers} SQUAD MEMBERS HOLDING
          </span>
        </div>

        {/* 3-Second Continuous Progress Bar */}
        <div className="w-full bg-black/80 rounded-full h-3 border border-rose-500/50 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-400 to-rose-500 h-full transition-all duration-100 ease-linear shadow-lg glow-red"
            style={{ width: `${crisis.holdProgressPercent || 0}%` }}
          />
        </div>

        {/* Big Pointer-Hold Button */}
        <button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`tactile-btn w-full py-8 rounded-2xl font-mono font-black text-xl tracking-wider uppercase flex flex-col items-center justify-center transition-all select-none touch-none shadow-2xl border-4 ${
            isMeHolding
              ? 'bg-rose-500 text-white border-rose-300 scale-95 shadow-inner glow-red'
              : 'bg-rose-950 text-rose-300 border-rose-500/80 hover:bg-rose-900 active:scale-95'
          }`}
        >
          <Zap className={`w-8 h-8 mb-1 ${isMeHolding ? 'animate-spin' : ''}`} />
          <span>{isMeHolding ? 'HOLDING SYNC...' : 'HOLD THIS BUTTON!'}</span>
        </button>

        <span className="text-[11px] font-mono text-slate-400">
          ALL squad members must hold together for 3 FULL seconds!
        </span>
      </div>
    </div>
  );
}

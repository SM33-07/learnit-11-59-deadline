'use client';

import React from 'react';
import { SanitizedDirective } from '@/lib/types';
import { Megaphone, Volume2, Lightbulb, Clock } from 'lucide-react';

interface MobileDirectiveCardProps {
  directives?: SanitizedDirective[];
  onHintRequest?: () => void;
}

export function MobileDirectiveCard({ directives = [], onHintRequest }: MobileDirectiveCardProps) {
  const primaryDirective = directives[0];

  return (
    <div className="flex flex-col gap-3.5 w-full max-w-md mx-auto select-none touch-none">
      {/* Role Header Badge */}
      <div className="flex items-center justify-between px-3 py-2 bg-blue-950/70 border border-blue-500/40 rounded-2xl">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-300 font-black">
            YOUR ROLE: DIRECTIVES
          </span>
        </div>
        <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-2.5 py-0.5 rounded-full font-bold">
          SHOUT LOUDLY
        </span>
      </div>

      {!primaryDirective ? (
        <div className="bg-[#091524] border-2 border-dashed border-cyan-500/40 rounded-3xl p-8 text-center text-slate-400 font-mono text-sm flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Syncing next directive with squad...</span>
        </div>
      ) : (
        <div className="bg-[#081524] border-2 border-cyan-400 rounded-3xl p-5 shadow-2xl glow-blue flex flex-col gap-4 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2.5">
            <span className="font-mono text-xs font-black text-cyan-400 tracking-wider uppercase">
              {primaryDirective.title}
            </span>
            <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{primaryDirective.remainingSec}s</span>
            </div>
          </div>

          {/* Massive Shout Instruction Box */}
          <div className="bg-[#050b14] border-2 border-cyan-400/80 rounded-2xl p-5 text-center shadow-inner">
            <span className="text-[11px] text-cyan-400/80 font-mono font-black uppercase tracking-widest block mb-2">
              📢 SCREAM THIS TO YOUR CREW:
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-white block tracking-wide leading-tight drop-shadow-md">
              {primaryDirective.shoutText.replace(/^📢\s*SHOUT:\s*/i, '')}
            </span>
          </div>

          {/* Sub-rule helper */}
          <div className="flex items-center justify-center gap-2 text-xs text-cyan-300 font-mono text-center bg-cyan-950/40 border border-cyan-500/30 rounded-xl py-2 px-3">
            <Volume2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Tell player with <strong>Controls (🟡)</strong> to press this!</span>
          </div>

          {/* SQUAD TIP / HINT SYSTEM */}
          {primaryDirective.hintRevealed ? (
            <div className="bg-amber-950/50 border-2 border-amber-400 rounded-2xl p-3.5 flex items-start gap-2.5 text-left glow-yellow animate-in fade-in">
              <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-black uppercase tracking-widest block mb-0.5">
                  💡 SQUAD HINT REVEALED:
                </span>
                <span className="font-mono text-xs font-bold text-amber-100 block leading-relaxed">
                  {primaryDirective.hint}
                </span>
              </div>
            </div>
          ) : (
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onHintRequest?.();
              }}
              className="tactile-btn flex items-center justify-center gap-2 py-2 px-3 bg-black/60 hover:bg-amber-950/40 border border-amber-500/40 hover:border-amber-400 text-amber-300 rounded-xl text-xs font-mono font-bold transition-all"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>💡 NEED A HINT? (-3% Upload Penalty)</span>
            </button>
          )}

          {/* If there is a secondary directive queued */}
          {directives.length > 1 && (
            <div className="border-t border-cyan-500/20 pt-2.5 text-left">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1">
                NEXT QUEUED DIRECTIVE:
              </span>
              <div className="bg-black/50 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-300 font-mono">
                {directives[1].shoutText.replace(/^📢\s*SHOUT:\s*/i, '')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { SanitizedBlueprint } from '@/lib/types';
import { FileText, ShieldAlert, CheckCircle2, Eye, Lightbulb, Clock } from 'lucide-react';

interface MobileBlueprintCardProps {
  schematics?: SanitizedBlueprint[];
  onHintRequest?: () => void;
}

export function MobileBlueprintCard({ schematics = [], onHintRequest }: MobileBlueprintCardProps) {
  const primarySchematic = schematics[0];

  return (
    <div className="flex flex-col gap-3.5 w-full max-w-md mx-auto select-none touch-none">
      {/* Role Header Badge */}
      <div className="flex items-center justify-between px-3 py-2 bg-purple-950/70 border border-purple-500/40 rounded-2xl">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          <span className="font-mono text-xs uppercase tracking-widest text-purple-300 font-black">
            YOUR ROLE: BLUEPRINTS
          </span>
        </div>
        <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/40 px-2.5 py-0.5 rounded-full font-bold">
          DECODE & WARN
        </span>
      </div>

      {!primarySchematic ? (
        <div className="bg-[#160a22] border-2 border-dashed border-purple-500/40 rounded-3xl p-8 text-center text-slate-400 font-mono text-sm flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span>Decoding next schematic...</span>
        </div>
      ) : (
        <div className="bg-[#160a22] border-2 border-purple-400 rounded-3xl p-5 shadow-2xl glow-purple flex flex-col gap-4 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-purple-500/30 pb-2.5">
            <span className="font-mono text-xs font-black text-purple-400 tracking-wider uppercase">
              {primarySchematic.title}
            </span>
            <div className="flex items-center gap-1.5 text-purple-300 font-mono text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{primarySchematic.remainingSec}s</span>
            </div>
          </div>

          {/* Safe Target Path Box */}
          {primarySchematic.safeClue && (
            <div className="bg-[#0b1c15] border-2 border-emerald-500/80 rounded-2xl p-4 flex items-start gap-3 shadow-md text-left">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-emerald-400 font-mono font-black uppercase tracking-widest block mb-0.5">
                  ✅ SAFE ACTION:
                </span>
                <span className="font-mono text-base sm:text-lg font-black text-emerald-200 block leading-snug">
                  {primarySchematic.safeClue.replace(/^[✅⚡\s]*[A-Z\s]+:\s*/i, '')}
                </span>
              </div>
            </div>
          )}

          {/* Danger Warning Box */}
          {primarySchematic.dangerClue && (
            <div className="bg-[#1f0a14] border-2 border-rose-500/80 rounded-2xl p-4 flex items-start gap-3 shadow-md text-left">
              <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-rose-400 font-mono font-black uppercase tracking-widest block mb-0.5">
                  ⚠️ HAZARD / TRAP WARNING:
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-rose-200 block leading-snug">
                  {primarySchematic.dangerClue.replace(/^[⚠️\s]*[A-Z\s]+:\s*/i, '')}
                </span>
              </div>
            </div>
          )}

          {/* Visual Target Box */}
          {primarySchematic.targetValueLabel !== undefined && (
            <div className="bg-black/70 border border-purple-500/40 rounded-xl p-3 flex items-center justify-around font-mono text-xs">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block uppercase">TARGET VALUE</span>
                <span className="text-emerald-400 font-black text-base">
                  {String(primarySchematic.targetValueLabel)}
                </span>
              </div>
              <div className="h-6 w-px bg-purple-500/30" />
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block uppercase">SYSTEM STATUS</span>
                <span className="text-purple-300 font-bold text-sm flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>VERIFIED</span>
                </span>
              </div>
            </div>
          )}

          {/* SQUAD TIP / HINT SYSTEM */}
          {primarySchematic.hintRevealed ? (
            <div className="bg-amber-950/50 border-2 border-amber-400 rounded-2xl p-3.5 flex items-start gap-2.5 text-left glow-yellow animate-in fade-in">
              <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-black uppercase tracking-widest block mb-0.5">
                  💡 SQUAD HINT REVEALED:
                </span>
                <span className="font-mono text-xs font-bold text-amber-100 block leading-relaxed">
                  {primarySchematic.hint}
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
        </div>
      )}
    </div>
  );
}

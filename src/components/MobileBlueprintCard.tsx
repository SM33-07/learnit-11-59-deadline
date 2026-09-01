'use client';

import React from 'react';
import { ActiveTask } from '@/lib/types';
import { FileText, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface MobileBlueprintCardProps {
  tasks: ActiveTask[];
}

export function MobileBlueprintCard({ tasks }: MobileBlueprintCardProps) {
  const activeTasks = tasks.filter((t) => !t.completed);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2 px-1">
        <FileText className="w-5 h-5 text-purple-400 animate-pulse" />
        <span className="font-mono text-xs uppercase tracking-widest text-purple-300 font-bold">
          SECURITY BLUEPRINTS & DECODER
        </span>
      </div>

      {activeTasks.length === 0 ? (
        <div className="bg-[#150a22] border-2 border-dashed border-purple-500/40 rounded-2xl p-6 text-center text-slate-400 font-mono text-sm">
          Awaiting next security schematic...
        </div>
      ) : (
        activeTasks.map((task) => (
          <div
            key={task.id}
            className="bg-[#1b0d2d] border-2 border-purple-400 rounded-2xl p-5 shadow-2xl glow-purple flex flex-col gap-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
              <span className="font-mono text-xs font-black text-purple-400 tracking-wider uppercase">
                {task.blueprint.title}
              </span>
              <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/50 px-2 py-0.5 rounded-full font-bold">
                SCHEMATIC
              </span>
            </div>

            {/* Safe Path Clue */}
            {task.blueprint.safePathClue && (
              <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-3 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="font-mono text-sm sm:text-base font-bold text-emerald-200">
                  {task.blueprint.safePathClue}
                </span>
              </div>
            )}

            {/* Danger Warning Clue */}
            {task.blueprint.dangerClue && (
              <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-3 flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="font-mono text-xs sm:text-sm font-bold text-rose-300">
                  {task.blueprint.dangerClue}
                </span>
              </div>
            )}

            {/* Visual Decoder Tag */}
            {task.blueprint.visualDiagram && (
              <div className="bg-black/60 border border-purple-500/30 rounded-xl p-3 flex items-center justify-around font-mono text-xs">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block uppercase">TARGET</span>
                  <span className="text-emerald-400 font-bold text-base">
                    {String(task.blueprint.visualDiagram.targetValue || 'SAFE')}
                  </span>
                </div>
                <div className="h-6 w-px bg-purple-500/30" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block uppercase">STATUS</span>
                  <span className="text-purple-300 font-bold text-base">VERIFIED</span>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

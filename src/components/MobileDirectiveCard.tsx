'use client';

import React from 'react';
import { ActiveTask } from '@/lib/types';
import { Megaphone, Volume2, AlertCircle } from 'lucide-react';

interface MobileDirectiveCardProps {
  tasks: ActiveTask[];
}

export function MobileDirectiveCard({ tasks }: MobileDirectiveCardProps) {
  const activeTasks = tasks.filter((t) => !t.completed);
  const primaryTask = activeTasks[0];

  return (
    <div className="flex flex-col gap-3.5 w-full max-w-md mx-auto animate-in fade-in duration-150">
      {/* Role Header Badge */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-blue-950/70 border border-blue-500/40 rounded-2xl">
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

      {!primaryTask ? (
        <div className="bg-[#091524] border-2 border-dashed border-cyan-500/40 rounded-3xl p-8 text-center text-slate-400 font-mono text-sm flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Syncing next directive with squad...</span>
        </div>
      ) : (
        <div className="bg-[#081524] border-2 border-cyan-400 rounded-3xl p-5 shadow-2xl glow-blue flex flex-col gap-4 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2.5">
            <span className="font-mono text-xs font-black text-cyan-400 tracking-wider uppercase">
              TASK: {primaryTask.title}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ACTIVE
            </span>
          </div>

          {/* Massive Shout Instruction Box */}
          <div className="bg-[#050b14] border-2 border-cyan-400/80 rounded-2xl p-5 text-center shadow-inner">
            <span className="text-[11px] text-cyan-400/80 font-mono font-black uppercase tracking-widest block mb-2">
              📢 SCREAM THIS TO YOUR CREW:
            </span>
            <span className="font-mono text-2xl sm:text-3xl font-black text-white block tracking-wide leading-tight drop-shadow-md">
              {primaryTask.directive.shoutText.replace(/^📢\s*SHOUT:\s*/i, '')}
            </span>
          </div>

          {/* Sub-rule helper */}
          <div className="flex items-center justify-center gap-2 text-xs text-cyan-300 font-mono text-center bg-cyan-950/40 border border-cyan-500/30 rounded-xl py-2 px-3">
            <Volume2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Tell player with <strong>Controls (🟡)</strong> to press this!</span>
          </div>

          {/* If there is a secondary task, show a compact preview */}
          {activeTasks.length > 1 && (
            <div className="border-t border-cyan-500/20 pt-2.5">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1">
                NEXT QUEUED DIRECTIVE:
              </span>
              <div className="bg-black/50 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-300 font-mono">
                {activeTasks[1].directive.shoutText.replace(/^📢\s*SHOUT:\s*/i, '')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

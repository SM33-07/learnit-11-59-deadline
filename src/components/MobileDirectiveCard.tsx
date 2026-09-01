'use client';

import React from 'react';
import { ActiveTask } from '@/lib/types';
import { Megaphone, AlertCircle } from 'lucide-react';

interface MobileDirectiveCardProps {
  tasks: ActiveTask[];
}

export function MobileDirectiveCard({ tasks }: MobileDirectiveCardProps) {
  const activeTasks = tasks.filter((t) => !t.completed);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2 px-1">
        <Megaphone className="w-5 h-5 text-cyan-400 animate-bounce" />
        <span className="font-mono text-xs uppercase tracking-widest text-cyan-300 font-bold">
          SHOUT DIRECTIVE TO TEAM
        </span>
      </div>

      {activeTasks.length === 0 ? (
        <div className="bg-[#091624] border-2 border-dashed border-cyan-500/40 rounded-2xl p-6 text-center text-slate-400 font-mono text-sm">
          Awaiting next crisis instruction...
        </div>
      ) : (
        activeTasks.map((task) => (
          <div
            key={task.id}
            className="bg-[#0b1b2d] border-2 border-cyan-400 rounded-2xl p-5 shadow-2xl glow-blue flex flex-col gap-3 relative overflow-hidden"
          >
            {/* Urgent Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
              <span className="font-mono text-xs font-black text-cyan-400 tracking-wider uppercase">
                {task.title}
              </span>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/50 px-2 py-0.5 rounded-full font-bold">
                COMMUNICATE LOUDLY
              </span>
            </div>

            {/* Big Shouting Prompt */}
            <div className="bg-black/60 border border-cyan-500/40 rounded-xl p-4 text-center">
              <span className="font-mono text-xl sm:text-2xl font-black text-cyan-200 block tracking-wide leading-snug">
                {task.directive.shoutText}
              </span>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-cyan-300/80 font-mono text-center">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Teammate with Controls must find and execute this.</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

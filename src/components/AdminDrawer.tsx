'use client';

import React, { useState, useEffect } from 'react';
import { Settings, X, RotateCcw, FastForward, Trophy, Skull, Users, Play, ShieldAlert, Monitor } from 'lucide-react';
import Link from 'next/link';

interface AdminDrawerProps {
  roomCode: string;
  onCommandTriggered?: () => void;
}

export function AdminDrawer({ roomCode, onCommandTriggered }: AdminDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sendAdminCommand = async (command: string) => {
    setIsBusy(true);
    try {
      await fetch(`/api/room/${roomCode}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      onCommandTriggered?.();
    } catch (err) {
      console.error('Admin command error:', err);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      {/* Subtle Gear Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        title="Host Admin Panel (Shift+A)"
        className="p-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-400 hover:text-amber-400 hover:border-amber-400/50 transition-all backdrop-blur-md"
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f131f] border-2 border-amber-500/60 rounded-2xl max-w-md w-full p-6 shadow-2xl glow-yellow text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="font-mono text-base font-bold text-amber-400 tracking-wider">STALL ADMIN CONTROLS</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 font-mono mb-4">
              Emergency recovery tools for stall runners. Shortcut: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-300">Shift+A</kbd>
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                disabled={isBusy}
                onClick={() => sendAdminCommand('RESET')}
                className="flex items-center justify-center gap-2 p-3 bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 rounded-xl text-xs font-mono font-bold transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RESET ROOM</span>
              </button>

              <button
                disabled={isBusy}
                onClick={() => sendAdminCommand('SKIP_PHASE')}
                className="flex items-center justify-center gap-2 p-3 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 text-amber-300 rounded-xl text-xs font-mono font-bold transition-all"
              >
                <FastForward className="w-4 h-4" />
                <span>SKIP PHASE</span>
              </button>

              <button
                disabled={isBusy}
                onClick={() => sendAdminCommand('FORCE_WIN')}
                className="flex items-center justify-center gap-2 p-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-mono font-bold transition-all"
              >
                <Trophy className="w-4 h-4" />
                <span>FORCE WIN</span>
              </button>

              <button
                disabled={isBusy}
                onClick={() => sendAdminCommand('FORCE_LOSE')}
                className="flex items-center justify-center gap-2 p-3 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/50 text-purple-300 rounded-xl text-xs font-mono font-bold transition-all"
              >
                <Skull className="w-4 h-4" />
                <span>FORCE FAIL</span>
              </button>
            </div>

            <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
              <Link
                href={`/sim?room=${roomCode}`}
                target="_blank"
                className="flex items-center justify-center gap-2 w-full p-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-mono font-bold transition-all"
              >
                <Monitor className="w-4 h-4" />
                <span>OPEN 3-PHONE SIMULATOR</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

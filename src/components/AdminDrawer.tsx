'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X, RotateCcw, FastForward, Trophy, Skull, Monitor, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface AdminDrawerProps {
  roomCode: string;
  onCommandTriggered?: () => void;
}

export function AdminDrawer({ roomCode, onCommandTriggered }: AdminDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
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

  const modalContent = isOpen && (
    <div 
      className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-[#0b0e17] border-2 border-amber-500 rounded-3xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-slate-100 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Caution Header Stripe */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_10px,#000_10px,#000_20px)]" />

        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 mt-1">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="font-mono text-base font-black text-amber-400 tracking-wider uppercase">STALL ADMIN CONSOLE</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 font-mono mb-4 leading-relaxed">
          Emergency recovery controls for stall staff. Shortcut: <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-300 font-bold">Shift+A</kbd>
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            disabled={isBusy}
            onClick={() => sendAdminCommand('RESET')}
            className="flex items-center justify-center gap-2 p-3.5 bg-red-950/60 hover:bg-red-900/80 border border-red-500/60 text-red-300 rounded-2xl text-xs font-mono font-bold transition-all shadow-lg active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET ROOM</span>
          </button>

          <button
            disabled={isBusy}
            onClick={() => sendAdminCommand('SKIP_PHASE')}
            className="flex items-center justify-center gap-2 p-3.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/60 text-amber-300 rounded-2xl text-xs font-mono font-bold transition-all shadow-lg active:scale-95"
          >
            <FastForward className="w-4 h-4" />
            <span>SKIP PHASE</span>
          </button>

          <button
            disabled={isBusy}
            onClick={() => sendAdminCommand('FORCE_WIN')}
            className="flex items-center justify-center gap-2 p-3.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/60 text-emerald-300 rounded-2xl text-xs font-mono font-bold transition-all shadow-lg active:scale-95"
          >
            <Trophy className="w-4 h-4" />
            <span>FORCE WIN</span>
          </button>

          <button
            disabled={isBusy}
            onClick={() => sendAdminCommand('FORCE_LOSE')}
            className="flex items-center justify-center gap-2 p-3.5 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/60 text-purple-300 rounded-2xl text-xs font-mono font-bold transition-all shadow-lg active:scale-95"
          >
            <Skull className="w-4 h-4" />
            <span>FORCE FAIL</span>
          </button>
        </div>

        <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
          <Link
            href={`/sim?room=${roomCode}`}
            target="_blank"
            className="flex items-center justify-center gap-2 w-full p-3 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/60 text-cyan-300 rounded-2xl text-xs font-mono font-black transition-all shadow-lg glow-blue"
          >
            <Monitor className="w-4 h-4" />
            <span>OPEN 3-PHONE SIMULATOR</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Host Admin Panel (Shift+A)"
        className="p-2.5 rounded-2xl border border-slate-700/80 bg-slate-900/90 text-slate-400 hover:text-amber-400 hover:border-amber-400/70 transition-all backdrop-blur-md shadow-lg active:scale-95"
      >
        <Settings className="w-4 h-4" />
      </button>

      {mounted && typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null}
    </>
  );
}

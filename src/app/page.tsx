'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flame } from 'lucide-react';

export default function RootAutoHostPage() {
  const router = useRouter();

  useEffect(() => {
    // Generate a brand new unique stall room and redirect directly to host screen
    fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE' }),
    })
      .then((res) => res.json())
      .then((data) => {
        const targetCode = data.code || data.room?.code || `PANIC${Math.floor(1000 + Math.random() * 9000)}`;
        router.replace(`/host/${targetCode}`);
      })
      .catch(() => {
        router.replace(`/host/PANIC${Math.floor(1000 + Math.random() * 9000)}`);
      });
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#06080d] font-mono text-amber-400 p-6 text-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="p-4 bg-amber-500/20 border-2 border-amber-400 rounded-3xl glow-yellow">
          <Flame className="w-12 h-12 text-amber-400 fill-amber-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
          11:59 <span className="text-amber-400">DEADLINE PANIC</span>
        </h1>
        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
          LAUNCHING BOOTH MISSION CONTROL...
        </span>
      </div>
    </main>
  );
}

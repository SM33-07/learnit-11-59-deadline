'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundFx } from '@/lib/audio';

interface AudioControllerProps {
  phase?: string;
  comboCount?: number;
  uploadPercent?: number;
  verdict?: 'VICTORY' | 'EXPELLED' | null;
  isHost?: boolean;
}

export function AudioController({ phase, comboCount = 0, uploadPercent = 0, verdict, isHost = false }: AudioControllerProps) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(soundFx.getMuted());
  }, []);

  const toggleMute = () => {
    const nextMuted = soundFx.toggleMute();
    setMuted(nextMuted);
  };

  // Trigger sounds on state changes if on host screen
  useEffect(() => {
    if (!isHost || muted) return;

    if (verdict === 'VICTORY') {
      soundFx.playVictory();
    } else if (verdict === 'EXPELLED') {
      soundFx.playDefeat();
    }
  }, [verdict, isHost, muted]);

  useEffect(() => {
    if (!isHost || muted) return;

    if (phase === 'CRISIS') {
      soundFx.playCrisis();
    } else if (phase === 'MELTDOWN') {
      soundFx.playTick('high');
    }
  }, [phase, isHost, muted]);

  useEffect(() => {
    if (!isHost || muted) return;

    if (comboCount >= 3) {
      soundFx.playCombo();
    }
  }, [comboCount, isHost, muted]);

  return (
    <button
      onClick={toggleMute}
      title={muted ? 'Unmute Audio' : 'Mute Audio'}
      className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-mono transition-all backdrop-blur-md ${
        muted
          ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 glow-green'
      }`}
    >
      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
      <span className="hidden sm:inline">{muted ? 'MUTED' : 'AUDIO ACTIVE'}</span>
    </button>
  );
}

'use client';

import React, { useState, useRef } from 'react';
import { SanitizedWidget } from '@/lib/types';
import { Sliders, Radio, Check, Flame } from 'lucide-react';

interface MobileControlBoardProps {
  widgets: SanitizedWidget[];
  onAction: (widgetId: string, value: any) => void;
}

export function MobileControlBoard({ widgets, onAction }: MobileControlBoardProps) {
  const [dialValues, setDialValues] = useState<Record<string, number>>({});
  const [leverHolding, setLeverHolding] = useState<string | null>(null);
  const [leverProgress, setLeverProgress] = useState<number>(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const triggerHaptic = (duration: number | number[] = 30) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  const handleToggle = (widget: SanitizedWidget) => {
    triggerHaptic(40);
    const nextVal = !widget.currentValue;
    onAction(widget.id, nextVal);
  };

  const handlePushButton = (widget: SanitizedWidget) => {
    triggerHaptic(50);
    onAction(widget.id, true);
  };

  const handleDialChange = (widgetId: string, val: number) => {
    setDialValues((prev) => ({ ...prev, [widgetId]: val }));
  };

  const handleDialSubmit = (widgetId: string) => {
    triggerHaptic(40);
    const val = dialValues[widgetId] ?? 50;
    onAction(widgetId, val);
  };

  const handleSliderClick = (widgetId: string, val: number) => {
    triggerHaptic(40);
    onAction(widgetId, val);
  };

  // Pointer-based Lever Hold Handlers
  const startHoldLever = (widget: SanitizedWidget) => {
    triggerHaptic(60);
    setLeverHolding(widget.id);
    setLeverProgress(0);

    const requiredSec = widget.requiredHoldSeconds || 2;
    const intervalMs = 50;
    const step = 100 / ((requiredSec * 1000) / intervalMs);

    let cur = 0;
    holdIntervalRef.current = setInterval(() => {
      cur += step;
      if (cur >= 100) {
        clearInterval(holdIntervalRef.current!);
        holdIntervalRef.current = null;
        setLeverProgress(100);
        triggerHaptic([100, 50, 100]);
        onAction(widget.id, 80); // Success threshold
        setTimeout(() => {
          setLeverHolding(null);
          setLeverProgress(0);
        }, 400);
      } else {
        setLeverProgress(cur);
      }
    }, intervalMs);
  };

  const cancelHoldLever = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setLeverHolding(null);
    setLeverProgress(0);
  };

  return (
    <div className="flex flex-col gap-3.5 w-full select-none touch-none">
      <div className="flex items-center justify-between px-2 py-1 bg-yellow-950/70 border border-yellow-500/40 rounded-2xl">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-yellow-400" />
          <span className="font-mono text-xs uppercase tracking-widest text-yellow-300 font-black">
            YOUR ROLE: CONTROLS
          </span>
        </div>
        <span className="text-[10px] font-mono bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 px-2.5 py-0.5 rounded-full font-bold">
          EXECUTE
        </span>
      </div>

      {widgets.length === 0 ? (
        <div className="bg-[#18150a] border-2 border-dashed border-yellow-500/40 rounded-3xl p-8 text-center text-slate-400 font-mono text-sm flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <span>Syncing hardware modules with squad...</span>
        </div>
      ) : (
        widgets.map((widget) => {
          // 1. TOGGLE SWITCH
          if (widget.type === 'TOGGLE') {
            const isOn = Boolean(widget.currentValue);
            return (
              <div
                key={widget.id}
                className="bg-[#141006] border-2 border-yellow-500/80 rounded-2xl p-4 flex items-center justify-between shadow-xl glow-yellow"
              >
                <div className="flex flex-col text-left">
                  <span className="font-mono text-sm font-black text-white">{widget.label}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    STATUS: {isOn ? 'ACTIVE (ON)' : 'OFF'}
                  </span>
                </div>

                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleToggle(widget);
                  }}
                  className={`tactile-btn px-6 py-3 rounded-xl font-mono text-sm font-black uppercase transition-all shadow-md ${
                    isOn
                      ? 'bg-emerald-500 text-black border-2 border-emerald-300 shadow-emerald-500/50'
                      : 'bg-slate-800 text-slate-300 border-2 border-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {isOn ? 'FLIPPED [ON]' : 'FLIP [OFF]'}
                </button>
              </div>
            );
          }

          // 2. ROTARY DIAL
          if (widget.type === 'ROTARY_DIAL') {
            const currentVal = dialValues[widget.id] ?? Number(widget.currentValue ?? 50);
            return (
              <div
                key={widget.id}
                className="bg-[#141006] border-2 border-yellow-500/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xl glow-yellow text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-white">{widget.label}</span>
                  <span className="font-mono text-2xl font-black text-yellow-400 bg-black/60 px-3 py-1 rounded-xl border border-yellow-500/40">
                    {currentVal}
                  </span>
                </div>

                <input
                  type="range"
                  min={widget.min ?? 0}
                  max={widget.max ?? 100}
                  step={1}
                  value={currentVal}
                  onChange={(e) => handleDialChange(widget.id, Number(e.target.value))}
                  className="w-full h-8 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />

                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleDialSubmit(widget.id);
                  }}
                  className="tactile-btn w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-mono font-black text-sm rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-yellow"
                >
                  <Check className="w-4 h-4" />
                  <span>LOCK IN DIAL [{currentVal}]</span>
                </button>
              </div>
            );
          }

          // 3. PUSH BUTTON
          if (widget.type === 'PUSH_BUTTON') {
            return (
              <div
                key={widget.id}
                className="bg-[#141006] border-2 border-yellow-500/80 rounded-2xl p-4 flex items-center justify-between shadow-xl glow-yellow"
              >
                <div className="flex flex-col text-left">
                  <span className="font-mono text-sm font-black text-white">{widget.label}</span>
                  <span className="text-[10px] font-mono text-slate-400">TOUCH BUTTON</span>
                </div>

                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handlePushButton(widget);
                  }}
                  className="tactile-btn px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black font-mono font-black text-sm rounded-xl uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 glow-yellow"
                >
                  <span>PRESS</span>
                </button>
              </div>
            );
          }

          // 4. STEPPED SLIDER
          if (widget.type === 'SLIDER') {
            const levels = [1, 2, 3, 4];
            const currentLevel = Number(widget.currentValue ?? 1);
            return (
              <div
                key={widget.id}
                className="bg-[#141006] border-2 border-yellow-500/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xl glow-yellow text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-white">{widget.label}</span>
                  <span className="font-mono text-xs text-yellow-400 bg-black/60 px-2.5 py-1 rounded-lg border border-yellow-500/30">
                    STAGE {currentLevel}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {levels.map((lvl) => (
                    <button
                      key={lvl}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        handleSliderClick(widget.id, lvl);
                      }}
                      className={`tactile-btn py-3 font-mono font-black text-sm rounded-xl transition-all border-2 ${
                        currentLevel === lvl
                          ? 'bg-yellow-400 text-black border-yellow-200 shadow-lg glow-yellow scale-105'
                          : 'bg-black/60 text-slate-400 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          // 5. HOLD LEVER
          if (widget.type === 'HOLD_LEVER') {
            const isHolding = leverHolding === widget.id;
            return (
              <div
                key={widget.id}
                className="bg-[#141006] border-2 border-yellow-500/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xl glow-yellow text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-white">{widget.label}</span>
                  <span className="font-mono text-xs text-yellow-400 bg-black/60 px-2.5 py-1 rounded-lg border border-yellow-500/30">
                    HOLD 2S
                  </span>
                </div>

                <div className="w-full bg-black/80 rounded-full h-3 border border-yellow-500/40 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full transition-all duration-75 shadow-lg glow-yellow"
                    style={{ width: `${isHolding ? leverProgress : 0}%` }}
                  />
                </div>

                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    startHoldLever(widget);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    cancelHoldLever();
                  }}
                  onPointerCancel={(e) => {
                    e.preventDefault();
                    cancelHoldLever();
                  }}
                  onPointerLeave={(e) => {
                    e.preventDefault();
                    cancelHoldLever();
                  }}
                  className={`tactile-btn w-full py-4 rounded-xl font-mono font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 border-2 transition-all ${
                    isHolding
                      ? 'bg-yellow-400 text-black border-yellow-200 shadow-inner glow-yellow scale-98'
                      : 'bg-amber-950/70 text-amber-200 border-amber-500/80 hover:bg-amber-900'
                  }`}
                >
                  <Flame className={`w-4 h-4 ${isHolding ? 'animate-bounce' : ''}`} />
                  <span>{isHolding ? 'CHARGING LEVER...' : 'HOLD LEVER TO 100%'}</span>
                </button>
              </div>
            );
          }

          return null;
        })
      )}
    </div>
  );
}

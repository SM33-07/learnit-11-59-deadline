'use client';

import React, { useState, useRef } from 'react';
import { ControlWidget } from '@/lib/types';
import { Sliders, ToggleLeft, ToggleRight, Radio, Check, Flame } from 'lucide-react';

interface MobileControlBoardProps {
  widgets: ControlWidget[];
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

  const handleToggle = (widget: ControlWidget) => {
    triggerHaptic(40);
    const nextVal = !widget.currentValue;
    onAction(widget.id, nextVal);
  };

  const handlePushButton = (widget: ControlWidget) => {
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

  // Lever Hold Handlers
  const startHoldLever = (widget: ControlWidget) => {
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
        onAction(widget.id, requiredSec);
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
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2 px-1">
        <Radio className="w-5 h-5 text-yellow-400 animate-pulse" />
        <span className="font-mono text-xs uppercase tracking-widest text-yellow-300 font-bold">
          TACTILE CONTROLS (YELLOW)
        </span>
      </div>

      {widgets.length === 0 ? (
        <div className="bg-[#18150a] border-2 border-dashed border-yellow-500/40 rounded-2xl p-6 text-center text-slate-400 font-mono text-sm">
          Awaiting emergency control setup...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {widgets.map((widget) => {
            // 1. TOGGLE SWITCH
            if (widget.type === 'TOGGLE') {
              const isOn = Boolean(widget.currentValue);
              return (
                <button
                  key={widget.id}
                  onClick={() => handleToggle(widget)}
                  className={`tactile-btn p-5 rounded-2xl border-2 font-mono flex items-center justify-between transition-all shadow-lg ${
                    isOn
                      ? 'bg-yellow-500/20 border-yellow-400 text-yellow-200 glow-yellow'
                      : 'bg-black/60 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-black tracking-wide">{widget.label}</span>
                    <span className="text-[10px] text-slate-400 uppercase">
                      STATUS: {isOn ? 'ACTIVE (ON)' : 'STANDBY (OFF)'}
                    </span>
                  </div>
                  {isOn ? (
                    <ToggleRight className="w-9 h-9 text-yellow-400" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-600" />
                  )}
                </button>
              );
            }

            // 2. ROTARY DIAL
            if (widget.type === 'ROTARY_DIAL') {
              const currentVal = dialValues[widget.id] ?? (widget.currentValue || 50);
              return (
                <div
                  key={widget.id}
                  className="bg-black/60 border-2 border-amber-500/60 rounded-2xl p-5 shadow-lg glow-yellow flex flex-col gap-3 font-mono"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-amber-400 uppercase">{widget.label}</span>
                    <span className="text-xl font-black text-amber-300 bg-amber-950/60 px-3 py-0.5 rounded-lg border border-amber-500/40">
                      {currentVal}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={widget.min || 0}
                    max={widget.max || 100}
                    value={currentVal}
                    onChange={(e) => handleDialChange(widget.id, parseInt(e.target.value, 10))}
                    className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />

                  <button
                    onClick={() => handleDialSubmit(widget.id)}
                    className="tactile-btn w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>SET FREQUENCY</span>
                  </button>
                </div>
              );
            }

            // 3. PUSH BUTTON
            if (widget.type === 'PUSH_BUTTON') {
              return (
                <button
                  key={widget.id}
                  onClick={() => handlePushButton(widget)}
                  className="tactile-btn p-5 rounded-2xl border-2 border-yellow-500/70 bg-gradient-to-br from-yellow-950/40 to-black hover:border-yellow-300 text-yellow-300 font-mono flex items-center justify-between shadow-xl glow-yellow active:scale-95"
                >
                  <span className="text-base font-black tracking-wide">{widget.label}</span>
                  <span className="text-xs bg-yellow-400 text-black font-black px-3 py-1 rounded-lg">PRESS</span>
                </button>
              );
            }

            // 4. HOLD LEVER
            if (widget.type === 'HOLD_LEVER') {
              const isThisHolding = leverHolding === widget.id;
              return (
                <div
                  key={widget.id}
                  className="bg-black/60 border-2 border-rose-500/60 rounded-2xl p-5 shadow-lg glow-red flex flex-col gap-3 font-mono"
                >
                  <span className="text-xs font-black text-rose-400 uppercase">{widget.label}</span>

                  <button
                    onMouseDown={() => startHoldLever(widget)}
                    onMouseUp={cancelHoldLever}
                    onMouseLeave={cancelHoldLever}
                    onTouchStart={() => startHoldLever(widget)}
                    onTouchEnd={cancelHoldLever}
                    className={`tactile-btn py-4 rounded-xl font-black text-sm tracking-wider uppercase flex flex-col items-center justify-center relative overflow-hidden transition-all select-none ${
                      isThisHolding
                        ? 'bg-rose-600 text-white border-2 border-rose-400 scale-95 shadow-inner'
                        : 'bg-rose-950/60 text-rose-300 border border-rose-500/60 hover:bg-rose-900/60'
                    }`}
                  >
                    {/* Animated fill progress bar */}
                    {isThisHolding && (
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-rose-400/40 transition-all duration-75"
                        style={{ width: `${leverProgress}%` }}
                      />
                    )}
                    <span className="relative z-10">
                      {isThisHolding ? `HOLDING (${Math.round(leverProgress)}%)...` : 'PRESS & HOLD (2 SEC)'}
                    </span>
                  </button>
                </div>
              );
            }

            // 5. STEP SLIDER
            if (widget.type === 'SLIDER') {
              const steps = [25, 50, 75, 100];
              return (
                <div
                  key={widget.id}
                  className="bg-black/60 border-2 border-cyan-500/60 rounded-2xl p-5 shadow-lg glow-blue flex flex-col gap-3 font-mono"
                >
                  <span className="text-xs font-black text-cyan-400 uppercase">{widget.label}</span>
                  <div className="grid grid-cols-4 gap-2">
                    {steps.map((pct) => (
                      <button
                        key={pct}
                        onClick={() => handleSliderClick(widget.id, pct)}
                        className={`tactile-btn py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          widget.currentValue === pct
                            ? 'bg-cyan-500 text-black border-cyan-300 glow-blue font-black'
                            : 'bg-slate-900 text-cyan-300 border-cyan-500/40 hover:bg-cyan-950'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}

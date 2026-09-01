'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Wifi, Edit2, Check, Copy } from 'lucide-react';

interface QRCodeCardProps {
  roomCode: string;
  lanIp?: string;
  defaultPort?: number;
}

export function QRCodeCard({ roomCode, lanIp = 'localhost', defaultPort = 3000 }: QRCodeCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [customHost, setCustomHost] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let host = customHost;
    if (!host) {
      if (typeof window !== 'undefined') {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost && lanIp && lanIp !== 'localhost') {
          host = `http://${lanIp}:${window.location.port || defaultPort}`;
        } else {
          host = window.location.origin;
        }
      } else {
        host = `http://${lanIp}:${defaultPort}`;
      }
    }

    const url = `${host}/play/${roomCode}`;
    setJoinUrl(url);

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 250,
        margin: 1.5,
        color: {
          dark: '#05070c',
          light: '#fbbf24', // High-voltage glowing amber QR
        },
      });
    }
  }, [roomCode, lanIp, defaultPort, customHost]);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center arcade-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden max-w-sm w-full glow-yellow">
      {/* Top Hazard Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 hazard-tape" />

      {/* Header Badge */}
      <div className="flex items-center gap-2 mb-4 bg-amber-500/15 border border-amber-500/40 rounded-full px-4 py-1">
        <QrCode className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="font-mono text-xs uppercase tracking-widest text-amber-300 font-black">SCAN TO JOIN SQUAD</span>
      </div>

      {/* High-Voltage QR Frame */}
      <div className="bg-[#fbbf24] p-3 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.4)] border-4 border-amber-300 mb-4 flex justify-center transform hover:scale-[1.02] transition-transform">
        <canvas ref={canvasRef} className="rounded-xl max-w-full h-auto" />
      </div>

      {/* Room Code Badge */}
      <div className="text-center w-full mb-4 bg-[#05070c] border border-amber-500/40 rounded-2xl py-2.5 px-4 shadow-inner">
        <span className="text-[10px] text-amber-400/70 font-mono tracking-widest uppercase block font-bold">ROOM CODE</span>
        <span className="font-mono text-3xl font-black tracking-widest text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">
          {roomCode}
        </span>
      </div>

      {/* Direct URL & Quick Copy */}
      <div className="w-full">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1.5 px-1">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300">Or enter URL on phone:</span>
          </div>
          <button
            onClick={handleCopy}
            title="Copy URL"
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[10px] font-bold"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'COPIED!' : 'COPY'}</span>
          </button>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={customHost}
              placeholder="e.g. http://192.168.1.50:3000"
              onChange={(e) => setCustomHost(e.target.value)}
              className="bg-black/80 border border-amber-500/60 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono w-full focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 bg-amber-500 text-black rounded-xl hover:bg-amber-400 font-bold"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-black/60 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-[11px] text-amber-300/90 font-mono truncate max-w-[200px]">{joinUrl}</span>
            <button
              onClick={() => setIsEditing(true)}
              title="Edit Host IP"
              className="text-slate-500 hover:text-amber-400 p-1"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

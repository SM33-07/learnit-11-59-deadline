'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Wifi, Edit2, Check, RefreshCw } from 'lucide-react';

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
        width: 260,
        margin: 2,
        color: {
          dark: '#07090e',
          light: '#facc15', // Neon amber QR code on dark background!
        },
      });
    }
  }, [roomCode, lanIp, defaultPort, customHost]);

  return (
    <div className="flex flex-col items-center bg-[#10141f]/90 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur-md max-w-sm w-full glow-yellow">
      <div className="flex items-center gap-2 mb-3">
        <QrCode className="w-6 h-6 text-amber-400 animate-pulse" />
        <span className="font-mono text-xs uppercase tracking-widest text-amber-300 font-bold">SCAN TO JOIN ROOM</span>
      </div>

      {/* QR Canvas */}
      <div className="bg-amber-400 p-3 rounded-xl shadow-inner border-2 border-amber-300 mb-4 flex justify-center">
        <canvas ref={canvasRef} className="rounded-lg max-w-full h-auto" />
      </div>

      {/* Room Code Callout */}
      <div className="text-center w-full mb-3 bg-[#07090e] border border-amber-500/30 rounded-xl py-2 px-4">
        <span className="text-xs text-slate-400 font-mono block">ROOM CODE</span>
        <span className="font-mono text-3xl font-black tracking-wider text-amber-400">{roomCode}</span>
      </div>

      {/* Direct URL info */}
      <div className="w-full text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>Point phone camera or open:</span>
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-1 mt-1">
            <input
              type="text"
              value={customHost}
              placeholder="e.g. http://192.168.1.50:3000"
              onChange={(e) => setCustomHost(e.target.value)}
              className="bg-black/60 border border-amber-500/50 rounded px-2 py-1 text-xs text-amber-300 font-mono w-full focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 bg-amber-500 text-black rounded hover:bg-amber-400"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span className="text-[11px] text-amber-300/80 font-mono break-all max-w-[240px] truncate">{joinUrl}</span>
            <button
              onClick={() => setIsEditing(true)}
              title="Edit host IP/URL"
              className="text-slate-400 hover:text-amber-300 p-1"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#06080d] text-slate-100 font-mono">
          <div className="max-w-md w-full bg-[#0d131f] border-2 border-rose-500 rounded-3xl p-6 sm:p-8 shadow-2xl glow-red flex flex-col items-center text-center gap-5">
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl">
              <AlertTriangle className="w-10 h-10 text-rose-400" />
            </div>

            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              MISSION SYSTEM INTERRUPTED
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              A client-side exception occurred. The mission control session can be restored instantly.
            </p>

            {this.state.error?.message && (
              <div className="w-full bg-black/60 border border-rose-500/30 rounded-xl p-3 text-[11px] text-rose-300 font-mono text-left break-words max-h-24 overflow-y-auto">
                <code>{this.state.error.message}</code>
              </div>
            )}

            <div className="flex flex-col w-full gap-2.5 pt-2">
              <button
                onClick={this.handleReset}
                className="tactile-btn w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-yellow"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RELOAD & RECOVER SESSION</span>
              </button>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                <span>RETURN TO HOME</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error caught by Teiln ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      this.setState({ hasError: false, error: null });
      window.location.reload();
    } catch {
      window.location.href = '/';
    }
  };

  private handleClearStorageAndReload = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080b11] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0e1424] border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-display font-bold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Teiln ran into an unexpected error while loading this session. You can try refreshing the page or clearing the local cache.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearStorageAndReload}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
              >
                Reset Local Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

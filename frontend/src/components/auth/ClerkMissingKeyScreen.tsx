import React from 'react';
import { ShieldAlert, KeyRound, Terminal, ExternalLink } from 'lucide-react';
import { FinSageLogo } from '@/components/brand/FinSageLogo';

export const ClerkMissingKeyScreen: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-4 py-8 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-rose-500/30 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <FinSageLogo variant="horizontal" height={32} />
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Clerk Configuration Required
        </h2>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          FinSage requires a valid Clerk Publishable Key to initialize authentication. The frontend cannot securely proceed without it.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
              <KeyRound className="h-4 w-4" />
              <span>Required Environment Variable</span>
            </div>
            <div className="mt-2 rounded-xl bg-slate-900 px-3 py-2 font-mono text-xs text-amber-300 border border-slate-800">
              VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Terminal className="h-4 w-4 text-slate-400" />
              <span>Setup Steps</span>
            </div>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs text-slate-400">
              <li>Open your Clerk Dashboard at <span className="text-teal-300 font-medium">dashboard.clerk.com</span>.</li>
              <li>Copy your <strong>Publishable key</strong> (starts with <code className="text-slate-200">pk_test_</code>).</li>
              <li>Add it to <code className="text-slate-200">frontend/.env</code> or your deployment environment.</li>
              <li>Restart the Vite development server.</li>
            </ol>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="https://clerk.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <span>Clerk Documentation</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>
          <button
            onClick={() => window.location.reload()}
            className="flex flex-1 items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-teal-500 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
};

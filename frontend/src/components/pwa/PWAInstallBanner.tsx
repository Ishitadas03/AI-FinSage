import React from 'react';
import { usePWAInstall } from '@/context/PWAInstallContext';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, showBanner, promptInstall, dismissBanner } = usePWAInstall();

  if (isInstalled || !showBanner || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-teal-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img
            src="/images/finsage-emblem.png"
            alt="FinSage"
            className="h-10 w-10 shrink-0 rounded-xl object-contain p-0.5 bg-white border border-slate-200/80 shadow-2xs"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">Install FinSage App</span>
              <span className="rounded bg-teal-50 px-1.5 py-0.2 text-[9px] font-bold text-teal-800 border border-teal-200">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Fast, standalone & offline-ready finance tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={promptInstall}
            className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-800 active:scale-95 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={dismissBanner}
            aria-label="Dismiss installation banner"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

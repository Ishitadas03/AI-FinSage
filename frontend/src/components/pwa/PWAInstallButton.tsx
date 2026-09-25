import React from 'react';
import { usePWAInstall } from '@/context/PWAInstallContext';
import { Download, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'primary' | 'outline' | 'compact';
  label?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className,
  variant = 'primary',
  label = 'Install App',
}) => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  if (isInstalled || !isInstallable) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={promptInstall}
        title="Install FinSage App"
        className={cn(
          "flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors shadow-2xs",
          className
        )}
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden xs:inline">{label}</span>
      </button>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        onClick={promptInstall}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border border-teal-300 bg-white px-4 py-2.5 text-xs font-semibold text-teal-800 shadow-2xs hover:bg-teal-50 transition-all active:scale-98",
          className
        )}
      >
        <Smartphone className="h-4 w-4 text-teal-600" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={promptInstall}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-all active:scale-98",
        className
      )}
    >
      <Download className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
};

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FinSageLoaderProps {
  /** If true, the loader renders as a full-screen fixed splash overlay */
  isFullScreen?: boolean;
  /** Explicit duration for auto-progress in ms (default: 1600ms) */
  duration?: number;
  /** Optional callback fired when the loading animation and fade-out completes */
  onFinish?: () => void;
  /** Controlled progress value (0 to 100). If provided, automatic animation is disabled */
  progress?: number;
  /** If false, initiates the smooth fade-out sequence */
  isLoading?: boolean;
  /** Optional custom class name */
  className?: string;
}

export const FinSageLoader: React.FC<FinSageLoaderProps> = ({
  isFullScreen = true,
  duration = 1600,
  onFinish,
  progress: controlledProgress,
  isLoading = true,
  className,
}) => {
  const [internalProgress, setInternalProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Determine current active progress (0 - 100)
  const currentProgress = controlledProgress !== undefined ? controlledProgress : internalProgress;

  // Auto-progress timer if not externally controlled
  useEffect(() => {
    if (controlledProgress !== undefined) {
      if (controlledProgress >= 100 && isLoading === false) {
        setIsFadingOut(true);
        const timer = setTimeout(() => {
          setIsMounted(false);
          onFinish?.();
        }, 500);
        return () => clearTimeout(timer);
      }
      return;
    }

    const startTime = performance.now();
    let animationFrameId: number;

    const updateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      // Easing function for natural, snappy initial fill with smooth finish
      const rawRatio = Math.min(elapsed / duration, 1);
      // Cubic ease-out curve
      const easedProgress = Math.min(100, Math.round((1 - Math.pow(1 - rawRatio, 2.5)) * 100));

      setInternalProgress(easedProgress);

      if (rawRatio < 1) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        // Completed loading
        setInternalProgress(100);
        if (onFinish) {
          setIsFadingOut(true);
          setTimeout(() => {
            setIsMounted(false);
            onFinish();
          }, 450);
        }
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [controlledProgress, duration, isLoading, onFinish]);

  // Handle external isLoading false trigger
  useEffect(() => {
    if (!isLoading && !isFadingOut && onFinish) {
      setInternalProgress(100);
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setIsMounted(false);
        onFinish();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isFadingOut, onFinish]);

  if (!isMounted) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading FinSage"
      aria-valuenow={currentProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'bg-white text-[#0F172A] flex flex-col items-center justify-center select-none overflow-hidden transition-opacity duration-500 ease-out z-[99999]',
        isFullScreen ? 'fixed inset-0 w-screen h-screen' : 'relative w-full h-full min-h-[400px]',
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100',
        className
      )}
    >
      {/* ========================================================================= */}
      {/* TOP-LEFT ABSTRACT CORNER WAVES & GRADIENT ACCENTS                         */}
      {/* ========================================================================= */}
      <div
        className="absolute -top-12 -left-12 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] pointer-events-none select-none opacity-80"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="topLeftGlow" cx="20%" cy="20%" r="80%">
              <stop offset="0%" stopColor="#CCFBF1" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#DFF7F1" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#ECFDF5" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="topLeftWave1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0F766E" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="topLeftWave2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Soft Radial Ambient Aura */}
          <circle cx="100" cy="100" r="260" fill="url(#topLeftGlow)" />

          {/* Organic Flowing Wave Shapes */}
          <path
            d="M-50,220 C60,200 120,130 150,70 C180,10 210,-20 280,-40 L-50,-50 Z"
            fill="url(#topLeftWave1)"
          />
          <path
            d="M-40,160 C40,150 90,90 120,40 C150,-10 180,-30 230,-40"
            stroke="url(#topLeftWave2)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M-40,240 C80,210 150,150 190,80 C230,10 260,-10 330,-30"
            stroke="#14B8A6"
            strokeOpacity="0.25"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM-RIGHT ABSTRACT CORNER WAVES & GRADIENT ACCENTS                      */}
      {/* ========================================================================= */}
      <div
        className="absolute -bottom-16 -right-16 w-[360px] h-[360px] sm:w-[520px] sm:h-[520px] pointer-events-none select-none opacity-80"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="bottomRightGlow" cx="80%" cy="80%" r="80%">
              <stop offset="0%" stopColor="#CCFBF1" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#DFF7F1" stopOpacity="0.5" />
              <stop offset="75%" stopColor="#ECFDF5" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bottomRightWave1" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0F766E" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="bottomRightWave2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Soft Radial Ambient Aura */}
          <circle cx="300" cy="300" r="280" fill="url(#bottomRightGlow)" />

          {/* Organic Flowing Wave Shapes */}
          <path
            d="M450,180 C340,200 280,270 250,330 C220,390 190,420 120,440 L450,450 Z"
            fill="url(#bottomRightWave1)"
          />
          <path
            d="M440,240 C360,250 310,310 280,360 C250,410 220,430 170,440"
            stroke="url(#bottomRightWave2)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M440,160 C320,190 250,250 210,320 C170,390 140,410 70,430"
            stroke="#14B8A6"
            strokeOpacity="0.25"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* CENTER CONTENT: LOGO & MINIMAL PROGRESS BAR                                */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex flex-col items-center justify-center animate-in fade-in-50 zoom-in-95 duration-700 ease-out">
        
        {/* FinSage Leaf Brand Icon */}
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <svg
            className="w-14 h-14 sm:w-16 sm:h-16 transform transition-transform duration-700 hover:scale-105"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="finsageLeafGrad" x1="15%" y1="90%" x2="85%" y2="10%">
                <stop offset="0%" stopColor="#0F766E" />
                <stop offset="50%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#2DD4BF" />
              </linearGradient>
              <filter id="leafShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F766E" floodOpacity="0.15" />
              </filter>
            </defs>
            {/* Smooth stylized leaf */}
            <path
              d="M12 50 C12 50 14 30 32 16 C46 5 54 8 54 8 C54 8 57 18 48 34 C36 54 18 53 12 50 Z"
              fill="url(#finsageLeafGrad)"
              filter="url(#leafShadow)"
            />
            {/* Center vein line */}
            <path
              d="M12 50 Q 28 36 54 8"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.9"
            />
          </svg>
        </div>

        {/* FinSage Wordmark */}
        <div className="text-center tracking-tight mb-8 sm:mb-9">
          <span className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Fin
          </span>
          <span className="text-3xl sm:text-4xl font-extrabold text-[#0F766E] tracking-tight">
            Sage
          </span>
        </div>

        {/* Minimal Horizontal Progress Bar */}
        <div className="w-[260px] sm:w-[360px] h-[5px] bg-[#E2E8F0] rounded-full overflow-hidden relative shadow-2xs">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#2DD4BF] transition-all duration-150 ease-out relative"
            style={{ width: `${Math.min(Math.max(currentProgress, 4), 100)}%` }}
          >
            {/* Subtle soft leading edge glow */}
            <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/40 blur-xs rounded-full" />
          </div>
        </div>

      </div>

    </div>
  );
};

export default FinSageLoader;

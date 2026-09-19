import React from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  BarChart3,
  Target,
  ShieldCheck,
  Sparkles,
  Quote,
} from 'lucide-react';

export const AuthBrandPanel: React.FC = () => {
  return (
    <div className="flex flex-col justify-between h-full p-8 sm:p-12 lg:p-14 bg-gradient-to-b from-[#F3F9F9] via-[#EAF4F4] to-[#E2EFEF] relative overflow-hidden select-none">
      
      {/* Soft background ambient gradient glow */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl pointer-events-none" />

      {/* Top Header & Brand */}
      <div className="relative z-10 space-y-8">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-700 border border-teal-200/80 shadow-xs transition-all group-hover:scale-105 group-hover:bg-teal-50">
            <Leaf className="h-6.5 w-6.5 transform -rotate-12 fill-teal-600/20 text-teal-700 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-slate-900 leading-none block">
              FinSage
            </span>
            <span className="text-[11px] font-medium text-slate-500 tracking-tight mt-0.5 block">
              Smarter Money. Brighter Tomorrow.
            </span>
          </div>
        </Link>

        {/* Pill Badge */}
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100/70 border border-teal-300/60 px-3 py-1 text-[11px] font-bold text-teal-900 shadow-2xs">
            <Sparkles className="h-3 w-3 text-teal-700" />
            <span>YOUR FINANCIAL COPILOT</span>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-slate-900 leading-[1.12]">
            Welcome back<br />
            to a brighter<br />
            <span className="text-teal-700">financial future.</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md font-normal">
            Sign in to continue your journey towards better money management, smarter decisions, and a more secure tomorrow.
          </p>
        </div>

        {/* 4 Compact Feature Rows */}
        <div className="space-y-3.5 pt-2">
          {/* Feature 1 */}
          <div className="flex items-start gap-3.5 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-2xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Track Smarter</div>
              <div className="text-[11px] text-slate-500">Get a clear view of your money.</div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start gap-3.5 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-2xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Plan Confidently</div>
              <div className="text-[11px] text-slate-500">Turn your goals into reality.</div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-start gap-3.5 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-2xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Stay Protected</div>
              <div className="text-[11px] text-slate-500">Keep your financial data safe and private.</div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex items-start gap-3.5 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-2xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Get AI Insights</div>
              <div className="text-[11px] text-slate-500">Personalized insights for a better financial future.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Visual: Landscape & Quote Card */}
      <div className="relative mt-6 sm:mt-8">
        
        {/* Handwritten Callout with Arrow */}
        <div className="flex flex-col items-end pr-4 mb-2.5 select-none">
          <div className="font-serif italic text-teal-950 text-xs sm:text-sm font-bold leading-tight rotate-[-3deg] tracking-tight">
            Better Habits<br />
            Brighter Tomorrows
          </div>
          <svg
            className="w-14 h-5 text-teal-800 mr-1 mt-0.5 opacity-80"
            viewBox="0 0 100 35"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 8 Q 50 28 88 18" />
            <path d="M76 10 L 90 18 L 78 26" />
          </svg>
        </div>

        {/* Mountain Horizon Landscape Composition (SVG Vector Artwork) */}
        <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden shadow-md border border-teal-200/50 bg-gradient-to-t from-teal-950 via-teal-900 to-teal-800">
          
          {/* Sunrise Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-amber-200/30 blur-2xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-amber-100/60 blur-md" />

          {/* Mountains & River Paths */}
          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 400 200"
          >
            <defs>
              <linearGradient id="mtnBack" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2A6A67" />
                <stop offset="100%" stopColor="#154D4B" />
              </linearGradient>
              <linearGradient id="mtnMid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1C5553" />
                <stop offset="100%" stopColor="#0E3836" />
              </linearGradient>
              <linearGradient id="mtnFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0E3A38" />
                <stop offset="100%" stopColor="#072221" />
              </linearGradient>
              <linearGradient id="riverGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#5EEAD4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0F766E" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Back Mountain Peaks */}
            <polygon points="0,110 90,40 180,120 280,35 400,115 400,200 0,200" fill="url(#mtnBack)" />
            <polygon points="90,40 110,65 140,110 70,110" fill="#438E8B" opacity="0.4" />
            <polygon points="280,35 310,70 340,115 250,115" fill="#438E8B" opacity="0.4" />

            {/* Middle Mountains */}
            <polygon points="0,140 120,70 230,150 330,80 400,145 400,200 0,200" fill="url(#mtnMid)" />

            {/* Flowing River of Light / Pathway */}
            <path
              d="M 200 80 Q 210 120 180 145 Q 150 170 190 200 L 220 200 Q 185 170 215 145 Q 230 120 205 80 Z"
              fill="url(#riverGlow)"
            />

            {/* Front Foothills & Trees */}
            <polygon points="0,165 70,125 160,180 270,140 400,185 400,200 0,200" fill="url(#mtnFront)" />

            {/* Pine Tree Silhouettes */}
            <polygon points="20,160 25,145 30,160 27,160 27,166 23,166 23,160" fill="#041413" />
            <polygon points="35,165 42,148 49,165 46,165 46,172 38,172 38,165" fill="#041413" />
            <polygon points="55,170 63,150 71,170 68,170 68,178 58,178 58,170" fill="#041413" />
            <polygon points="310,165 318,145 326,165 323,165 323,172 313,172 313,165" fill="#041413" />
            <polygon points="335,160 342,142 349,160 346,160 346,168 338,168 338,160" fill="#041413" />
            <polygon points="360,170 368,148 376,170 373,170 373,178 363,178 363,170" fill="#041413" />
          </svg>

          {/* Glassmorphic Quote Card Overlay */}
          <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-xs rounded-xl bg-teal-950/60 backdrop-blur-md border border-white/15 p-3 text-white shadow-lg space-y-1">
            <div className="flex items-center gap-1.5 text-teal-300">
              <Quote className="h-3.5 w-3.5 rotate-180 fill-teal-400/40" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">FinSage Philosophy</span>
            </div>
            <p className="text-[11px] font-medium text-slate-100 leading-snug">
              “A better financial future starts with a single step.”
            </p>
            <div className="text-[10px] text-teal-300/80 font-medium">
              — FinSage
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

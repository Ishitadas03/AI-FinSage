import React from 'react';
import { Target, Sparkles, TrendingUp, ShieldCheck, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingFeatureCardProps {
  iconType: 'target' | 'sparkles' | 'chart' | 'shield';
  title: string;
  description: string;
  className?: string;
  iconBgColor?: string;
  iconColor?: string;
}

export const FloatingFeatureCard: React.FC<FloatingFeatureCardProps> = ({
  iconType,
  title,
  description,
  className,
  iconBgColor = 'bg-teal-50',
  iconColor = 'text-teal-700',
}) => {
  const getIcon = () => {
    switch (iconType) {
      case 'target':
        return Target;
      case 'sparkles':
        return Sparkles;
      case 'chart':
        return TrendingUp;
      case 'shield':
        return ShieldCheck;
      default:
        return Sparkles;
    }
  };

  const Icon = getIcon();

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 sm:p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_35px_rgba(15,23,42,0.12)] hover:border-teal-300 group cursor-default",
        className
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-300 group-hover:scale-110",
          iconBgColor,
          iconColor
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
          {title}
        </h4>
        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
          {description}
        </p>
      </div>
    </div>
  );
};

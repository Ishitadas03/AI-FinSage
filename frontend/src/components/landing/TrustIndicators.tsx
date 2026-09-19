import React from 'react';
import { Check } from 'lucide-react';

export const TrustIndicators: React.FC = () => {
  const indicators = [
    'No bank connection required',
    'Free to get started',
    'Your data stays private',
  ];

  return (
    <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-500 pt-1">
      {indicators.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1.5 font-medium">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80">
            <Check className="h-2.5 w-2.5 stroke-[3]" />
          </div>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
};

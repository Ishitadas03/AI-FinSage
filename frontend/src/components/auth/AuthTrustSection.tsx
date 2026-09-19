import React from 'react';

export const AuthTrustSection: React.FC = () => {
  return (
    <div className="pt-6 text-center space-y-3 relative select-none">
      <p className="text-xs text-slate-500 font-medium">
        Trusted by people who care about a smarter financial future.
      </p>

      {/* Visual Avatar Stack */}
      <div className="flex items-center justify-center gap-2">
        <div className="flex -space-x-2 overflow-hidden">
          <img
            className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="User"
          />
          <img
            className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
            alt="User"
          />
          <img
            className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
            alt="User"
          />
          <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-800 ring-2 ring-white">
            10K+
          </div>
        </div>
        <span className="text-[11px] font-medium text-slate-400">and counting...</span>
      </div>
    </div>
  );
};

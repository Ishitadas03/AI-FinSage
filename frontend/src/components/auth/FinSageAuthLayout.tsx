import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthBrandPanel } from './AuthBrandPanel';
import { AuthTrustSection } from './AuthTrustSection';
import { ArrowRight, Leaf } from 'lucide-react';

interface FinSageAuthLayoutProps {
  children: React.ReactNode;
  headerActionText?: string;
  headerButtonText?: string;
  headerButtonLink?: string;
  onHeaderActionClick?: () => void;
}

export const FinSageAuthLayout: React.FC<FinSageAuthLayoutProps> = ({
  children,
  headerActionText = "Don't have an account?",
  headerButtonText = "Get Started",
  headerButtonLink = "/dashboard",
  onHeaderActionClick,
}) => {
  const navigate = useNavigate();

  const handleHeaderAction = () => {
    if (onHeaderActionClick) {
      onHeaderActionClick();
    } else {
      navigate(headerButtonLink);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFA] text-slate-900 flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900 font-sans">
      
      {/* Split-Screen Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* Left Side: Brand Experience (~48% on desktop) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-5 border-r border-slate-200/80 bg-gradient-to-b from-[#F3F9F9] to-[#E5F1F1] relative">
          <AuthBrandPanel />
        </div>

        {/* Mobile / Tablet Header (Visible only on < lg screens) */}
        <div className="lg:hidden p-6 pb-2 flex items-center justify-between border-b border-slate-100 bg-[#F8FAFA]">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50/90 text-teal-700 border border-teal-200/60 shadow-xs">
              <Leaf className="h-5.5 w-5.5 stroke-[2.2] transform -rotate-12 fill-teal-600/20" />
            </div>
            <span className="font-bold text-slate-900 text-lg">FinSage</span>
          </Link>

          <button
            onClick={handleHeaderAction}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <span>{headerButtonText}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Right Side: Form & Trust (~52% on desktop) */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 relative overflow-y-auto">
          
          {/* Top-Right Account Switcher Header (Desktop only) */}
          <div className="hidden lg:flex items-center justify-end gap-3 text-xs">
            <span className="text-slate-500 font-medium">{headerActionText}</span>
            <button
              onClick={handleHeaderAction}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-98"
            >
              <span>{headerButtonText}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-600" />
            </button>
          </div>

          {/* Centered Form Children */}
          <div className="my-auto py-6 sm:py-8 flex flex-col items-center justify-center w-full">
            {children}
          </div>

          {/* Bottom Trust Section */}
          <div className="mt-auto">
            <AuthTrustSection />
          </div>

        </div>

      </div>

    </div>
  );
};

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicNavbar } from '@/components/landing/PublicNavbar';
import { PublicFooter } from '@/components/landing/PublicFooter';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFA] text-slate-900 flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900 font-sans">
      <PublicNavbar />
      <main className="flex-1">
        <div key={location.pathname} className="animate-fade-in-up">
          {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

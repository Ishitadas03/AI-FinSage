import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { AICopilotDrawer } from '../modals/AICopilotDrawer';
import { GlobalSearchModal } from '../modals/GlobalSearchModal';
import { OnboardingWizard } from '../modals/OnboardingWizard';
import { AddTransactionModal } from '../modals/AddTransactionModal';
import { AddGoalModal } from '../modals/AddGoalModal';
import { ImportStatementModal } from '../modals/ImportStatementModal';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900 flex flex-col antialiased overflow-x-hidden">
      {/* Sidebar for Desktop & Mobile Overlay Drawer */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area shifted right on desktop */}
      <div className="flex flex-1 flex-col lg:pl-64 transition-all duration-200 min-w-0">
        <Topbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 px-3.5 py-4 sm:p-6 lg:p-8 pb-24 sm:pb-28 lg:pb-8 max-w-7xl w-full mx-auto overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar (< lg screens) */}
      <BottomNav />

      {/* Global Modals & Drawers */}
      <AICopilotDrawer />
      <GlobalSearchModal />
      <OnboardingWizard />
      <AddTransactionModal />
      <AddGoalModal />
      <ImportStatementModal />
    </div>
  );
};

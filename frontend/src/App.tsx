import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FinanceProvider } from "@/context/FinanceContext";
import { AppShell } from "@/components/layout/AppShell";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { FinSageLoader } from "@/components/FinSageLoader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Landing & App Pages
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Spending } from "./pages/Spending";
import { Budgets } from "./pages/Budgets";
import { Goals } from "./pages/Goals";
import { FutureSelf } from "./pages/FutureSelf";
import { DebtEMI } from "./pages/DebtEMI";
import { ScamShield } from "./pages/ScamShield";
import { FinancialHealth } from "./pages/FinancialHealth";
import { AIReport } from "./pages/AIReport";
import { MarketIntel } from "./pages/MarketIntel";
import { Settings } from "./pages/Settings";
import { HelpSupport } from "./pages/HelpSupport";
import NotFound from "./pages/NotFound";

// Public Pages
import { FeaturesPage } from "./pages/public/FeaturesPage";
import { SecurityPage } from "./pages/public/SecurityPage";
import { PricingPage } from "./pages/public/PricingPage";
import { AboutPage } from "./pages/public/AboutPage";
import { HelpPage } from "./pages/public/HelpPage";
import { FaqPage } from "./pages/public/FaqPage";
import { ContactPage } from "./pages/public/ContactPage";
import { SignInPage } from "./pages/public/auth/SignInPage";
import { SignUpPage } from "./pages/public/auth/SignUpPage";
import { ClerkProvider } from "@clerk/react";
import { ClerkAuthBridge } from "@/components/auth/ClerkAuthBridge";
import { ClerkMissingKeyScreen } from "@/components/auth/ClerkMissingKeyScreen";

// Resource Guides
import { PersonalFinanceBasicsPage } from "./pages/public/resources/PersonalFinanceBasicsPage";
import { BudgetingGuidePage } from "./pages/public/resources/BudgetingGuidePage";
import { EmiGuidePage } from "./pages/public/resources/EmiGuidePage";
import { EmergencyFundGuidePage } from "./pages/public/resources/EmergencyFundGuidePage";
import { FinancialHealthGuidePage } from "./pages/public/resources/FinancialHealthGuidePage";

// Financial Calculators
import { EmiCalculatorPage } from "./pages/public/calculators/EmiCalculatorPage";
import { SavingsCalculatorPage } from "./pages/public/calculators/SavingsCalculatorPage";
import { CompoundInterestPage } from "./pages/public/calculators/CompoundInterestPage";
import { GoalCalculatorPage } from "./pages/public/calculators/GoalCalculatorPage";
import { PWAInstallProvider } from "@/context/PWAInstallContext";
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner";

const queryClient = new QueryClient();

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const App = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  if (!CLERK_PUBLISHABLE_KEY || CLERK_PUBLISHABLE_KEY.trim() === '' || CLERK_PUBLISHABLE_KEY.includes('YOUR_CLERK_KEY')) {
    return <ClerkMissingKeyScreen />;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ClerkAuthBridge>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-right" richColors />
            <PWAInstallProvider>
              {isInitialLoading && (
                <FinSageLoader
                  isFullScreen={true}
                  duration={1500}
                  onFinish={() => setIsInitialLoading(false)}
                />
              )}
              <PWAInstallBanner />
              <FinanceProvider>
              <BrowserRouter>
                <Routes>
                  {/* Standalone Loader Preview Routes */}
                  <Route path="/loader" element={<FinSageLoader isFullScreen={true} duration={3000} />} />
                  <Route path="/splash" element={<FinSageLoader isFullScreen={true} duration={3000} />} />

                  {/* Landing Page */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/landing" element={<Landing />} />

                  {/* Authentication Routes */}
                  <Route path="/signin/*" element={<SignInPage />} />
                  <Route path="/signin" element={<SignInPage />} />
                  <Route path="/login" element={<SignInPage />} />
                  <Route path="/signup/*" element={<SignUpPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/register" element={<SignUpPage />} />

              {/* Core Public Company Pages */}
              <Route
                path="/features"
                element={
                  <PublicLayout>
                    <FeaturesPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/security"
                element={
                  <PublicLayout>
                    <SecurityPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/pricing"
                element={
                  <PublicLayout>
                    <PricingPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/about"
                element={
                  <PublicLayout>
                    <AboutPage />
                  </PublicLayout>
                }
              />

              {/* Educational Resource Guides */}
              <Route
                path="/resources/personal-finance-basics"
                element={
                  <PublicLayout>
                    <PersonalFinanceBasicsPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/resources/budgeting"
                element={
                  <PublicLayout>
                    <BudgetingGuidePage />
                  </PublicLayout>
                }
              />
              <Route
                path="/resources/emi-guide"
                element={
                  <PublicLayout>
                    <EmiGuidePage />
                  </PublicLayout>
                }
              />
              <Route
                path="/resources/emergency-fund"
                element={
                  <PublicLayout>
                    <EmergencyFundGuidePage />
                  </PublicLayout>
                }
              />
              <Route
                path="/resources/financial-health"
                element={
                  <PublicLayout>
                    <FinancialHealthGuidePage />
                  </PublicLayout>
                }
              />

              {/* Financial Planning Calculators */}
              <Route
                path="/tools/emi-calculator"
                element={
                  <PublicLayout>
                    <EmiCalculatorPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/tools/savings-calculator"
                element={
                  <PublicLayout>
                    <SavingsCalculatorPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/tools/compound-interest"
                element={
                  <PublicLayout>
                    <CompoundInterestPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/tools/goal-calculator"
                element={
                  <PublicLayout>
                    <GoalCalculatorPage />
                  </PublicLayout>
                }
              />

              {/* Help & Support Public Pages */}
              <Route
                path="/help"
                element={
                  <PublicLayout>
                    <HelpPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/faq"
                element={
                  <PublicLayout>
                    <FaqPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/contact"
                element={
                  <PublicLayout>
                    <ContactPage />
                  </PublicLayout>
                }
              />

              {/* Dashboard & FinTech Application Core App Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Dashboard />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Transactions />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spending"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Spending />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/budgets"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Budgets />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goals"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Goals />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/future-self"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <FutureSelf />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/debt-emi"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <DebtEMI />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scam-shield"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <ScamShield />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/financial-health"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <FinancialHealth />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-report"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <AIReport />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/market-intel"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <MarketIntel />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Settings />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help-support"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <HelpSupport />
                    </AppShell>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </FinanceProvider>
        </PWAInstallProvider>
      </TooltipProvider>
    </QueryClientProvider>
    </ClerkAuthBridge>
    </ClerkProvider>
  );
};

export default App;

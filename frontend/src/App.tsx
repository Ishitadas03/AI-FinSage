import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FinanceProvider } from "@/context/FinanceContext";
import { AppShell } from "@/components/layout/AppShell";
import { PublicLayout } from "@/components/layout/PublicLayout";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <FinanceProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<Landing />} />
            <Route path="/landing" element={<Landing />} />

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

            {/* Dashboard & FinTech Application Core App Routes */}
            <Route
              path="/dashboard"
              element={
                <AppShell>
                  <Dashboard />
                </AppShell>
              }
            />
            <Route
              path="/transactions"
              element={
                <AppShell>
                  <Transactions />
                </AppShell>
              }
            />
            <Route
              path="/spending"
              element={
                <AppShell>
                  <Spending />
                </AppShell>
              }
            />
            <Route
              path="/budgets"
              element={
                <AppShell>
                  <Budgets />
                </AppShell>
              }
            />
            <Route
              path="/goals"
              element={
                <AppShell>
                  <Goals />
                </AppShell>
              }
            />
            <Route
              path="/future-self"
              element={
                <AppShell>
                  <FutureSelf />
                </AppShell>
              }
            />
            <Route
              path="/debt-emi"
              element={
                <AppShell>
                  <DebtEMI />
                </AppShell>
              }
            />
            <Route
              path="/scam-shield"
              element={
                <AppShell>
                  <ScamShield />
                </AppShell>
              }
            />
            <Route
              path="/financial-health"
              element={
                <AppShell>
                  <FinancialHealth />
                </AppShell>
              }
            />
            <Route
              path="/ai-report"
              element={
                <AppShell>
                  <AIReport />
                </AppShell>
              }
            />
            <Route
              path="/market-intel"
              element={
                <AppShell>
                  <MarketIntel />
                </AppShell>
              }
            />
            <Route
              path="/settings"
              element={
                <AppShell>
                  <Settings />
                </AppShell>
              }
            />
            <Route
              path="/help-support"
              element={
                <AppShell>
                  <HelpSupport />
                </AppShell>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FinanceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FinanceProvider } from "@/context/FinanceContext";
import { AppShell } from "@/components/layout/AppShell";

// Pages
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <FinanceProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
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

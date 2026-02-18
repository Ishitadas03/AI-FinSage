import { useState } from "react";
import { motion } from "framer-motion";
import SidebarNav from "@/components/SidebarNav";
import StatsBar from "@/components/StatsBar";
import FutureSimulator from "@/components/FutureSimulator";
import EmotionHeatmap from "@/components/EmotionHeatmap";
import EMIStressPanel from "@/components/EMIStressPanel";
import ScamShield from "@/components/ScamShield";
import GovSchemes from "@/components/GovSchemes";
import MarketIntel from "@/components/MarketIntel";
import GoalTracker from "@/components/GoalTracker";
import FinanceReportCard from "@/components/FinanceReportCard";
import { Bell, Search, Sparkles } from "lucide-react";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <div className="flex min-h-screen bg-background grid-bg">
      <SidebarNav activeSection={activeSection} onNavigate={setActiveSection} />

      <main className="ml-[72px] flex-1 lg:ml-[220px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6 py-3">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Fin<span className="text-gradient-primary">Sage</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary ml-1">AI</span>
            </h1>
            <p className="text-[11px] text-muted-foreground">Your AI-powered financial co-pilot</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <Search className="h-4 w-4" />
            </button>
            <button className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive animate-pulse-glow" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              RS
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-6 space-y-6">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-5"
          >
            <h2 className="text-base font-semibold text-foreground">Good morning, Rahul 👋</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your financial health score is <span className="text-primary font-semibold">69/100</span>.
              3 action items need attention today.
            </p>
          </motion.div>

          {/* Stats */}
          <StatsBar />

          {/* Main grid */}
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <FutureSimulator />
            </div>
            <div>
              <FinanceReportCard />
            </div>
            <div>
              <EmotionHeatmap />
            </div>
            <div>
              <EMIStressPanel />
            </div>
            <div>
              <ScamShield />
            </div>
            <div>
              <GovSchemes />
            </div>
            <div>
              <MarketIntel />
            </div>
            <div>
              <GoalTracker />
            </div>
          </div>

          {/* Ethics disclaimer */}
          <div className="rounded-xl bg-secondary/30 border border-border p-4 text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              🔒 <span className="font-medium text-foreground">Privacy & Ethics:</span> All data is encrypted end-to-end. AI outputs are explainable and bias-checked.
              No personalized investment advice — educational insights only. High-risk cases are escalated to human advisors.
              <br />
              <span className="text-[10px] text-muted-foreground/60">FinSage v1.0.0 • Built with responsible AI principles • SEBI/RBI compliance aligned</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

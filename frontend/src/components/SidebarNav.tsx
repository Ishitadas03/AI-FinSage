import { motion } from "framer-motion";
import {
  TrendingUp,
  Brain,
  ShieldAlert,
  Camera,
  Landmark,
  Newspaper,
  Target,
  LayoutDashboard,
} from "lucide-react";
import { FinSageLogo } from "@/components/brand/FinSageLogo";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: TrendingUp, label: "Future Self", id: "future" },
  { icon: Brain, label: "Emotion AI", id: "emotion" },
  { icon: ShieldAlert, label: "EMI Stress", id: "emi" },
  { icon: Camera, label: "Scam Shield", id: "scam" },
  { icon: Landmark, label: "Gov Schemes", id: "schemes" },
  { icon: Newspaper, label: "Market Intel", id: "news" },
  { icon: Target, label: "Goals", id: "goals" },
];

interface SidebarNavProps {
  activeSection: string;
  onNavigate: (id: string) => void;
}

const SidebarNav = ({ activeSection, onNavigate }: SidebarNavProps) => {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[72px] flex-col items-center border-r border-border bg-sidebar py-6 lg:w-[220px]">
      <div className="mb-8 flex items-center justify-center lg:justify-start px-2 lg:px-4 w-full">
        <FinSageLogo variant="icon" height={32} width={32} className="lg:hidden" />
        <FinSageLogo variant="horizontal" height={32} className="hidden lg:inline-flex" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 w-full">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                />
              )}
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="px-2 w-full">
        <div className="glass-card p-3 text-center">
          <p className="hidden text-xs text-muted-foreground lg:block">
            AI-Powered • Ethics-First
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1 hidden lg:block">v1.0.0-beta</p>
        </div>
      </div>
    </aside>
  );
};

export default SidebarNav;

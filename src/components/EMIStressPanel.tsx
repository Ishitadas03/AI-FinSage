import { motion } from "framer-motion";

interface GaugeProps {
  value: number; // 0-100
  label: string;
  status: "safe" | "moderate" | "danger";
}

const statusColors = {
  safe: { stroke: "hsl(152 69% 45%)", bg: "bg-success/10", text: "text-success", label: "Low Risk" },
  moderate: { stroke: "hsl(38 92% 55%)", bg: "bg-warning/10", text: "text-warning", label: "Moderate" },
  danger: { stroke: "hsl(0 72% 55%)", bg: "bg-destructive/10", text: "text-destructive", label: "High Risk" },
};

const MiniGauge = ({ value, label, status }: GaugeProps) => {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;
  const colors = statusColors[status];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(222 30% 16%)" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r="40" fill="none"
            stroke={colors.stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold font-mono text-foreground">{value}</span>
          <span className="text-[9px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
};

const EMIStressPanel = () => {
  const overallScore = 62;
  const riskLevel: "safe" | "moderate" | "danger" = overallScore > 70 ? "danger" : overallScore > 40 ? "moderate" : "safe";
  const colors = statusColors[riskLevel];

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">EMI Stress & Bankruptcy Risk</h3>
          <p className="text-xs text-muted-foreground">Financial Health Score</p>
        </div>
        <div className={`rounded-full ${colors.bg} px-2.5 py-1`}>
          <span className={`text-[11px] font-medium ${colors.text}`}>{colors.label}</span>
        </div>
      </div>

      {/* Main gauge */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative h-36 w-36">
          <svg className="h-36 w-36 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(222 30% 16%)" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r="40" fill="none"
              stroke={colors.stroke}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 40}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 40 - (overallScore / 100) * 2 * Math.PI * 40 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-mono text-foreground">{overallScore}</span>
            <span className="text-[10px] text-muted-foreground">Stress Score</span>
          </div>
        </div>
      </div>

      {/* Mini gauges */}
      <div className="flex justify-between px-2">
        <MiniGauge value={48} label="EMI Ratio" status="moderate" />
        <MiniGauge value={72} label="Credit Usage" status="danger" />
        <MiniGauge value={35} label="Savings" status="safe" />
      </div>

      {/* Action plan */}
      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium text-foreground">Prevention Action Plan</p>
        {[
          "Reduce credit card usage to under 30%",
          "Build 3-month emergency fund (₹1.5L target)",
          "Consolidate high-interest EMIs via balance transfer",
        ].map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 + i * 0.15 }}
            className="flex items-start gap-2 rounded-lg bg-secondary/50 px-3 py-2"
          >
            <span className="mt-0.5 text-primary text-xs">▹</span>
            <span className="text-[11px] text-muted-foreground">{action}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EMIStressPanel;

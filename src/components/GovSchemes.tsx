import { motion } from "framer-motion";
import { Landmark, ChevronRight } from "lucide-react";

const schemes = [
  {
    name: "PPF (Public Provident Fund)",
    match: 95,
    benefit: "₹1.5L tax deduction under 80C",
    desc: "7.1% guaranteed returns, 15yr lock-in",
    tag: "Tax Saving",
  },
  {
    name: "NPS (National Pension)",
    match: 88,
    benefit: "₹50K extra under 80CCD(1B)",
    desc: "Market-linked pension, partial withdrawal",
    tag: "Retirement",
  },
  {
    name: "PM-SYM Yojana",
    match: 72,
    benefit: "₹3,000/month pension after 60",
    desc: "For income < ₹15K/month, govt matching",
    tag: "Pension",
  },
  {
    name: "Sukanya Samriddhi Yojana",
    match: 65,
    benefit: "8.2% returns + 80C deduction",
    desc: "Girl child savings scheme, 21yr maturity",
    tag: "Savings",
  },
];

const taxSavings = [
  { section: "80C", current: 92000, limit: 150000, items: "PPF, ELSS, LIC" },
  { section: "80D", current: 18000, limit: 25000, items: "Health Insurance" },
  { section: "80CCD(1B)", current: 0, limit: 50000, items: "NPS" },
];

const GovSchemes = () => {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Gov Schemes & Tax Benefits</h3>
          <p className="text-xs text-muted-foreground">Personalized to your profile</p>
        </div>
        <Landmark className="h-4 w-4 text-primary" />
      </div>

      {/* Tax savings progress */}
      <div className="mb-4 space-y-2">
        <p className="text-[11px] font-medium text-muted-foreground">TAX SAVINGS UTILIZATION</p>
        {taxSavings.map((t, i) => (
          <motion.div
            key={t.section}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg bg-secondary/50 p-2.5"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-foreground">Section {t.section}</span>
              <span className="text-[10px] font-mono text-primary">
                ₹{(t.current / 1000).toFixed(0)}K / ₹{(t.limit / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(t.current / t.limit) * 100}%` }}
                transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">{t.items}</p>
          </motion.div>
        ))}
      </div>

      {/* Matched schemes */}
      <p className="text-[11px] font-medium text-muted-foreground mb-2">RECOMMENDED SCHEMES</p>
      <div className="space-y-2">
        {schemes.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="group flex items-center gap-3 rounded-lg bg-secondary/30 p-3 cursor-pointer hover:bg-secondary/60 transition-all"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold font-mono text-primary shrink-0">
              {s.match}%
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-foreground truncate">{s.name}</span>
                <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                  {s.tag}
                </span>
              </div>
              <p className="text-[10px] text-success mt-0.5">{s.benefit}</p>
              <p className="text-[10px] text-muted-foreground">{s.desc}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GovSchemes;

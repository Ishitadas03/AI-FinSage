import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";

const grades = [
  { category: "Savings Discipline", grade: "B+", score: 78, color: "text-success" },
  { category: "EMI Management", grade: "C+", score: 58, color: "text-warning" },
  { category: "Investment Diversification", grade: "A-", score: 85, color: "text-success" },
  { category: "Tax Optimization", grade: "B", score: 72, color: "text-primary" },
  { category: "Emergency Readiness", grade: "C", score: 52, color: "text-warning" },
  { category: "Spending Control", grade: "B-", score: 68, color: "text-primary" },
];

const FinanceReportCard = () => {
  const overallGPA = (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(0);

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">AI Finance Report Card</h3>
          <p className="text-xs text-muted-foreground">February 2026 Assessment</p>
        </div>
        <button className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors">
          <Download className="h-3 w-3" />
          PDF
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/10 p-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <span className="text-xl font-bold font-mono text-primary">{overallGPA}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Overall Health Score</p>
          <p className="text-[11px] text-muted-foreground">Based on 6 financial dimensions</p>
        </div>
      </div>

      <div className="space-y-2">
        {grades.map((g, i) => (
          <motion.div
            key={g.category}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 rounded-lg bg-secondary/30 px-3 py-2"
          >
            <span className={`text-sm font-bold font-mono w-7 ${g.color}`}>{g.grade}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-foreground truncate">{g.category}</p>
              <div className="h-1 rounded-full bg-border mt-1">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${g.score}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.08 }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{g.score}/100</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FinanceReportCard;

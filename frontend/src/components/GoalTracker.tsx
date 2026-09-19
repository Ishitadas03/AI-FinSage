import { motion } from "framer-motion";
import { Target } from "lucide-react";

const goals = [
  { name: "Emergency Fund", target: 300000, current: 185000, icon: "🛡️", deadline: "Dec 2025" },
  { name: "Europe Trip", target: 500000, current: 120000, icon: "✈️", deadline: "Jun 2026" },
  { name: "MBA Fund", target: 2000000, current: 450000, icon: "🎓", deadline: "Mar 2027" },
  { name: "House Down Payment", target: 5000000, current: 800000, icon: "🏠", deadline: "Dec 2028" },
];

const GoalTracker = () => {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Goal Tracker</h3>
          <p className="text-xs text-muted-foreground">Personalized milestones</p>
        </div>
        <Target className="h-4 w-4 text-primary" />
      </div>

      <div className="space-y-3">
        {goals.map((goal, i) => {
          const pct = Math.round((goal.current / goal.target) * 100);
          return (
            <motion.div
              key={goal.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-lg bg-secondary/30 p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{goal.icon}</span>
                  <div>
                    <p className="text-[12px] font-medium text-foreground">{goal.name}</p>
                    <p className="text-[10px] text-muted-foreground">Target: {goal.deadline}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold font-mono text-primary">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-border">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] text-muted-foreground font-mono">
                  ₹{(goal.current / 1000).toFixed(0)}K
                </span>
                <span className="text-[9px] text-muted-foreground font-mono">
                  ₹{(goal.target / 1000).toFixed(0)}K
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalTracker;

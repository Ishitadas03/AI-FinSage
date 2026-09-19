import { motion } from "framer-motion";
import { TrendingUp, Wallet, PiggyBank, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";

const stats = [
  {
    label: "Net Worth",
    value: "₹12.4L",
    change: "+8.2%",
    positive: true,
    icon: TrendingUp,
  },
  {
    label: "Monthly Income",
    value: "₹85K",
    change: "+3.1%",
    positive: true,
    icon: Wallet,
  },
  {
    label: "Savings Rate",
    value: "28%",
    change: "-2.4%",
    positive: false,
    icon: PiggyBank,
  },
  {
    label: "Total EMIs",
    value: "₹24K",
    change: "28% of income",
    positive: false,
    icon: CreditCard,
  },
];

const StatsBar = () => {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="glass-card p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <stat.icon className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-0.5 text-[10px] font-medium ${stat.positive ? "text-success" : "text-destructive"}`}>
              {stat.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {stat.change}
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">{stat.value}</p>
          <p className="text-[11px] text-muted-foreground">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsBar;

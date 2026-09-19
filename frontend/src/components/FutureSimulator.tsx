import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

const scenarios = {
  optimistic: {
    label: "Optimistic",
    color: "hsl(152 69% 45%)",
    data: [
      { year: "2025", value: 500000 },
      { year: "2027", value: 850000 },
      { year: "2029", value: 1400000 },
      { year: "2031", value: 2200000 },
      { year: "2033", value: 3500000 },
      { year: "2035", value: 5800000 },
    ],
  },
  realistic: {
    label: "Realistic",
    color: "hsl(174 72% 50%)",
    data: [
      { year: "2025", value: 500000 },
      { year: "2027", value: 680000 },
      { year: "2029", value: 920000 },
      { year: "2031", value: 1250000 },
      { year: "2033", value: 1700000 },
      { year: "2035", value: 2300000 },
    ],
  },
  risky: {
    label: "Risky",
    color: "hsl(0 72% 55%)",
    data: [
      { year: "2025", value: 500000 },
      { year: "2027", value: 420000 },
      { year: "2029", value: 350000 },
      { year: "2031", value: 280000 },
      { year: "2033", value: 210000 },
      { year: "2035", value: 150000 },
    ],
  },
};

const formatCurrency = (val: number) => {
  if (val >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
};

const FutureSimulator = () => {
  const [active, setActive] = useState<"optimistic" | "realistic" | "risky">("realistic");
  const scenario = scenarios[active];

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Future Self Simulator</h3>
          <p className="text-xs text-muted-foreground">10-Year Wealth Projection</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-secondary p-0.5">
          {(Object.keys(scenarios) as Array<keyof typeof scenarios>).map((key) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                active === key
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {scenarios[key].label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-3 flex items-end gap-2">
          <span className="text-2xl font-bold text-foreground font-mono">
            {formatCurrency(scenario.data[scenario.data.length - 1].value)}
          </span>
          <span className="mb-1 text-xs text-muted-foreground">by 2035</span>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={scenario.data}>
            <defs>
              <linearGradient id={`grad-${active}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={scenario.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={scenario.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222 44% 9%)",
                border: "1px solid hsl(222 30% 16%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [formatCurrency(value), "Wealth"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={scenario.color}
              strokeWidth={2}
              fill={`url(#grad-${active})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default FutureSimulator;

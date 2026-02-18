import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Newspaper } from "lucide-react";

const newsItems = [
  {
    headline: "RBI holds repo rate at 6.5%, signals easing cycle ahead",
    sentiment: 0.72,
    impact: "Positive for debt funds, home loan borrowers may benefit in Q2",
    category: "Monetary Policy",
    time: "2h ago",
  },
  {
    headline: "IT sector faces headwinds as US spending cuts deepen",
    sentiment: -0.45,
    impact: "Negative for IT stocks (TCS, Infosys). Consider reducing overweight positions",
    category: "Sector",
    time: "4h ago",
  },
  {
    headline: "Gold prices hit all-time high amid global uncertainty",
    sentiment: 0.35,
    impact: "Neutral-positive. Good for diversification, but avoid FOMO buying at peak",
    category: "Commodities",
    time: "5h ago",
  },
  {
    headline: "Small-cap indices correct 8% this week — bear trap or trend?",
    sentiment: -0.68,
    impact: "High risk. Avoid bottom-fishing in speculative smallcaps. Stick to quality names",
    category: "Markets",
    time: "6h ago",
  },
];

const SentimentBar = ({ value }: { value: number }) => {
  const normalized = ((value + 1) / 2) * 100;
  const color = value > 0.2 ? "bg-success" : value < -0.2 ? "bg-destructive" : "bg-warning";
  const Icon = value > 0.2 ? TrendingUp : value < -0.2 ? TrendingDown : Minus;

  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-3 w-3 ${value > 0.2 ? "text-success" : value < -0.2 ? "text-destructive" : "text-warning"}`} />
      <div className="h-1.5 w-20 rounded-full bg-border">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${normalized}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground">
        {value > 0 ? "+" : ""}{value.toFixed(2)}
      </span>
    </div>
  );
};

const MarketIntel = () => {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Market Intelligence</h3>
          <p className="text-xs text-muted-foreground">AI-analyzed news • Today</p>
        </div>
        <Newspaper className="h-4 w-4 text-primary" />
      </div>

      <div className="space-y-3">
        {newsItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
            className="rounded-lg bg-secondary/30 p-3 border border-transparent hover:border-primary/10 transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-[12px] font-medium text-foreground leading-snug">{item.headline}</p>
              <span className="shrink-0 text-[9px] text-muted-foreground">{item.time}</span>
            </div>
            <SentimentBar value={item.sentiment} />
            <div className="mt-2 rounded-md bg-background/50 px-2.5 py-1.5">
              <p className="text-[10px] text-primary font-medium mb-0.5">Safe Interpretation</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{item.impact}</p>
            </div>
            <div className="mt-1.5">
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] text-muted-foreground">
                {item.category}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-center">
        <p className="text-[10px] text-muted-foreground">
          ⚖️ <span className="text-primary font-medium">Disclaimer:</span> AI-generated analysis for educational purposes only. Not financial advice. Consult a SEBI-registered advisor.
        </p>
      </div>
    </div>
  );
};

export default MarketIntel;

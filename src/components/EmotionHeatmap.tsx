import { motion } from "framer-motion";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weeks = 5;

// Mock emotion data: 0=calm, 1=normal, 2=impulsive, 3=stress-spending
const heatmapData: number[][] = [
  [0, 1, 0, 1, 2, 3, 2],
  [1, 0, 0, 2, 1, 2, 3],
  [0, 0, 1, 0, 0, 3, 2],
  [1, 2, 3, 1, 0, 1, 0],
  [0, 0, 1, 2, 1, 3, 1],
];

const colorMap: Record<number, string> = {
  0: "bg-success/20",
  1: "bg-primary/20",
  2: "bg-warning/30",
  3: "bg-destructive/40",
};

const labelMap: Record<number, string> = {
  0: "Calm",
  1: "Normal",
  2: "Impulsive",
  3: "Stress",
};

const EmotionHeatmap = () => {
  const stressCount = heatmapData.flat().filter((v) => v >= 2).length;

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Emotion Spending Heatmap</h3>
          <p className="text-xs text-muted-foreground">Last 5 weeks • Pattern Analysis</p>
        </div>
        <div className="rounded-full bg-warning/10 px-2.5 py-1">
          <span className="text-[11px] font-medium text-warning">
            {stressCount} impulse days
          </span>
        </div>
      </div>

      <div className="mb-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {days.map((d) => (
            <span key={d} className="text-center text-[10px] text-muted-foreground">
              {d}
            </span>
          ))}
        </div>
        {heatmapData.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
            {week.map((val, di) => (
              <motion.div
                key={di}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: (wi * 7 + di) * 0.02 }}
                className={`aspect-square rounded-md ${colorMap[val]} cursor-pointer transition-all hover:ring-1 hover:ring-primary/30`}
                title={`${days[di]}, Week ${wi + 1}: ${labelMap[val]}`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {Object.entries(labelMap).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-sm ${colorMap[Number(key)]}`} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-3 rounded-lg bg-warning/5 border border-warning/10 p-3"
      >
        <p className="text-xs text-warning font-medium">⚡ Cool Down Alert</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Weekend stress-spending detected 3x this month. Consider the 24-hour rule before purchases over ₹2,000.
        </p>
      </motion.div>
    </div>
  );
};

export default EmotionHeatmap;

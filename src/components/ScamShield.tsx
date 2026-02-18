import { motion } from "framer-motion";
import { Upload, ShieldCheck, AlertTriangle, FileWarning } from "lucide-react";
import { useState } from "react";

const mockAnalysis = {
  extracted: "🚀 GUARANTEED 300% RETURNS in 30 days! Invest in CryptoMoonX token. Limited slots. DM @cryptoguru99. SEBI-approved (NOT verified).",
  scamProbability: 94,
  riskFactors: [
    "Unrealistic return promises (300% in 30 days)",
    "Urgency tactics ('limited slots')",
    "False regulatory claims (SEBI approval not verified)",
    "Anonymous promoter with no credentials",
  ],
  safeAlternatives: [
    "SEBI-registered mutual funds (12-15% annual avg)",
    "Index funds (Nifty 50 / Sensex ETFs)",
    "Government bonds (7-8% guaranteed)",
  ],
};

const ScamShield = () => {
  const [analyzed, setAnalyzed] = useState(false);

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Anti-Scam AI Shield</h3>
          <p className="text-xs text-muted-foreground">Screenshot Investment Analyzer</p>
        </div>
        <ShieldCheck className="h-4 w-4 text-primary" />
      </div>

      {!analyzed ? (
        <motion.button
          onClick={() => setAnalyzed(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/30 py-10 transition-colors hover:border-primary/30 hover:bg-secondary/50"
        >
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Upload Screenshot</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Drop investment ad, stock tip, or crypto post
            </p>
          </div>
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Scam probability */}
          <div className="flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <FileWarning className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-destructive">SCAM PROBABILITY</span>
                <span className="text-lg font-bold font-mono text-destructive">{mockAnalysis.scamProbability}%</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-destructive/20">
                <motion.div
                  className="h-full rounded-full bg-destructive"
                  initial={{ width: 0 }}
                  animate={{ width: `${mockAnalysis.scamProbability}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {/* Extracted text */}
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-[10px] font-medium text-muted-foreground mb-1">OCR EXTRACTED TEXT</p>
            <p className="text-[11px] text-foreground/80 font-mono leading-relaxed">
              {mockAnalysis.extracted}
            </p>
          </div>

          {/* Risk factors */}
          <div>
            <p className="text-[11px] font-medium text-destructive mb-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Risk Factors
            </p>
            {mockAnalysis.riskFactors.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="text-[11px] text-muted-foreground py-0.5 pl-3 border-l border-destructive/30"
              >
                {r}
              </motion.div>
            ))}
          </div>

          {/* Safe alternatives */}
          <div>
            <p className="text-[11px] font-medium text-success mb-1.5">✓ Safe Alternatives</p>
            {mockAnalysis.safeAlternatives.map((a, i) => (
              <div key={i} className="text-[11px] text-muted-foreground py-0.5 pl-3 border-l border-success/30">
                {a}
              </div>
            ))}
          </div>

          <button
            onClick={() => setAnalyzed(false)}
            className="w-full rounded-lg bg-secondary py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Analyze Another Screenshot
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ScamShield;

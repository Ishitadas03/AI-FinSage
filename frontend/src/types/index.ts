export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'cleared' | 'pending' | 'flagged';
export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Auto-Debit' | 'Cash';

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  category: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  isRecurring?: boolean;
  riskReason?: string;
}

export * from './budget';

export type Budget = import('./budget').ApiBudget;


export * from './goal';

export type Goal = import('./goal').ApiGoal;


export * from './loan';

export type Loan = import('./loan').ApiLoan;

export * from './recurringBill';
export * from './notification';
export * from './copilot';
export * from './monthlyReport';
export * from './dataManagement';

export interface SecurityAlert {
  id: string;
  transactionId?: string;
  merchant: string;
  amount: number;
  date: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  status: 'pending' | 'safe' | 'reported';
  location: string;
  device: string;
  ipAddress?: string;
}

export interface MarketHolding {
  id: string;
  symbol: string;
  name: string;
  assetClass: 'Stocks' | 'Mutual Funds' | 'Gold' | 'Fixed Deposit' | 'Crypto';
  units: number;
  avgBuyPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
  dailyChangePercentage: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'spending' | 'savings' | 'debt' | 'goal' | 'security';
  priority: 'info' | 'success' | 'warning' | 'critical';
}

export interface HealthPillar {
  name: string;
  score: number;
  maxScore: number;
  status: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
  metric: string;
  benchmark: string;
  description: string;
}

export interface FinancialHealth {
  overallScore: number;
  status: string;
  summary: string;
  pillars: HealthPillar[];
  history: { month: string; score: number }[];
  positiveHabits: string[];
  improvementAreas: { title: string; impact: string; action: string }[];
}

export interface UserProfile {
  name: string;
  initials: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  currency: string;
  panNumber: string;
  monthlyIncome: number;
  riskAppetite: 'Conservative' | 'Moderate' | 'Aggressive';
  joinedDate: string;
}


export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
  metricHighlight?: {
    label: string;
    value: string;
    change?: string;
  };
}

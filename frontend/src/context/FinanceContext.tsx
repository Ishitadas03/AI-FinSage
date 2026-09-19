import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Transaction,
  Budget,
  Goal,
  Loan,
  SecurityAlert,
  MarketHolding,
  MarketIndex,
  AIInsight,
  FinancialHealth,
  UserProfile,
  NotificationItem,
  ChatMessage,
} from '@/types';

interface FinanceContextType {
  user: UserProfile;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  
  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  importTransactions: (newTxs: Omit<Transaction, 'id'>[]) => void;

  // Budgets
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  editBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Goals
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  editGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addFundsToGoal: (id: string, amount: number) => void;

  // Loans & Debt
  loans: Loan[];
  totalDebt: number;
  totalMonthlyEmi: number;
  emiToIncomeRatio: number;
  addLoan: (loan: Omit<Loan, 'id'>) => void;
  simulatePrepayment: (loanId: string, extraMonthly: number) => {
    interestSaved: number;
    monthsSaved: number;
    newTenureMonths: number;
  };

  // Scam Shield & Security
  securityAlerts: SecurityAlert[];
  securityScore: number;
  markAlertSafe: (id: string) => void;
  reportAlert: (id: string, reason?: string) => void;

  // Financial Health
  financialHealth: FinancialHealth;

  // Market Intel
  marketHoldings: MarketHolding[];
  marketIndices: MarketIndex[];
  totalPortfolioValue: number;
  totalPortfolioInvested: number;
  totalPortfolioPnl: number;
  totalPortfolioPnlPercent: number;

  // AI Insights & Reports
  insights: AIInsight[];
  dismissInsight: (id: string) => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // AI Financial Copilot Chat
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  sendChatMessage: (text: string) => void;
  clearChat: () => void;

  // Global Modals & Utilities
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isAddTransactionOpen: boolean;
  setIsAddTransactionOpen: (open: boolean) => void;
  isAddGoalOpen: boolean;
  setIsAddGoalOpen: (open: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Profile update
  updateProfile: (profile: Partial<UserProfile>) => void;
  resetAllData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Initial Mock Data matching Reference Design
const INITIAL_USER: UserProfile = {
  name: "Rahul Sharma",
  initials: "RS",
  email: "rahul.sharma@finsage.io",
  phone: "+91 98765 43210",
  currency: "INR",
  panNumber: "ABCDE1234F",
  monthlyIncome: 85000,
  riskAppetite: "Moderate",
  joinedDate: "January 2025",
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "tx-1", date: "2026-09-18", merchant: "Prestige Hiranandani Rent", category: "Housing", type: "expense", amount: 18000, status: "cleared", paymentMethod: "Net Banking", isRecurring: true },
  { id: "tx-2", date: "2026-09-17", merchant: "Acme Tech Solutions (Salary)", category: "Income", type: "income", amount: 85000, status: "cleared", paymentMethod: "Net Banking" },
  { id: "tx-3", date: "2026-09-16", merchant: "Swiggy Gourmet", category: "Food", type: "expense", amount: 1240, status: "cleared", paymentMethod: "UPI" },
  { id: "tx-4", date: "2026-09-15", merchant: "Nature's Basket Grocery", category: "Food", type: "expense", amount: 3450, status: "cleared", paymentMethod: "Credit Card" },
  { id: "tx-5", date: "2026-09-14", merchant: "Uber Premier", category: "Transport", type: "expense", amount: 620, status: "cleared", paymentMethod: "UPI" },
  { id: "tx-6", date: "2026-09-13", merchant: "Unknown Intl Gateway - London", category: "Shopping", type: "expense", amount: 18450, status: "flagged", paymentMethod: "Credit Card", riskReason: "Foreign IP location & unusual amount discrepancy" },
  { id: "tx-7", date: "2026-09-12", merchant: "Indian Oil Fuel Station", category: "Transport", type: "expense", amount: 2500, status: "cleared", paymentMethod: "Credit Card" },
  { id: "tx-8", date: "2026-09-11", merchant: "Amazon India Electronics", category: "Shopping", type: "expense", amount: 4800, status: "cleared", paymentMethod: "Credit Card" },
  { id: "tx-9", date: "2026-09-10", merchant: "Netflix Premium 4K", category: "Subscriptions", type: "expense", amount: 649, status: "cleared", paymentMethod: "Auto-Debit", isRecurring: true },
  { id: "tx-10", date: "2026-09-09", merchant: "Spotify Family Plan", category: "Subscriptions", type: "expense", amount: 179, status: "cleared", paymentMethod: "Auto-Debit", isRecurring: true },
  { id: "tx-11", date: "2026-09-08", merchant: "Tata Power Electricity", category: "Others", type: "expense", amount: 3200, status: "cleared", paymentMethod: "UPI", isRecurring: true },
  { id: "tx-12", date: "2026-09-07", merchant: "Apollo Pharmacy Medicals", category: "Others", type: "expense", amount: 1150, status: "cleared", paymentMethod: "UPI" },
  { id: "tx-13", date: "2026-09-06", merchant: "Starbucks Coffee Reserve", category: "Food", type: "expense", amount: 480, status: "cleared", paymentMethod: "UPI" },
  { id: "tx-14", date: "2026-09-05", merchant: "Freelance UI Consulting", category: "Income", type: "income", amount: 15000, status: "cleared", paymentMethod: "UPI" },
  { id: "tx-15", date: "2026-09-04", merchant: "Zomato Gold Delivery", category: "Food", type: "expense", amount: 680, status: "cleared", paymentMethod: "UPI" },
  { id: "tx-16", date: "2026-09-03", merchant: "Airtel Fiber Broadband", category: "Subscriptions", type: "expense", amount: 1199, status: "cleared", paymentMethod: "Auto-Debit", isRecurring: true },
  { id: "tx-17", date: "2026-09-02", merchant: "Crypto-Fast Trade Global", category: "Others", type: "expense", amount: 5000, status: "flagged", paymentMethod: "Credit Card", riskReason: "New high-risk merchant flagged in national cybercrime registry" },
  { id: "tx-18", date: "2026-09-01", merchant: "Cult.fit Fitness Annual", category: "Others", type: "expense", amount: 5800, status: "cleared", paymentMethod: "Credit Card" },
];

const INITIAL_BUDGETS: Budget[] = [
  { id: "b-1", category: "Housing", allocated: 20000, spent: 18000, color: "#3B82F6", icon: "Home" },
  { id: "b-2", category: "Food & Dining", allocated: 12000, spent: 9200, color: "#10B981", icon: "Utensils" },
  { id: "b-3", category: "Transportation", allocated: 7000, spent: 5400, color: "#06B6D4", icon: "Car" },
  { id: "b-4", category: "Shopping", allocated: 6000, spent: 4800, color: "#F59E0B", icon: "ShoppingBag" },
  { id: "b-5", category: "Subscriptions", allocated: 2500, spent: 2100, color: "#8B5CF6", icon: "Tv" },
  { id: "b-6", category: "Utilities & Others", allocated: 17500, spent: 14700, color: "#0F766E", icon: "Zap" },
];

const INITIAL_GOALS: Goal[] = [
  {
    id: "g-1",
    name: "Emergency Fund",
    category: "Safety",
    targetAmount: 300000,
    currentAmount: 180000,
    deadline: "Dec 2027",
    monthlyContribution: 8000,
    icon: "ShieldCheck",
    color: "#0F766E",
    status: "active",
  },
  {
    id: "g-2",
    name: "Buy a Car",
    category: "Vehicle",
    targetAmount: 800000,
    currentAmount: 240000,
    deadline: "Dec 2028",
    monthlyContribution: 15000,
    icon: "Car",
    color: "#3B82F6",
    status: "active",
  },
  {
    id: "g-3",
    name: "Europe Vacation",
    category: "Travel",
    targetAmount: 250000,
    currentAmount: 110000,
    deadline: "Oct 2027",
    monthlyContribution: 7500,
    icon: "Plane",
    color: "#EC4899",
    status: "active",
  },
  {
    id: "g-4",
    name: "Retirement Boost",
    category: "Long Term",
    targetAmount: 5000000,
    currentAmount: 215000,
    deadline: "Dec 2045",
    monthlyContribution: 12000,
    icon: "TrendingUp",
    color: "#10B981",
    status: "active",
  },
  {
    id: "g-5",
    name: "MacBook Pro Setup",
    category: "Tech",
    targetAmount: 180000,
    currentAmount: 180000,
    deadline: "Completed Jul 2026",
    monthlyContribution: 0,
    icon: "Laptop",
    color: "#64748B",
    status: "completed",
  },
];

const INITIAL_LOANS: Loan[] = [
  {
    id: "l-1",
    name: "Green Valley Home Loan",
    lender: "HDFC Bank",
    originalAmount: 2500000,
    principalRemaining: 1850000,
    interestRate: 8.65,
    monthlyEmi: 18200,
    remainingTenureMonths: 142,
    startDate: "2023-01-10",
    loanType: "Home Loan",
    accountNumber: "HDFC-HL-883921",
  },
  {
    id: "l-2",
    name: "Hyundai Creta Auto Loan",
    lender: "ICICI Bank",
    originalAmount: 600000,
    principalRemaining: 330000,
    interestRate: 9.2,
    monthlyEmi: 5600,
    remainingTenureMonths: 28,
    startDate: "2024-04-15",
    loanType: "Car Loan",
    accountNumber: "ICICI-AL-449102",
  },
];

const INITIAL_SECURITY_ALERTS: SecurityAlert[] = [
  {
    id: "sec-1",
    transactionId: "tx-6",
    merchant: "Unknown Intl Gateway - London, UK",
    amount: 18450,
    date: "13 Sep 2026, 03:42 AM",
    riskScore: 88,
    riskLevel: "high",
    reasons: [
      "Unusual transaction amount (3.4x higher than standard card checkout)",
      "Foreign currency cross-border merchant with no prior overseas travel notice",
      "Off-peak timestamp execution (03:42 AM IST)",
    ],
    status: "pending",
    location: "London, United Kingdom (IP: 185.220.101.5)",
    device: "Chrome on Windows NT 10.0 (Unrecognized Fingerprint)",
    ipAddress: "185.220.101.5",
  },
  {
    id: "sec-2",
    transactionId: "tx-17",
    merchant: "Crypto-Fast Trade Global",
    amount: 5000,
    date: "02 Sep 2026, 11:15 PM",
    riskScore: 79,
    riskLevel: "high",
    reasons: [
      "Merchant listed on FinTech Cyber-Defense blacklisted gateway registry",
      "Velocity spike: Instantaneous card verification attempt without OTP Challenge",
    ],
    status: "pending",
    location: "Seychelles (Proxy Tunnel detected)",
    device: "Automated API Client v1.4",
    ipAddress: "103.241.11.89",
  },
  {
    id: "sec-3",
    merchant: "QuickLoan MicroCharge Sub",
    amount: 199,
    date: "28 Aug 2026, 09:20 AM",
    riskScore: 62,
    riskLevel: "medium",
    reasons: [
      "Unusual repetitive micro-deduction pattern matching unauthorized subscription trojans",
      "Merchant registered under generic unverified payment aggregator",
    ],
    status: "pending",
    location: "Cyberabad, India",
    device: "Android App Background WebView",
    ipAddress: "49.207.214.12",
  },
];

const INITIAL_HOLDINGS: MarketHolding[] = [
  {
    id: "h-1",
    symbol: "NIFTYBEES",
    name: "Nippon India Nifty 50 BeES ETF",
    assetClass: "Mutual Funds",
    units: 850,
    avgBuyPrice: 245.5,
    currentPrice: 278.4,
    investedValue: 208675,
    currentValue: 236640,
    pnl: 27965,
    pnlPercentage: 13.4,
    dailyChangePercentage: 0.62,
  },
  {
    id: "h-2",
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd.",
    assetClass: "Stocks",
    units: 75,
    avgBuyPrice: 1540.0,
    currentPrice: 1682.5,
    investedValue: 115500,
    currentValue: 126187,
    pnl: 10687,
    pnlPercentage: 9.25,
    dailyChangePercentage: 1.15,
  },
  {
    id: "h-3",
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd.",
    assetClass: "Stocks",
    units: 35,
    avgBuyPrice: 2720.0,
    currentPrice: 2985.0,
    investedValue: 95200,
    currentValue: 104475,
    pnl: 9275,
    pnlPercentage: 9.74,
    dailyChangePercentage: -0.34,
  },
  {
    id: "h-4",
    symbol: "GOLDBEES",
    name: "Nippon India ETF Gold BeES",
    assetClass: "Gold",
    units: 950,
    avgBuyPrice: 58.2,
    currentPrice: 72.8,
    investedValue: 55290,
    currentValue: 69160,
    pnl: 13870,
    pnlPercentage: 25.08,
    dailyChangePercentage: 0.28,
  },
  {
    id: "h-5",
    symbol: "FD-HDFC-01",
    name: "HDFC High-Yield Fixed Deposit",
    assetClass: "Fixed Deposit",
    units: 1,
    avgBuyPrice: 50000,
    currentPrice: 53600,
    investedValue: 50000,
    currentValue: 53600,
    pnl: 3600,
    pnlPercentage: 7.2,
    dailyChangePercentage: 0.02,
  },
];

const INITIAL_INDICES: MarketIndex[] = [
  { name: "NIFTY 50", value: 25375.4, change: 104.2, changePercent: 0.41, isPositive: true },
  { name: "SENSEX", value: 83184.8, change: 312.6, changePercent: 0.38, isPositive: true },
  { name: "BANK NIFTY", value: 52140.2, change: -82.4, changePercent: -0.16, isPositive: false },
  { name: "GOLD 24K (10g)", value: 75420, change: 95.0, changePercent: 0.13, isPositive: true },
  { name: "USD / INR", value: 83.92, change: -0.04, changePercent: -0.05, isPositive: false },
];

const INITIAL_INSIGHTS: AIInsight[] = [
  {
    id: "ins-1",
    title: "Spending increased",
    description: "Your dining expenses are 18% higher this month compared to your 3-month average. Consider cooking at home this weekend.",
    timestamp: "2h ago",
    type: "spending",
    priority: "warning",
  },
  {
    id: "ins-2",
    title: "Savings improved",
    description: "Your savings rate is now 28%, up from 23% last month. You saved an extra ₹4,250 towards your Emergency Fund.",
    timestamp: "1d ago",
    type: "savings",
    priority: "success",
  },
  {
    id: "ins-3",
    title: "High EMI burden",
    description: "Your EMI payments are 28% of your monthly income. Consider refinancing your car loan or making a lump-sum principal prepayment.",
    timestamp: "2d ago",
    type: "debt",
    priority: "warning",
  },
  {
    id: "ins-4",
    title: "Emergency buffer healthy",
    description: "At ₹1,80,000, your emergency fund covers 3.3 months of mandatory expenses. Aim for 6 months (₹3,00,000) for complete resilience.",
    timestamp: "3d ago",
    type: "goal",
    priority: "info",
  },
];

const INITIAL_HEALTH: FinancialHealth = {
  overallScore: 72,
  status: "Good Progress",
  summary: "You're on the right track. Focus on building your emergency fund to 6 months and accelerating debt prepayment.",
  pillars: [
    { name: "Savings Discipline", score: 78, maxScore: 100, status: "Good", metric: "28.0% Savings Rate", benchmark: "Target: >20%", description: "Consistent monthly allocation into goals and liquid assets." },
    { name: "Debt Management", score: 61, maxScore: 100, status: "Fair", metric: "28.0% EMI / Income", benchmark: "Healthy: <30%", description: "Loans are manageable, but home loan interest carries long-term weight." },
    { name: "Emergency Readiness", score: 54, maxScore: 100, status: "Needs Attention", metric: "3.3 Months Covered", benchmark: "Ideal: 6.0 Months", description: "Liquid emergency reserves currently stand at ₹1.80L out of ₹3.00L." },
    { name: "Spending Control", score: 73, maxScore: 100, status: "Good", metric: "83% Budget Utilized", benchmark: "Safe: <88%", description: "Discretionary spends stayed within planned thresholds." },
    { name: "Investment Habits", score: 81, maxScore: 100, status: "Excellent", metric: "Active Monthly SIPs", benchmark: "Regular SIPs active", description: "Disciplined auto-investing into diversified index and equity funds." },
  ],
  history: [
    { month: "Apr", score: 58 },
    { month: "May", score: 63 },
    { month: "Jun", score: 66 },
    { month: "Jul", score: 68 },
    { month: "Aug", score: 70 },
    { month: "Sep", score: 72 },
  ],
  positiveHabits: [
    "Zero credit card rollover debt — balance paid in full every month.",
    "Automated SIP deductions on salary day prevent impulse spending.",
    "Housing expenses contained at 21% of gross household income.",
    "Diversified equity exposure across large-cap and gold hedges.",
  ],
  improvementAreas: [
    {
      title: "Boost Emergency Fund by ₹1.2L",
      impact: "+8 Health Points",
      action: "Redirect freelance or bonus inflows to achieve 6 full months of living costs.",
    },
    {
      title: "Prepay ₹5,000/mo on Car Loan",
      impact: "+5 Health Points",
      action: "Knocks 8 months off tenure and saves ₹18,400 in interest charges.",
    },
    {
      title: "Cap Dining Out to ₹8,000/mo",
      impact: "+3 Health Points",
      action: "Food delivery is currently ₹1,200 above optimal discretionary spending limit.",
    },
  ],
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Suspicious International Charge",
    message: "A charge of ₹18,450 at 'Unknown Intl Gateway London' was flagged by Scam Shield.",
    timestamp: "10 mins ago",
    read: false,
    type: "security",
    link: "/scam-shield",
  },
  {
    id: "notif-2",
    title: "Salary Credited",
    message: "₹85,000 credited from Acme Tech Solutions. Monthly savings automated.",
    timestamp: "2 days ago",
    read: true,
    type: "alert",
    link: "/transactions",
  },
  {
    id: "notif-3",
    title: "Emergency Fund Milestone",
    message: "You've reached 60% of your Emergency Fund goal (₹1.80L saved). Keep going!",
    timestamp: "3 days ago",
    read: true,
    type: "goal",
    link: "/goals",
  },
  {
    id: "notif-4",
    title: "September AI Report Ready",
    message: "Your monthly financial audit is ready for review with actionable recommendations.",
    timestamp: "4 days ago",
    read: true,
    type: "insight",
    link: "/ai-report",
  },
];

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: "chat-1",
    sender: "assistant",
    text: "Hello Rahul! 👋 I'm FinSage, your AI Financial Copilot. I have full context on your ₹12.4L net worth, monthly cash flow, budgets, and goals. How can I assist you today?",
    timestamp: "Just now",
    suggestions: [
      "How can I save ₹10,000 more this month?",
      "Can I afford to buy a ₹8L car in 2 years?",
      "Explain the Scam Shield alert",
      "Simulate paying ₹5,000 extra on my Home Loan",
    ],
  },
];

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('finsage_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [selectedPeriod, setSelectedPeriod] = useState<string>("September 2026");
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finsage_txs');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('finsage_budgets');
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('finsage_goals');
    return saved ? JSON.parse(saved) : INITIAL_GOALS;
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem('finsage_loans');
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(() => {
    const saved = localStorage.getItem('finsage_alerts');
    return saved ? JSON.parse(saved) : INITIAL_SECURITY_ALERTS;
  });

  const [marketHoldings] = useState<MarketHolding[]>(INITIAL_HOLDINGS);
  const [marketIndices] = useState<MarketIndex[]>(INITIAL_INDICES);
  const [insights, setInsights] = useState<AIInsight[]>(INITIAL_INSIGHTS);
  const [financialHealth] = useState<FinancialHealth>(INITIAL_HEALTH);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);

  // Modals state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('finsage_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('finsage_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finsage_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('finsage_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('finsage_loans', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('finsage_alerts', JSON.stringify(securityAlerts));
  }, [securityAlerts]);

  // Derived Financial Metrics
  const monthlyIncome = 85000;
  const monthlyExpenses = 54200;
  const netWorth = 1240000;
  const savingsRate = 28; // 28%

  const totalDebt = loans.reduce((acc, l) => acc + l.principalRemaining, 0);
  const totalMonthlyEmi = loans.reduce((acc, l) => acc + l.monthlyEmi, 0);
  const emiToIncomeRatio = Math.round((totalMonthlyEmi / monthlyIncome) * 100);

  const securityScore = Math.max(
    10,
    100 - securityAlerts.filter((a) => a.status === 'pending').reduce((acc, a) => acc + (a.riskScore > 75 ? 30 : 15), 0)
  );

  const totalPortfolioInvested = marketHoldings.reduce((acc, h) => acc + h.investedValue, 0);
  const totalPortfolioValue = marketHoldings.reduce((acc, h) => acc + h.currentValue, 0);
  const totalPortfolioPnl = totalPortfolioValue - totalPortfolioInvested;
  const totalPortfolioPnlPercent = Number(((totalPortfolioPnl / totalPortfolioInvested) * 100).toFixed(2));

  // Handlers
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const editTransaction = (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const importTransactions = (newTxs: Omit<Transaction, 'id'>[]) => {
    const formatted = newTxs.map((tx, idx) => ({
      ...tx,
      id: `tx-imp-${Date.now()}-${idx}`,
    }));
    setTransactions((prev) => [...formatted, ...prev]);
  };

  const addBudget = (b: Omit<Budget, 'id'>) => {
    const newB: Budget = {
      ...b,
      id: `b-${Date.now()}`,
    };
    setBudgets((prev) => [...prev, newB]);
  };

  const editBudget = (id: string, updated: Partial<Budget>) => {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
  };

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const addGoal = (g: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...g,
      id: `g-${Date.now()}`,
    };
    setGoals((prev) => [newGoal, ...prev]);
  };

  const editGoal = (id: string, updated: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updated } : g)));
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addFundsToGoal = (id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const updatedAmt = Math.min(g.targetAmount, g.currentAmount + amount);
        return {
          ...g,
          currentAmount: updatedAmt,
          status: updatedAmt >= g.targetAmount ? 'completed' : g.status,
        };
      })
    );
  };

  const addLoan = (l: Omit<Loan, 'id'>) => {
    const newLoan: Loan = {
      ...l,
      id: `l-${Date.now()}`,
    };
    setLoans((prev) => [...prev, newLoan]);
  };

  const simulatePrepayment = (loanId: string, extraMonthly: number) => {
    const loan = loans.find((l) => l.id === loanId) || loans[0];
    const P = loan.principalRemaining;
    const r = loan.interestRate / 12 / 100;
    const standardEmi = loan.monthlyEmi;
    const standardTotalInterest = standardEmi * loan.remainingTenureMonths - P;

    const newEmi = standardEmi + extraMonthly;
    // n = -log(1 - (P*r)/E) / log(1+r)
    const months = Math.ceil(-Math.log(1 - (P * r) / newEmi) / Math.log(1 + r));
    const newTotalPaid = newEmi * months;
    const newTotalInterest = newTotalPaid - P;
    const interestSaved = Math.max(0, Math.round(standardTotalInterest - newTotalInterest));
    const monthsSaved = Math.max(0, loan.remainingTenureMonths - months);

    return {
      interestSaved,
      monthsSaved,
      newTenureMonths: months,
    };
  };

  const markAlertSafe = (id: string) => {
    setSecurityAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'safe' } : a))
    );
  };

  const reportAlert = (id: string) => {
    setSecurityAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'reported' } : a))
    );
  };

  const dismissInsight = (id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const sendChatMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);

    // Generate smart context-aware response
    setTimeout(() => {
      let replyText = "";
      const lower = text.toLowerCase();

      if (lower.includes("save") || lower.includes("saving") || lower.includes("10,000")) {
        replyText = `Based on your current cash flow, you have ₹85,000 monthly income and ₹54,200 in expenses (a 28% savings rate = ₹23,800 saved). To save an extra ₹10,000/month:
1. 🍽️ **Dining & Food Delivery**: Reduce Swiggy/Zomato orders from ₹9,200 to ₹6,000 (Saves ₹3,200).
2. 🛍️ **Discretionary Shopping**: Cap e-commerce purchases at ₹2,500 instead of ₹4,800 (Saves ₹2,300).
3. 🔄 **Subscriptions Audit**: Cancel unused streaming passes (Saves ₹800).
4. 🚗 **Cab usage**: Switch 2 weekly Uber rides to metro (Saves ₹1,200).
5. 💼 **Freelance Inflows**: Automate 50% of consulting earnings into liquid funds (Adds ~₹2,500).`;
      } else if (lower.includes("car") || lower.includes("afford") || lower.includes("8l")) {
        replyText = `🚗 **Car Purchase Assessment**:
Your target is ₹8,00,000 with ₹2,40,000 currently saved (30% progress).
- At your current contribution rate of ₹15,000/month, you will reach ₹8L by **December 2028** (27 months).
- If you wish to purchase earlier (in 18 months), increase your monthly goal allocation to **₹31,100/month**.
- Your debt-to-income is currently 28%, which is safe, so taking an auto loan top-up is also feasible if your down payment reaches ₹4L.`;
      } else if (lower.includes("scam") || lower.includes("alert") || lower.includes("flagged") || lower.includes("security")) {
        replyText = `🛡️ **Scam Shield Audit**:
You have 2 pending security alerts:
1. **Unknown Intl Gateway (London)**: ₹18,450. Flagged due to foreign IP and off-hours execution.
2. **Crypto-Fast Trade**: ₹5,000. Flagged because the merchant is listed on the cybercrime watch registry.
I strongly recommend blocking foreign merchant transactions on your primary credit card via your banking app settings.`;
      } else if (lower.includes("loan") || lower.includes("home loan") || lower.includes("prepay") || lower.includes("emi")) {
        const prepay = simulatePrepayment("l-1", 5000);
        replyText = `🏡 **Home Loan Prepayment Analysis**:
On your HDFC Home Loan (₹18.5L balance at 8.65%):
- Regular EMI: ₹18,200/mo over 142 months.
- **Adding ₹5,000 extra per month** (Total ₹23,200/mo) will:
  ✨ Save **₹4,82,000 in total interest**!
  ⚡ Knock **38 months (3.2 years)** off your loan repayment schedule!`;
      } else {
        replyText = `I've analyzed your financial parameters. With a net worth of ₹12.40 Lakhs and a healthy 72/100 Financial Health score, your baseline is strong. You have ₹10,800 remaining in this month's budget. What specific scenario or calculation would you like to explore?`;
      }

      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  const clearChat = () => {
    setChatMessages(INITIAL_CHAT);
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  const resetAllData = () => {
    setUser(INITIAL_USER);
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgets(INITIAL_BUDGETS);
    setGoals(INITIAL_GOALS);
    setLoans(INITIAL_LOANS);
    setSecurityAlerts(INITIAL_SECURITY_ALERTS);
    setChatMessages(INITIAL_CHAT);
    setNotifications(INITIAL_NOTIFICATIONS);
    localStorage.clear();
  };

  return (
    <FinanceContext.Provider
      value={{
        user,
        netWorth,
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
        selectedPeriod,
        setSelectedPeriod,
        transactions,
        addTransaction,
        editTransaction,
        deleteTransaction,
        importTransactions,
        budgets,
        addBudget,
        editBudget,
        deleteBudget,
        goals,
        addGoal,
        editGoal,
        deleteGoal,
        addFundsToGoal,
        loans,
        totalDebt,
        totalMonthlyEmi,
        emiToIncomeRatio,
        addLoan,
        simulatePrepayment,
        securityAlerts,
        securityScore,
        markAlertSafe,
        reportAlert,
        financialHealth,
        marketHoldings,
        marketIndices,
        totalPortfolioValue,
        totalPortfolioInvested,
        totalPortfolioPnl,
        totalPortfolioPnlPercent,
        insights,
        dismissInsight,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        chatMessages,
        isChatOpen,
        setIsChatOpen,
        sendChatMessage,
        clearChat,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isAddTransactionOpen,
        setIsAddTransactionOpen,
        isAddGoalOpen,
        setIsAddGoalOpen,
        isImportModalOpen,
        setIsImportModalOpen,
        isSearchOpen,
        setIsSearchOpen,
        updateProfile,
        resetAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

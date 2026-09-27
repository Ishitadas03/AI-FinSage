import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
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
import { AuthUser } from '@/types/auth';
import { Account, AccountCreate, AccountUpdate } from '@/types/account';
import {
  ApiTransaction,
  TransactionCreate,
  TransactionFilterParams,
  TransactionPaginatedResponse,
  TransactionUpdate,
} from '@/types/transaction';
import {
  ApiBudget,
  BudgetCreate,
  BudgetFilterParams,
  BudgetUpdate,
} from '@/types/budget';
import { authApi } from '@/lib/api/auth';
import { accountsApi } from '@/lib/api/accounts';
import { transactionsApi } from '@/lib/api/transactions';
import { budgetsApi } from '@/lib/api/budgets';
import { goalsApi } from '@/lib/api/goals';
import { loansApi } from '@/lib/api/loans';
import { bankImportApi } from '@/lib/api/bankImport';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { getApiErrorMessage, setOnUnauthorizedCallback } from '@/lib/api/client';
import { useAuth, useUser, useClerk } from '@clerk/react';
import {
  BankStatementCommitParams,
  BankStatementImportCommitResponse,
  BankStatementPreviewResponse,
} from '@/types/bankStatement';
import {
  ApiGoal,
  GoalContribution,
  GoalCreate,
  GoalFilterParams,
  GoalUpdate,
} from '@/types/goal';
import {
  ApiLoan,
  LoanCreate,
  LoanUpdate,
  DebtStressAnalysisResponse,
} from '@/types/loan';
import {
  AnalyticsOverviewResponse,
  AnalyticsQueryParams,
} from '@/types/analytics';
import {
  FinancialHealthOverviewResponse,
  FinancialHealthQueryParams,
} from '@/types/financialHealth';
import {
  AmortizationRequest,
  AmortizationScheduleResponse,
} from '@/types/amortization';
import { analyticsApi } from '@/lib/api/analytics';
import { financialHealthApi } from '@/lib/api/financialHealth';
import { emiApi, EmiCalculationRequest, EmiCalculationResponse } from '@/lib/api/emi';




export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface FinanceContextType {
  // Auth State
  user: UserProfile;
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  authStatus: AuthStatus;
  authError: string | null;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;

  // Real Backend Accounts State & Operations
  accounts: Account[];
  isLoadingAccounts: boolean;
  accountsError: string | null;
  loadAccounts: () => Promise<Account[]>;
  createAccount: (payload: AccountCreate) => Promise<Account>;
  updateAccount: (id: string, payload: AccountUpdate) => Promise<Account>;
  deleteAccount: (id: string) => Promise<boolean>;

  // Real Backend Transactions State & Operations
  transactions: ApiTransaction[];
  transactionsTotal: number;
  transactionsPage: number;
  transactionsPageSize: number;
  transactionsTotalPages: number;
  isLoadingTransactions: boolean;
  transactionsError: string | null;
  activeTransactionFilters: TransactionFilterParams;
  loadTransactions: (filters?: TransactionFilterParams) => Promise<TransactionPaginatedResponse>;
  createTransaction: (payload: TransactionCreate) => Promise<ApiTransaction>;
  updateTransaction: (id: string, payload: TransactionUpdate) => Promise<ApiTransaction>;
  deleteTransaction: (id: string) => Promise<boolean>;
  addTransaction: (tx: TransactionCreate) => Promise<void>;
  editTransaction: (id: string, tx: TransactionUpdate) => Promise<void>;
  importTransactions: (newTxs: TransactionCreate[]) => Promise<void>;
  previewBankStatement: (file: File, previewLimit?: number, maxRows?: number) => Promise<BankStatementPreviewResponse>;
  commitBankStatement: (params: BankStatementCommitParams) => Promise<BankStatementImportCommitResponse>;

  // Derived Financial Metrics
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;

  // Real Backend Budgets State & Operations
  budgets: ApiBudget[];
  isLoadingBudgets: boolean;
  budgetsError: string | null;
  loadBudgets: (params?: BudgetFilterParams) => Promise<ApiBudget[]>;
  createBudget: (payload: BudgetCreate) => Promise<ApiBudget>;
  updateBudget: (id: string, payload: BudgetUpdate) => Promise<ApiBudget>;
  deleteBudget: (id: string) => Promise<boolean>;
  addBudget: (budget: any) => Promise<ApiBudget>;
  editBudget: (id: string, budget: any) => Promise<ApiBudget>;

  // Real Backend Goals State & Operations
  goals: ApiGoal[];
  isLoadingGoals: boolean;
  goalsError: string | null;
  loadGoals: (params?: GoalFilterParams) => Promise<ApiGoal[]>;
  createGoal: (payload: GoalCreate) => Promise<ApiGoal>;
  updateGoal: (id: string, payload: GoalUpdate) => Promise<ApiGoal>;
  deleteGoal: (id: string) => Promise<boolean>;
  addFundsToGoal: (goalId: string, amount: number, note?: string) => Promise<GoalContribution>;
  addGoal: (goal: any) => Promise<ApiGoal>;
  editGoal: (id: string, goal: any) => Promise<ApiGoal>;

  // Real Backend Loans & Debt State & Operations
  loans: ApiLoan[];
  isLoadingLoans: boolean;
  loansError: string | null;
  debtStress: DebtStressAnalysisResponse | null;
  isLoadingDebtStress: boolean;
  debtStressError: string | null;
  totalDebt: number;
  totalMonthlyEmi: number;
  emiToIncomeRatio: number;
  loadLoans: () => Promise<ApiLoan[]>;
  createLoan: (payload: LoanCreate) => Promise<ApiLoan>;
  updateLoan: (id: string, payload: LoanUpdate) => Promise<ApiLoan>;
  deleteLoan: (id: string) => Promise<boolean>;
  addLoan: (loan: any) => Promise<ApiLoan>;
  editLoan: (id: string, loan: any) => Promise<ApiLoan>;
  loadDebtStress: () => Promise<DebtStressAnalysisResponse | null>;
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

  // Real Backend Analytics State & Operations
  analyticsOverview: AnalyticsOverviewResponse | null;
  isLoadingAnalytics: boolean;
  analyticsError: string | null;
  loadAnalytics: (params?: AnalyticsQueryParams) => Promise<AnalyticsOverviewResponse | null>;

  // Real Backend Financial Health State & Operations
  financialHealthOverview: FinancialHealthOverviewResponse | null;
  isLoadingFinancialHealth: boolean;
  financialHealthError: string | null;
  loadFinancialHealth: (params?: FinancialHealthQueryParams) => Promise<FinancialHealthOverviewResponse | null>;

  // Real Backend EMI & Amortization Operations
  getAmortizationSchedule: (params: AmortizationRequest) => Promise<AmortizationScheduleResponse>;
  calculateEmi: (params: EmiCalculationRequest) => Promise<EmiCalculationResponse>;

  // Financial Health (legacy view-model fallback if needed)
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

  // Real Auth Operations
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  loadCurrentUser: () => Promise<boolean>;
  clearAuthError: () => void;

  // Profile update & Reset
  updateProfile: (profile: Partial<UserProfile>) => void;
  resetAllData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const GUEST_USER: UserProfile = {
  name: "FinSage User",
  initials: "FU",
  email: "",
  phone: "+91 98765 43210",
  currency: "INR",
  panNumber: "ABCDE1234F",
  monthlyIncome: 85000,
  riskAppetite: "Moderate",
  joinedDate: "Recently",
};

const mapAuthUserToProfile = (
  authUser: AuthUser,
  savedProfile?: Partial<UserProfile>
): UserProfile => {
  const name = authUser.full_name?.trim() || authUser.email.split('@')[0];
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'FS';

  const joinedDate = authUser.created_at
    ? new Date(authUser.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  return {
    name,
    initials,
    email: authUser.email,
    phone: savedProfile?.phone || GUEST_USER.phone,
    currency: savedProfile?.currency || 'INR',
    panNumber: savedProfile?.panNumber || GUEST_USER.panNumber,
    monthlyIncome: savedProfile?.monthlyIncome || 85000,
    riskAppetite: savedProfile?.riskAppetite || 'Moderate',
    joinedDate,
    avatarUrl: savedProfile?.avatarUrl,
  };
};






const INITIAL_SECURITY_ALERTS: SecurityAlert[] = [
  {
    id: "sec-1",
    transactionId: "tx-6",
    merchant: "Unknown Intl Gateway - London",
    amount: 18450,
    date: "2026-09-13 03:42 AM",
    riskScore: 92,
    riskLevel: "high",
    reasons: [
      "Foreign IP (United Kingdom) detected during off-hours",
      "Transaction amount 4.2x above your 90-day typical shopping spend",
      "Device fingerprint (Linux Desktop) does not match your trusted profile",
    ],
    status: "pending",
    location: "London, United Kingdom",
    device: "Linux x86_64 • Firefox 129",
    ipAddress: "185.220.101.5",
  },
  {
    id: "sec-2",
    transactionId: "tx-17",
    merchant: "Crypto-Fast Trade Global",
    amount: 5000,
    date: "2026-09-02 11:15 PM",
    riskScore: 84,
    riskLevel: "high",
    reasons: [
      "Merchant entity flagged in international cybercrime risk registry",
      "High-risk crypto exchange categorized under speculative transfers",
    ],
    status: "pending",
    location: "Nicosia, Cyprus",
    device: "Android 14 • Chrome Mobile",
    ipAddress: "194.26.29.112",
  },
  {
    id: "sec-3",
    merchant: "Steam Games EU Store",
    amount: 3200,
    date: "2026-08-25 09:12 PM",
    riskScore: 28,
    riskLevel: "low",
    reasons: [
      "Frequent recurring digital entertainment vendor",
      "Verified 3D Secure OTP authentication succeeded",
    ],
    status: "safe",
    location: "Luxembourg",
    device: "MacBook Pro • Safari 17.5",
    ipAddress: "49.37.142.9",
  },
];

const INITIAL_HOLDINGS: MarketHolding[] = [
  {
    id: "h-1",
    symbol: "NIFTYBEES",
    name: "Nippon India ETF Nifty 50 BeES",
    assetClass: "Mutual Funds",
    units: 680,
    avgBuyPrice: 245.5,
    currentPrice: 278.4,
    investedValue: 166940,
    currentValue: 189312,
    pnl: 22372,
    pnlPercentage: 13.4,
    dailyChangePercentage: 0.42,
  },
  {
    id: "h-2",
    symbol: "HDFCBANK",
    name: "HDFC Bank Limited",
    assetClass: "Stocks",
    units: 95,
    avgBuyPrice: 1520.0,
    currentPrice: 1672.5,
    investedValue: 144400,
    currentValue: 158887,
    pnl: 14487,
    pnlPercentage: 10.03,
    dailyChangePercentage: 0.65,
  },
  {
    id: "h-3",
    symbol: "RELIANCE",
    name: "Reliance Industries Limited",
    assetClass: "Stocks",
    units: 24,
    avgBuyPrice: 2780.0,
    currentPrice: 2990.6,
    investedValue: 66720,
    currentValue: 71774,
    pnl: 5054,
    pnlPercentage: 7.57,
    dailyChangePercentage: -0.15,
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
      title: "Slash Home Loan Interest by ₹4.8L",
      impact: "+5 Health Points",
      action: "Add ₹5,000 extra monthly prepayment to reduce tenure by 38 months.",
    },
    {
      title: "Optimize Swiggy / Dining Out",
      impact: "+3 Health Points",
      action: "Cap weekend delivery spends to ₹1,500/week to recover ₹3,200 monthly.",
    },
  ],
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Scam Shield Alert: Foreign IP Attempt",
    message: "A ₹18,450 transaction was attempted from London, UK. Review & approve if valid.",
    timestamp: "10m ago",
    read: false,
    type: "security",
  },
  {
    id: "notif-2",
    title: "SIP Deduction Completed",
    message: "₹8,000 auto-invested into Emergency Fund Goal for September.",
    timestamp: "2h ago",
    read: false,
    type: "goal",
  },
  {
    id: "notif-3",
    title: "Budget Warning: Food & Dining",
    message: "You have used 77% (₹9,200/₹12,00,000) of your dining budget with 12 days left.",
    timestamp: "1d ago",
    read: true,
    type: "alert",
  },
  {
    id: "notif-4",
    title: "Monthly Financial Audit Ready",
    message: "Your September 2026 AI Financial Diagnostic Report has been generated.",
    timestamp: "3d ago",
    read: true,
    type: "insight",
  },
];

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: "chat-1",
    sender: "assistant",
    text: "Hello! 👋 I'm FinSage, your AI Financial Copilot. I have full context on your net worth, monthly cash flow, budgets, and goals. How can I assist you today?",
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
  const clerkAuth = useAuth();
  const clerkUser = useUser();
  const clerk = useClerk();

  // Real Backend Auth State
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => tokenStorage.hasSession());
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [authError, setAuthError] = useState<string | null>(null);

  // User Profile representation
  const [customProfile, setCustomProfile] = useState<Partial<UserProfile>>(() => {
    try {
      const saved = localStorage.getItem('finsage_custom_profile');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const user: UserProfile = authUser
    ? mapAuthUserToProfile(authUser, customProfile)
    : { ...GUEST_USER, ...customProfile };

  const [selectedPeriod, setSelectedPeriod] = useState<string>("September 2026");

  // Real Backend Accounts State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  // Real Backend Transactions State
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [transactionsTotal, setTransactionsTotal] = useState<number>(0);
  const [transactionsPage, setTransactionsPage] = useState<number>(1);
  const [transactionsPageSize, setTransactionsPageSize] = useState<number>(20);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState<number>(1);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [activeTransactionFilters, setActiveTransactionFilters] = useState<TransactionFilterParams>({});

  // Real Backend Budgets State
  const [budgets, setBudgets] = useState<ApiBudget[]>([]);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState<boolean>(false);
  const [budgetsError, setBudgetsError] = useState<string | null>(null);

  // Real Backend Goals State
  const [goals, setGoals] = useState<ApiGoal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState<boolean>(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  // Real Backend Loans & Debt Stress State
  const [loans, setLoans] = useState<ApiLoan[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState<boolean>(false);
  const [loansError, setLoansError] = useState<string | null>(null);
  const [debtStress, setDebtStress] = useState<DebtStressAnalysisResponse | null>(null);
  const [isLoadingDebtStress, setIsLoadingDebtStress] = useState<boolean>(false);
  const [debtStressError, setDebtStressError] = useState<string | null>(null);

  // Real Backend Analytics State
  const [analyticsOverview, setAnalyticsOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Real Backend Financial Health State
  const [financialHealthOverview, setFinancialHealthOverview] = useState<FinancialHealthOverviewResponse | null>(null);
  const [isLoadingFinancialHealth, setIsLoadingFinancialHealth] = useState<boolean>(false);
  const [financialHealthError, setFinancialHealthError] = useState<string | null>(null);

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

  // Sync custom profile and preserved features to local storage
  useEffect(() => {
    localStorage.setItem('finsage_custom_profile', JSON.stringify(customProfile));
  }, [customProfile]);

  useEffect(() => {
    localStorage.setItem('finsage_alerts', JSON.stringify(securityAlerts));
  }, [securityAlerts]);

  // Derived Financial Metrics
  const monthlyIncome = user.monthlyIncome || 85000;
  const totalAccountBalances = accounts.reduce(
    (acc, a) => acc + Number(a.current_balance || a.balance || 0),
    0
  );
  const netWorth = totalAccountBalances > 0 ? totalAccountBalances : 1240000;
  const monthlyExpenses = 54200;
  const savingsRate = 28;

  const totalDebt = debtStress
    ? Number(debtStress.total_outstanding_debt)
    : loans.reduce((acc, l) => acc + Number(l.outstanding_principal || 0), 0);
  const totalMonthlyEmi = debtStress
    ? Number(debtStress.total_monthly_emi)
    : loans.reduce((acc, l) => acc + Number(l.monthly_emi || 0), 0);
  const emiToIncomeRatio = debtStress
    ? Number(debtStress.dti_ratio)
    : monthlyIncome > 0
    ? Math.round((totalMonthlyEmi / monthlyIncome) * 100)
    : 0;


  const securityScore = Math.max(
    10,
    100 - securityAlerts.filter((a) => a.status === 'pending').reduce((acc, a) => acc + (a.riskScore > 75 ? 30 : 15), 0)
  );

  const totalPortfolioInvested = marketHoldings.reduce((acc, h) => acc + h.investedValue, 0);
  const totalPortfolioValue = marketHoldings.reduce((acc, h) => acc + h.currentValue, 0);
  const totalPortfolioPnl = totalPortfolioValue - totalPortfolioInvested;
  const totalPortfolioPnlPercent = Number(((totalPortfolioPnl / totalPortfolioInvested) * 100).toFixed(2));

  // Clear auth error
  const clearAuthError = useCallback(() => {
    setAuthError(null);
    if (authStatus === 'error') {
      setAuthStatus(isAuthenticated ? 'authenticated' : 'unauthenticated');
    }
  }, [authStatus, isAuthenticated]);

  // Real Backend Analytics Operations
  const loadAnalytics = useCallback(
    async (params?: AnalyticsQueryParams): Promise<AnalyticsOverviewResponse | null> => {
      setIsLoadingAnalytics(true);
      setAnalyticsError(null);
      try {
        const data = await analyticsApi.getOverview(params);
        setAnalyticsOverview(data);
        return data;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to load spending analytics.');
        setAnalyticsError(msg);
        return null;
      } finally {
        setIsLoadingAnalytics(false);
      }
    },
    []
  );

  // Real Backend Financial Health Operations
  const loadFinancialHealth = useCallback(
    async (params?: FinancialHealthQueryParams): Promise<FinancialHealthOverviewResponse | null> => {
      setIsLoadingFinancialHealth(true);
      setFinancialHealthError(null);
      try {
        const data = await financialHealthApi.getOverview(params);
        setFinancialHealthOverview(data);
        return data;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to load financial health overview.');
        setFinancialHealthError(msg);
        return null;
      } finally {
        setIsLoadingFinancialHealth(false);
      }
    },
    []
  );

  // Real Backend EMI & Amortization Operations
  const getAmortizationSchedule = useCallback(
    async (params: AmortizationRequest): Promise<AmortizationScheduleResponse> => {
      return await emiApi.getAmortizationSchedule(params);
    },
    []
  );

  const calculateEmi = useCallback(
    async (params: EmiCalculationRequest): Promise<EmiCalculationResponse> => {
      return await emiApi.calculate(params);
    },
    []
  );

  // Real Accounts Operations
  const loadAccounts = useCallback(async (): Promise<Account[]> => {

    setIsLoadingAccounts(true);
    setAccountsError(null);
    try {
      const data = await accountsApi.list();
      setAccounts(data);
      return data;
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to load accounts.');
      setAccountsError(msg);
      return [];
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  const createAccount = useCallback(async (payload: AccountCreate): Promise<Account> => {
    setIsLoadingAccounts(true);
    setAccountsError(null);
    try {
      const newAcc = await accountsApi.create(payload);
      setAccounts((prev) => [...prev, newAcc]);
      return newAcc;
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to create account.');
      setAccountsError(msg);
      throw err;
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  const updateAccount = useCallback(async (id: string, payload: AccountUpdate): Promise<Account> => {
    setIsLoadingAccounts(true);
    setAccountsError(null);
    try {
      const updated = await accountsApi.update(id, payload);
      setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to update account.');
      setAccountsError(msg);
      throw err;
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  const deleteAccount = useCallback(async (id: string): Promise<boolean> => {
    setIsLoadingAccounts(true);
    setAccountsError(null);
    try {
      await accountsApi.delete(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to delete account.');
      setAccountsError(msg);
      return false;
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  // Real Budgets Operations
  const loadBudgets = useCallback(
    async (params?: BudgetFilterParams): Promise<ApiBudget[]> => {
      setIsLoadingBudgets(true);
      setBudgetsError(null);
      try {
        const data = await budgetsApi.list(params);
        setBudgets(data);
        return data;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to load budgets.');
        setBudgetsError(msg);
        return [];
      } finally {
        setIsLoadingBudgets(false);
      }
    },
    []
  );

  const createBudget = useCallback(
    async (payload: BudgetCreate): Promise<ApiBudget> => {
      setIsLoadingBudgets(true);
      setBudgetsError(null);
      try {
        const newBudget = await budgetsApi.create(payload);
        setBudgets((prev) => [...prev, newBudget]);
        return newBudget;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to create budget.');
        setBudgetsError(msg);
        throw err;
      } finally {
        setIsLoadingBudgets(false);
      }
    },
    []
  );

  const updateBudget = useCallback(
    async (id: string, payload: BudgetUpdate): Promise<ApiBudget> => {
      setIsLoadingBudgets(true);
      setBudgetsError(null);
      try {
        const updated = await budgetsApi.update(id, payload);
        setBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));
        return updated;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to update budget.');
        setBudgetsError(msg);
        throw err;
      } finally {
        setIsLoadingBudgets(false);
      }
    },
    []
  );

  const deleteBudget = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoadingBudgets(true);
      setBudgetsError(null);
      try {
        await budgetsApi.delete(id);
        setBudgets((prev) => prev.filter((b) => b.id !== id));
        return true;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to delete budget.');
        setBudgetsError(msg);
        return false;
      } finally {
        setIsLoadingBudgets(false);
      }
    },
    []
  );

  const addBudget = useCallback(
    async (budget: any): Promise<ApiBudget> => {
      return await createBudget(budget);
    },
    [createBudget]
  );

  const editBudget = useCallback(
    async (id: string, budget: any): Promise<ApiBudget> => {
      return await updateBudget(id, budget);
    },
    [updateBudget]
  );

  // Real Goals Operations
  const loadGoals = useCallback(
    async (params?: GoalFilterParams): Promise<ApiGoal[]> => {
      setIsLoadingGoals(true);
      setGoalsError(null);
      try {
        const data = await goalsApi.list(params);
        setGoals(data);
        return data;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to load goals.');
        setGoalsError(msg);
        return [];
      } finally {
        setIsLoadingGoals(false);
      }
    },
    []
  );

  const createGoal = useCallback(
    async (payload: GoalCreate): Promise<ApiGoal> => {
      setIsLoadingGoals(true);
      setGoalsError(null);
      try {
        const newGoal = await goalsApi.create(payload);
        setGoals((prev) => [...prev, newGoal]);
        return newGoal;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to create goal.');
        setGoalsError(msg);
        throw err;
      } finally {
        setIsLoadingGoals(false);
      }
    },
    []
  );

  const updateGoal = useCallback(
    async (id: string, payload: GoalUpdate): Promise<ApiGoal> => {
      setIsLoadingGoals(true);
      setGoalsError(null);
      try {
        const updated = await goalsApi.update(id, payload);
        setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
        return updated;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to update goal.');
        setGoalsError(msg);
        throw err;
      } finally {
        setIsLoadingGoals(false);
      }
    },
    []
  );

  const deleteGoal = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoadingGoals(true);
      setGoalsError(null);
      try {
        await goalsApi.delete(id);
        setGoals((prev) => prev.filter((g) => g.id !== id));
        return true;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to delete goal.');
        setGoalsError(msg);
        return false;
      } finally {
        setIsLoadingGoals(false);
      }
    },
    []
  );

  const addFundsToGoal = useCallback(
    async (goalId: string, amount: number, note?: string): Promise<GoalContribution> => {
      setIsLoadingGoals(true);
      setGoalsError(null);
      try {
        const today = new Date().toISOString().split('T')[0];
        const contribution = await goalsApi.createContribution(goalId, {
          amount,
          contribution_date: today,
          note: note || 'Deposit',
        });
        await loadGoals();
        return contribution;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to add funds to goal.');
        setGoalsError(msg);
        throw err;
      } finally {
        setIsLoadingGoals(false);
      }
    },
    [loadGoals]
  );

  const addGoal = useCallback(
    async (g: any): Promise<ApiGoal> => {
      return await createGoal(g);
    },
    [createGoal]
  );

  const editGoal = useCallback(
    async (id: string, g: any): Promise<ApiGoal> => {
      return await updateGoal(id, g);
    },
    [updateGoal]
  );

  // Real Backend Loans & Debt Stress Operations
  const loadLoans = useCallback(async (): Promise<ApiLoan[]> => {
    setIsLoadingLoans(true);
    setLoansError(null);
    try {
      const data = await loansApi.list();
      setLoans(data);
      return data;
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to load loans.');
      setLoansError(msg);
      setLoans([]);
      return [];
    } finally {
      setIsLoadingLoans(false);
    }
  }, []);

  const loadDebtStress = useCallback(async (): Promise<DebtStressAnalysisResponse | null> => {
    setIsLoadingDebtStress(true);
    setDebtStressError(null);
    try {
      const data = await loansApi.getDebtStress();
      setDebtStress(data);
      return data;
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to load debt stress overview.');
      setDebtStressError(msg);
      return null;
    } finally {
      setIsLoadingDebtStress(false);
    }
  }, []);

  const createLoan = useCallback(
    async (payload: LoanCreate): Promise<ApiLoan> => {
      setIsLoadingLoans(true);
      setLoansError(null);
      try {
        const created = await loansApi.create(payload);
        await loadLoans();
        await loadDebtStress();
        return created;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to create loan record.');
        setLoansError(msg);
        throw err;
      } finally {
        setIsLoadingLoans(false);
      }
    },
    [loadLoans, loadDebtStress]
  );

  const updateLoan = useCallback(
    async (id: string, payload: LoanUpdate): Promise<ApiLoan> => {
      setIsLoadingLoans(true);
      setLoansError(null);
      try {
        const updated = await loansApi.update(id, payload);
        await loadLoans();
        await loadDebtStress();
        return updated;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to update loan record.');
        setLoansError(msg);
        throw err;
      } finally {
        setIsLoadingLoans(false);
      }
    },
    [loadLoans, loadDebtStress]
  );

  const deleteLoan = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoadingLoans(true);
      setLoansError(null);
      try {
        await loansApi.delete(id);
        await loadLoans();
        await loadDebtStress();
        return true;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to delete loan record.');
        setLoansError(msg);
        return false;
      } finally {
        setIsLoadingLoans(false);
      }
    },
    [loadLoans, loadDebtStress]
  );

  const addLoan = useCallback(
    async (payload: any): Promise<ApiLoan> => {
      return await createLoan(payload);
    },
    [createLoan]
  );

  const editLoan = useCallback(
    async (id: string, payload: any): Promise<ApiLoan> => {
      return await updateLoan(id, payload);
    },
    [updateLoan]
  );



  // Real Transactions Operations
  const loadTransactions = useCallback(
    async (filters?: TransactionFilterParams): Promise<TransactionPaginatedResponse> => {
      setIsLoadingTransactions(true);
      setTransactionsError(null);
      const effectiveFilters = filters || activeTransactionFilters;
      setActiveTransactionFilters(effectiveFilters);

      try {
        const response = await transactionsApi.list(effectiveFilters);
        setTransactions(response.items);
        setTransactionsTotal(response.total);
        setTransactionsPage(response.page);
        setTransactionsPageSize(response.page_size);
        setTransactionsTotalPages(response.total_pages);
        return response;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to load transactions.');
        setTransactionsError(msg);
        return {
          items: [],
          total: 0,
          page: 1,
          page_size: 20,
          total_pages: 1,
        };
      } finally {
        setIsLoadingTransactions(false);
      }
    },
    [activeTransactionFilters]
  );

  const createTransaction = useCallback(
    async (payload: TransactionCreate): Promise<ApiTransaction> => {
      setIsLoadingTransactions(true);
      setTransactionsError(null);
      try {
        const created = await transactionsApi.create(payload);
        // Refresh transaction list, accounts, budgets, analytics, and health to update authoritative metrics
        await loadTransactions();
        await loadAccounts();
        await loadBudgets();
        await loadAnalytics();
        await loadFinancialHealth();
        return created;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to create transaction.');
        setTransactionsError(msg);
        throw err;
      } finally {
        setIsLoadingTransactions(false);
      }
    },
    [loadTransactions, loadAccounts, loadBudgets, loadAnalytics, loadFinancialHealth]
  );

  const updateTransaction = useCallback(
    async (id: string, payload: TransactionUpdate): Promise<ApiTransaction> => {
      setIsLoadingTransactions(true);
      setTransactionsError(null);
      try {
        const updated = await transactionsApi.update(id, payload);
        await loadTransactions();
        await loadAccounts();
        await loadBudgets();
        await loadAnalytics();
        await loadFinancialHealth();
        return updated;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to update transaction.');
        setTransactionsError(msg);
        throw err;
      } finally {
        setIsLoadingTransactions(false);
      }
    },
    [loadTransactions, loadAccounts, loadBudgets, loadAnalytics, loadFinancialHealth]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoadingTransactions(true);
      setTransactionsError(null);
      try {
        await transactionsApi.delete(id);
        await loadTransactions();
        await loadAccounts();
        await loadBudgets();
        await loadAnalytics();
        await loadFinancialHealth();
        return true;
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to delete transaction.');
        setTransactionsError(msg);
        return false;
      } finally {
        setIsLoadingTransactions(false);
      }
    },
    [loadTransactions, loadAccounts, loadBudgets, loadAnalytics, loadFinancialHealth]
  );

  const addTransaction = useCallback(
    async (tx: TransactionCreate) => {
      await createTransaction(tx);
    },
    [createTransaction]
  );

  const editTransaction = useCallback(
    async (id: string, tx: TransactionUpdate) => {
      await updateTransaction(id, tx);
    },
    [updateTransaction]
  );

  const importTransactions = useCallback(
    async (newTxs: TransactionCreate[]) => {
      for (const tx of newTxs) {
        await transactionsApi.create(tx);
      }
      await loadTransactions();
      await loadAccounts();
      await loadBudgets();
      await loadAnalytics();
      await loadFinancialHealth();
    },
    [loadTransactions, loadAccounts, loadBudgets, loadAnalytics, loadFinancialHealth]
  );


  const previewBankStatement = useCallback(
    async (file: File, previewLimit = 100, maxRows = 5000): Promise<BankStatementPreviewResponse> => {
      return await bankImportApi.preview(file, previewLimit, maxRows);
    },
    []
  );

  const commitBankStatement = useCallback(

    async (params: BankStatementCommitParams): Promise<BankStatementImportCommitResponse> => {
      const res = await bankImportApi.commit(params);
      await loadTransactions();
      await loadAccounts();
      await loadBudgets();
      await loadGoals();
      await loadLoans();
      await loadDebtStress();
      await loadAnalytics();
      await loadFinancialHealth();
      return res;
    },
    [loadTransactions, loadAccounts, loadBudgets, loadGoals, loadLoans, loadDebtStress, loadAnalytics, loadFinancialHealth]
  );


  // Load Current User from Backend
  const loadCurrentUser = useCallback(async (): Promise<boolean> => {
    try {
      const current = await authApi.getCurrentUser();
      setAuthUser(current);
      setIsAuthenticated(true);
      setAuthStatus('authenticated');
      setAuthError(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Refresh Session from Backend
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await authApi.refresh();
      setAuthUser(res.user);
      setIsAuthenticated(true);
      setAuthStatus('authenticated');
      setAuthError(null);
      return true;
    } catch {
      tokenStorage.clearTokens();
      setAuthUser(null);
      setIsAuthenticated(false);
      setAuthStatus('unauthenticated');
      setAccounts([]);
      setTransactions([]);
      return false;
    }
  }, []);

  // Session Initialization on Mount
  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      if (tokenStorage.hasSession()) {
        setAuthStatus('loading');
        try {
          let userProfile: AuthUser;
          if (!tokenStorage.getAccessToken()) {
            const tokenRes = await authApi.refresh();
            userProfile = tokenRes.user;
          } else {
            try {
              userProfile = await authApi.getCurrentUser();
            } catch {
              const tokenRes = await authApi.refresh();
              userProfile = tokenRes.user;
            }
          }

          if (mounted) {
            setAuthUser(userProfile);
            setIsAuthenticated(true);
            setAuthStatus('authenticated');
            setAuthError(null);
          }
        } catch {
          if (mounted) {
            tokenStorage.clearTokens();
            setAuthUser(null);
            setIsAuthenticated(false);
            setAuthStatus('unauthenticated');
            setAccounts([]);
            setTransactions([]);
          }
        }
      } else {
        if (mounted) {
          setAuthUser(null);
          setIsAuthenticated(false);
          setAuthStatus('unauthenticated');
          setAccounts([]);
          setTransactions([]);
        }
      }
    };

    restoreSession();

    setOnUnauthorizedCallback(() => {
      if (mounted) {
        tokenStorage.clearTokens();
        setAuthUser(null);
        setIsAuthenticated(false);
        setAuthStatus('unauthenticated');
        setAccounts([]);
        setTransactions([]);
      }
    });

    return () => {
      mounted = false;
      setOnUnauthorizedCallback(null);
    };
  }, []);

  // Synchronize Clerk Auth Session
  useEffect(() => {
    let mounted = true;

    if (clerkAuth && clerkAuth.isLoaded) {
      if (clerkAuth.isSignedIn && clerkUser?.user) {
        const u = clerkUser.user;
        const email = u.primaryEmailAddress?.emailAddress || '';
        const name = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'FinSage User';

        const profileUser: AuthUser = {
          id: u.id,
          email,
          full_name: name,
          is_active: true,
          created_at: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
          updated_at: u.updatedAt ? new Date(u.updatedAt).toISOString() : null,
        };

        if (mounted) {
          setAuthUser(profileUser);
          setIsAuthenticated(true);
          setAuthStatus('authenticated');
          setAuthError(null);
        }

        // Attempt to fetch PostgreSQL backend user for canonical DB UUID
        authApi.getCurrentUser().then((backendUser) => {
          if (mounted && backendUser) {
            setAuthUser(backendUser);
          }
        }).catch(() => {
          // Backend will auto-provision on first request
        });
      } else if (!clerkAuth.isSignedIn && !tokenStorage.hasSession()) {
        if (mounted) {
          setAuthUser(null);
          setIsAuthenticated(false);
          setAuthStatus('unauthenticated');
          setAccounts([]);
          setTransactions([]);
          setBudgets([]);
          setGoals([]);
          setLoans([]);
          setDebtStress(null);
          setAnalyticsOverview(null);
          setFinancialHealthOverview(null);
        }
      }
    }

    return () => {
      mounted = false;
    };
  }, [clerkAuth?.isLoaded, clerkAuth?.isSignedIn, clerkUser?.user]);

  // Auto-fetch accounts, transactions, budgets, goals, loans, debt stress, analytics & health upon authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadAccounts();
      loadTransactions();
      loadBudgets();
      loadGoals();
      loadLoans();
      loadDebtStress();
      loadAnalytics();
      loadFinancialHealth();
    }
  }, [isAuthenticated, loadAccounts, loadTransactions, loadBudgets, loadGoals, loadLoans, loadDebtStress, loadAnalytics, loadFinancialHealth]);



  // Real Login Method
  const login = async (email: string, password?: string, _rememberMe = true): Promise<boolean> => {
    setAuthStatus('loading');
    setAuthError(null);

    if (!email || !email.includes('@')) {
      const msg = 'Please enter a valid email address.';
      setAuthError(msg);
      setAuthStatus('error');
      return false;
    }

    if (!password) {
      const msg = 'Password is required to sign in.';
      setAuthError(msg);
      setAuthStatus('error');
      return false;
    }

    try {
      const res = await authApi.login({ email: email.trim(), password });
      setAuthUser(res.user);
      setIsAuthenticated(true);
      setAuthStatus('authenticated');
      setAuthError(null);
      return true;
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Invalid email address or password.');
      setAuthError(msg);
      setAuthStatus('error');
      setIsAuthenticated(false);
      return false;
    }
  };

  // Real Registration Method
  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    setAuthStatus('loading');
    setAuthError(null);

    if (!fullName || fullName.trim().length === 0) {
      const msg = 'Full name is required.';
      setAuthError(msg);
      setAuthStatus('error');
      return false;
    }

    if (!email || !email.includes('@')) {
      const msg = 'Please enter a valid email address.';
      setAuthError(msg);
      setAuthStatus('error');
      return false;
    }

    if (!password || password.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setAuthError(msg);
      setAuthStatus('error');
      return false;
    }

    try {
      await authApi.register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
      });

      const loginRes = await authApi.login({
        email: email.trim(),
        password,
      });

      setAuthUser(loginRes.user);
      setIsAuthenticated(true);
      setAuthStatus('authenticated');
      setAuthError(null);
      return true;
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Registration failed. An account with this email may already exist.');
      setAuthError(msg);
      setAuthStatus('error');
      setIsAuthenticated(false);
      return false;
    }
  };

  // Real Logout Method
  const logout = async (): Promise<void> => {
    try {
      if (clerk?.signOut) {
        await clerk.signOut();
      }
    } catch {
      // Local cleanup occurs regardless
    }

    try {
      await authApi.logout();
    } catch {
      // Local cleanup occurs regardless
    } finally {
      tokenStorage.clearTokens();
      setAuthUser(null);
      setIsAuthenticated(false);
      setAuthStatus('unauthenticated');
      setAuthError(null);
      setAccounts([]);
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
      setLoans([]);
      setDebtStress(null);
      setAnalyticsOverview(null);
      setFinancialHealthOverview(null);
    }
  };

  // Profile update
  const updateProfile = (updated: Partial<UserProfile>) => {
    setCustomProfile((prev) => ({ ...prev, ...updated }));
  };

  // Loans Helpers

  const simulatePrepayment = useCallback(
    (loanId: string, extraMonthly: number) => {
      const targetLoan = loans.find((l) => l.id === loanId) || loans[0];
      if (!targetLoan) return { interestSaved: 0, monthsSaved: 0, newTenureMonths: 0 };

      const P = Number(targetLoan.outstanding_principal || 0);
      const r = Number(targetLoan.interest_rate || 0) / 12 / 100;
      const baseEmi = Number(targetLoan.monthly_emi || 0);
      const newEmi = baseEmi + extraMonthly;
      const remainingTenureMonths = Number(targetLoan.tenure_months || 0);

      if (newEmi <= P * r || remainingTenureMonths <= 0 || r <= 0) {
        return { interestSaved: 0, monthsSaved: 0, newTenureMonths: remainingTenureMonths };
      }

      const nNew = Math.ceil(-Math.log(1 - (P * r) / newEmi) / Math.log(1 + r));
      const totalOriginalPayment = baseEmi * remainingTenureMonths;
      const totalNewPayment = newEmi * nNew;
      const interestSaved = Math.max(0, Math.round(totalOriginalPayment - totalNewPayment));
      const monthsSaved = Math.max(0, remainingTenureMonths - nNew);

      return {
        interestSaved,
        monthsSaved,
        newTenureMonths: Math.max(1, nNew),
      };
    },
    [loans]
  );


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

  const resetAllData = () => {
    setBudgets([]);
    setGoals([]);
    setLoans([]);
    setDebtStress(null);
    setAnalyticsOverview(null);
    setFinancialHealthOverview(null);
    setSecurityAlerts(INITIAL_SECURITY_ALERTS);
    setChatMessages(INITIAL_CHAT);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCustomProfile({});
    localStorage.removeItem('finsage_budgets');
    localStorage.removeItem('finsage_goals');
    localStorage.removeItem('finsage_loans');
    localStorage.removeItem('finsage_alerts');
    localStorage.removeItem('finsage_custom_profile');
  };

  return (
    <FinanceContext.Provider
      value={{
        authUser,
        isAuthenticated,
        authStatus,
        authError,
        login,
        register,
        logout,
        refreshSession,
        loadCurrentUser,
        clearAuthError,
        user,
        accounts,
        isLoadingAccounts,
        accountsError,
        loadAccounts,
        createAccount,
        updateAccount,
        deleteAccount,
        transactions,
        transactionsTotal,
        transactionsPage,
        transactionsPageSize,
        transactionsTotalPages,
        isLoadingTransactions,
        transactionsError,
        activeTransactionFilters,
        loadTransactions,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        addTransaction,
        editTransaction,
        importTransactions,
        previewBankStatement,
        commitBankStatement,
        netWorth,
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
        selectedPeriod,
        setSelectedPeriod,
        budgets,
        isLoadingBudgets,
        budgetsError,
        loadBudgets,
        createBudget,
        updateBudget,
        deleteBudget,
        addBudget,
        editBudget,
        goals,
        isLoadingGoals,
        goalsError,
        loadGoals,
        createGoal,
        updateGoal,
        deleteGoal,
        addFundsToGoal,
        addGoal,
        editGoal,
        loans,
        isLoadingLoans,
        loansError,
        debtStress,
        isLoadingDebtStress,
        debtStressError,
        totalDebt,
        totalMonthlyEmi,
        emiToIncomeRatio,
        loadLoans,
        createLoan,
        updateLoan,
        deleteLoan,
        addLoan,
        editLoan,
        loadDebtStress,
        simulatePrepayment,

        analyticsOverview,
        isLoadingAnalytics,
        analyticsError,
        loadAnalytics,

        financialHealthOverview,
        isLoadingFinancialHealth,
        financialHealthError,
        loadFinancialHealth,

        getAmortizationSchedule,
        calculateEmi,

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
    return {
      isAuthenticated: false,
      authStatus: 'unauthenticated',
      authUser: null,
      authError: null,
      user: GUEST_USER,
      accounts: [],
      transactions: [],
      budgets: [],
      goals: [],
      loans: [],
      debtStress: null,
      analyticsOverview: null,
      isLoadingAnalytics: false,
      analyticsError: null,
      financialHealthOverview: null,
      isLoadingFinancialHealth: false,
      financialHealthError: null,
      securityAlerts: [],
      notifications: [],
      chatMessages: [],
    } as unknown as FinanceContextType;
  }
  return context;
};

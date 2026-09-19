// Currency and Number Formatters for Indian and Global FinTech Standards

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (isNaN(amount)) return '₹0';
  
  if (currency === 'INR') {
    // Format in Indian Numbering System (Lakhs, Crores)
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    let result = '';
    const numStr = Math.floor(absAmount).toString();
    
    if (numStr.length <= 3) {
      result = numStr;
    } else {
      const lastThree = numStr.substring(numStr.length - 3);
      const otherNumbers = numStr.substring(0, numStr.length - 3);
      result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    }

    return (isNegative ? '-₹' : '₹') + result;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCompactNumber = (val: number): string => {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  if (val >= 1000) {
    return `₹${(val / 1000).toFixed(1)}k`;
  }
  return formatCurrency(val);
};

export const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const calculateEMI = (principal: number, annualRate: number, tenureMonths: number): {
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
} => {
  if (principal <= 0 || annualRate <= 0 || tenureMonths <= 0) {
    return { monthlyEmi: 0, totalInterest: 0, totalPayment: 0 };
  }
  const r = annualRate / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;

  return {
    monthlyEmi: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
  };
};

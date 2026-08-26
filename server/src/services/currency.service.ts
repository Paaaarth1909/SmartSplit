export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AED", symbol: "AED", name: "UAE Dirham" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "SGD", symbol: "SG$", name: "Singapore Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "ZAR", symbol: "R", name: "South African Rand" }
];

const FALLBACK_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  INR: 0.012,
  GBP: 1.28,
  CAD: 0.74,
  AUD: 0.65,
  JPY: 0.0068,
  AED: 0.27,
  THB: 0.029,
  SGD: 0.75,
  CHF: 1.13,
  CNY: 0.14,
  NZD: 0.60,
  ZAR: 0.055
};

const ratesCache: Map<string, { rates: Record<string, number>; timestamp: number }> = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

export const fetchLiveExchangeRates = async (baseCurrency: string = "USD"): Promise<Record<string, number>> => {
  const base = baseCurrency.toUpperCase();
  const cached = ratesCache.get(base);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.rates;
  }

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        ratesCache.set(base, { rates: data.rates, timestamp: Date.now() });
        return data.rates;
      }
    }
  } catch (error) {
    console.warn(`Failed to fetch live FX rates for ${base}, using fallback matrix`);
  }

  // Fallback calculations relative to USD
  const baseUsdRate = FALLBACK_RATES_TO_USD[base] || 1.0;
  const derivedRates: Record<string, number> = {};
  for (const [code, usdRate] of Object.entries(FALLBACK_RATES_TO_USD)) {
    derivedRates[code] = usdRate / baseUsdRate;
  }
  return derivedRates;
};

export interface ConversionResult {
  fromCurrency: string;
  toCurrency: string;
  originalAmount: number;
  exchangeRate: number;
  convertedAmount: number;
}

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<ConversionResult> => {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) {
    return {
      fromCurrency: from,
      toCurrency: to,
      originalAmount: amount,
      exchangeRate: 1.0,
      convertedAmount: Number(amount.toFixed(2))
    };
  }

  const rates = await fetchLiveExchangeRates(from);
  const rate = rates[to] || (FALLBACK_RATES_TO_USD[to] / (FALLBACK_RATES_TO_USD[from] || 1.0));
  const converted = amount * rate;

  return {
    fromCurrency: from,
    toCurrency: to,
    originalAmount: amount,
    exchangeRate: Number(rate.toFixed(6)),
    convertedAmount: Number(converted.toFixed(2))
  };
};

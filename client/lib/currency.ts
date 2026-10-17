const CURRENCY_KEY = 'smartsplit_currency';
const DEFAULT_CURRENCY = 'INR';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  locale: string;
}

const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB' },
  CAD: { code: 'CAD', symbol: 'CA$', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', locale: 'en-AU' },
  JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP' },
};

// Rates relative to 1 USD base
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 87.0,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.38,
  AUD: 1.54,
  JPY: 152.0,
};

export function getCurrencyCode(): string {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;
  return localStorage.getItem(CURRENCY_KEY) || DEFAULT_CURRENCY;
}

export function setCurrencyCode(code: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENCY_KEY, code);
  }
}

export function getCurrencyInfo(code?: string): CurrencyInfo {
  const c = (code || getCurrencyCode()).toUpperCase();
  return CURRENCY_MAP[c] || CURRENCY_MAP[DEFAULT_CURRENCY];
}

export function convertCurrency(
  amount: number,
  fromCurrency: string = 'INR',
  toCurrency: string = 'INR'
): number {
  const from = (fromCurrency || 'INR').toUpperCase();
  const to = (toCurrency || 'INR').toUpperCase();
  const val = Number(amount) || 0;
  if (from === to || isNaN(val)) return val;

  const rateFrom = EXCHANGE_RATES[from] || 1.0;
  const rateTo = EXCHANGE_RATES[to] || 1.0;

  const inUsd = val / rateFrom;
  return inUsd * rateTo;
}

export function formatCurrency(
  amount: number,
  currencyCode?: string,
  fromCurrency: string = 'INR'
): string {
  const target = (currencyCode || getCurrencyCode()).toUpperCase();
  const source = (fromCurrency || 'INR').toUpperCase();
  const converted = convertCurrency(Number(amount) || 0, source, target);
  const info = getCurrencyInfo(target);

  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency: info.code,
  }).format(Math.abs(converted));
}

export function getCurrencySymbol(currencyCode?: string): string {
  return getCurrencyInfo(currencyCode).symbol;
}

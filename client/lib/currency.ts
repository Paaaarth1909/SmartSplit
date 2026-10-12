
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

export function formatCurrency(amount: number, currencyCode?: string): string {
  const info = getCurrencyInfo(currencyCode);
  return new Intl.NumberFormat(info.locale, {
    style: 'currency',
    currency: info.code,
  }).format(Math.abs(Number(amount) || 0));
}

export function getCurrencySymbol(currencyCode?: string): string {
  return getCurrencyInfo(currencyCode).symbol;
}

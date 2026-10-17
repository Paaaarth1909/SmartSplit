'use client';

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  formatCurrency as rawFormatCurrency,
  getCurrencySymbol as rawGetCurrencySymbol,
  getCurrencyInfo,
  setCurrencyCode,
  convertCurrency,
  type CurrencyInfo,
} from '@/lib/currency';

export function useCurrency(groupCurrency?: string) {
  const { user } = useAuth();

  const currencyCode = useMemo(() => {
    const code = user?.preferences?.currency || 'INR';
    setCurrencyCode(code);
    return code;
  }, [user?.preferences?.currency]);

  const info: CurrencyInfo = useMemo(() => getCurrencyInfo(currencyCode), [currencyCode]);

  const formatCurrency = useMemo(
    () => (amount: number, sourceCurrency?: string) =>
      rawFormatCurrency(amount, currencyCode, sourceCurrency || groupCurrency || 'INR'),
    [currencyCode, groupCurrency],
  );

  const currencySymbol = useMemo(() => rawGetCurrencySymbol(currencyCode), [currencyCode]);

  return {
    currencyCode,
    currencySymbol,
    info,
    formatCurrency,
    convertCurrency,
  };
}

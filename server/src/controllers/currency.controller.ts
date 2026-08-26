import { Request, Response } from "express";
import {
  SUPPORTED_CURRENCIES,
  fetchLiveExchangeRates,
  convertCurrency
} from "../services/currency.service.js";

export const getSupportedCurrenciesList = async (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: SUPPORTED_CURRENCIES
  });
};

export const getExchangeRates = async (req: Request, res: Response) => {
  try {
    const baseCurrency = (req.query.base as string) || "USD";
    const rates = await fetchLiveExchangeRates(baseCurrency);
    return res.status(200).json({
      success: true,
      base: baseCurrency.toUpperCase(),
      rates
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch exchange rates"
    });
  }
};

export const convertExpenseCurrency = async (req: Request, res: Response) => {
  try {
    const { amount, from, to } = req.body;
    if (typeof amount !== "number" || !from || !to) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: amount (number), from (currency code), to (currency code)"
      });
    }

    const result = await convertCurrency(amount, from, to);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to convert currency"
    });
  }
};

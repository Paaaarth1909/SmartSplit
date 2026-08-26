import { Router } from "express";
import {
  getSupportedCurrenciesList,
  getExchangeRates,
  convertExpenseCurrency
} from "../controllers/currency.controller.js";

const router = Router();

router.get("/list", getSupportedCurrenciesList);
router.get("/rates", getExchangeRates);
router.post("/convert", convertExpenseCurrency);

export default router;

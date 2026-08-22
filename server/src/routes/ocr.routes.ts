import { Router } from "express";
import multer from "multer";
import { parseReceipt } from "../controllers/ocr.controller.js";
import { parseNlpExpense } from "../controllers/nlp.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router();

router.post("/ocr", upload.any(), parseReceipt);
router.post("/nlp", parseNlpExpense);
router.post("/parse-text", parseNlpExpense);

export default router;

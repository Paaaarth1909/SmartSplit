import { Router } from "express";
import multer from "multer";
import { parseReceipt } from "../controllers/ocr.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router();

router.post("/ocr", upload.single("receipt"), parseReceipt);

export default router;

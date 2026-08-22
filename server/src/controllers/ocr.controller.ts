import { Request, Response } from "express";
import { processReceiptImage } from "../services/ocr.service.js";
import {
  computeImageHash,
  checkForDuplicates,
} from "../services/duplicateDetection.service.js";

export const parseReceipt = async (req: Request, res: Response) => {
  try {
    let imageBuffer: Buffer | null = null;
    let mimeType = "image/jpeg";

    const file = req.file || (Array.isArray(req.files) && req.files.length > 0 ? req.files[0] : null);

    if (file) {
      imageBuffer = file.buffer;
      mimeType = file.mimetype;
    } else if (req.body && req.body.imageBase64) {
      const matches = req.body.imageBase64.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBuffer = Buffer.from(matches[2], "base64");
      } else {
        imageBuffer = Buffer.from(req.body.imageBase64, "base64");
      }
    }

    if (!imageBuffer) {
      return res.status(400).json({
        success: false,
        error: "No receipt image provided. Upload a file or pass imageBase64 string."
      });
    }

    // ------------------------------------------------------------------
    // Duplicate detection — Layer 1 (image hash)
    // ------------------------------------------------------------------
    const groupId = req.body?.groupId || req.query?.groupId;
    let imageHash: string | undefined;

    try {
      imageHash = await computeImageHash(imageBuffer);
    } catch (hashErr) {
      // Non-fatal: if hashing fails we still proceed with OCR
      console.warn("Receipt image hashing failed, skipping duplicate check:", hashErr);
    }

    if (imageHash && groupId) {
      const dupCheck = await checkForDuplicates({
        groupId: groupId as string,
        imageHash,
      });

      if (dupCheck.isDuplicate) {
        return res.status(409).json({
          success: false,
          isDuplicate: true,
          matchType: dupCheck.matchType,
          matchedExpenseId: dupCheck.matchedExpenseId,
          confidence: dupCheck.confidence,
          error: "This receipt appears to have been uploaded before.",
        });
      }
    }

    // ------------------------------------------------------------------
    // OCR processing (existing logic)
    // ------------------------------------------------------------------
    const result = await processReceiptImage(imageBuffer, mimeType);

    return res.status(200).json({
      success: true,
      data: { ...result, imageHash },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process receipt image"
    });
  }
};

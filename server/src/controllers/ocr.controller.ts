
import { Request, Response } from "express";
import { processReceiptImage } from "../services/ocr.service.js";

export const parseReceipt = async (req: Request, res: Response) => {
  try {
    let imageBuffer: Buffer | null = null;
    let mimeType = "image/jpeg";

    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (req.body.imageBase64) {
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

    const result = await processReceiptImage(imageBuffer, mimeType);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process receipt image"
    });
  }
};

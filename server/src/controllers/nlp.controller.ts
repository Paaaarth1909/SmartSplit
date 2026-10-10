import { Request, Response } from "express";
import { parseNaturalLanguageInput } from "../services/nlp.service.js";

export const parseNlpExpense = async (req: Request, res: Response) => {
  try {
    const textPrompt = req.body.prompt || req.body.text;

    if (!textPrompt || typeof textPrompt !== "string" || !textPrompt.trim()) {
      return res.status(400).json({
        success: false,
        error: "Text prompt is required. Provide 'prompt' or 'text' field."
      });
    }

    const result = await parseNaturalLanguageInput(textPrompt.trim());
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    let errorMsg = error.message || "Failed to parse natural language expense";
    try {
      const parsed = JSON.parse(errorMsg);
      if (parsed?.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch {}
    if (errorMsg.includes("high demand") || errorMsg.includes("UNAVAILABLE")) {
      errorMsg = "The AI model is currently experiencing high demand. Please try again in a moment or enter details manually.";
    }
    return res.status(500).json({
      success: false,
      error: errorMsg
    });
  }
};

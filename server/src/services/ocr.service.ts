import { GoogleGenAI } from "@google/genai";

export interface OcrItem {
  name: string;
  price: number;
  category?: string;
}

export interface OcrResult {
  merchant: string;
  date: string;
  currency: string;
  category: string;
  items: OcrItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}

const MODELS = [
  "gemini-3.8-flash",
<<<<<<< HEAD
  "gemini-3.5-flash-lite"
=======
  "gemini-3.5-flash",
  "gemini-flash-latest"
>>>>>>> 7421c18 (feat: update AI models, add Groq integration, and improve expense parsing and validation logic)
];

export const processReceiptImage = async (
  imageBuffer: Buffer,
  mimeType: string
): Promise<OcrResult> => {
  // Use Gemini API Key for OCR since Groq Vision models are offline
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analyze this receipt image and extract the following details into a strict JSON object:
- merchant (string: store/restaurant name)
- date (string: YYYY-MM-DD or readable date string if found, otherwise today's date)
- currency (string: 3-letter ISO code detected from currency symbols like $, €, £, ₹, ¥, AED, ฿ e.g. USD, EUR, INR, GBP, JPY, CAD, AUD, AED, THB)
- category (string: Dining, Groceries, Travel, Entertainment, Utilities, or General)
- items (array of objects: { name: string, price: number })
- subtotal (number)
- tax (number)
- tip (number)
- total (number)

Ensure all prices and totals are numeric values.
Do not wrap response in markdown codeblock markers if possible, return pure JSON.`;

  let responseText = "";
  let lastError: any = null;

  for (const modelName of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              data: imageBuffer.toString("base64"),
              mimeType: mimeType || "image/jpeg"
            }
          },
          prompt
        ]
      });
      if (response && response.text) {
        responseText = response.text;
        break;
      }
    } catch (err: any) {
      console.warn(`[OCR] Gemini model ${modelName} failed:`, err?.message || err);
      lastError = err;
    }
  }

  if (!responseText) {
    throw new Error(
      lastError?.message || "Failed to generate content with Gemini Vision API"
    );
  }

  const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
  let jsonString = cleanedText;
  const firstBrace = cleanedText.indexOf("{");
  const lastBrace = cleanedText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonString = cleanedText.substring(firstBrace, lastBrace + 1);
  }

  const parseNumber = (val: any): number => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const num = parseFloat(val.replace(/[^0-9.-]+/g, ""));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  try {
    const parsed = JSON.parse(jsonString);
    return {
      merchant: parsed.merchant || "Unknown Merchant",
      date: parsed.date || new Date().toISOString().split("T")[0],
      currency: parsed.currency ? String(parsed.currency).toUpperCase() : "USD",
      category: parsed.category || "General",
      items: Array.isArray(parsed.items)
        ? parsed.items.map((item: { name?: string; price?: any }) => ({
          name: item.name || "Item",
          price: parseNumber(item.price)
        }))
        : [],
      subtotal: parseNumber(parsed.subtotal),
      tax: parseNumber(parsed.tax),
      tip: parseNumber(parsed.tip),
      total: parseNumber(parsed.total)
    };
  } catch (err) {
    throw new Error("Failed to parse receipt JSON response from Gemini Vision");
  }
};

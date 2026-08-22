import { GoogleGenAI } from "@google/genai";

export interface OcrItem {
  name: string;
  price: number;
  category?: string;
}

export interface OcrResult {
  merchant: string;
  date: string;
  category: string;
  items: OcrItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}

const MODELS = ["gemini-3.6-flash"];

export const processReceiptImage = async (
  imageBuffer: Buffer,
  mimeType: string
): Promise<OcrResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analyze this receipt image and extract the following details into a strict JSON object:
- merchant (string: store/restaurant name)
- date (string: YYYY-MM-DD or readable date string if found, otherwise today's date)
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
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: imageBuffer.toString("base64"),
                  mimeType: mimeType || "image/jpeg"
                }
              }
            ]
          }
        ]
      });
      if (response && response.text) {
        responseText = response.text;
        break;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!responseText) {
    throw new Error(
      lastError?.message || "Failed to generate content with Gemini Vision API"
    );
  }

  const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(cleanedText);
    return {
      merchant: parsed.merchant || "Unknown Merchant",
      date: parsed.date || new Date().toISOString().split("T")[0],
      category: parsed.category || "General",
      items: Array.isArray(parsed.items)
        ? parsed.items.map((item: { name?: string; price?: number }) => ({
          name: item.name || "Item",
          price: typeof item.price === "number" ? item.price : 0
        }))
        : [],
      subtotal: typeof parsed.subtotal === "number" ? parsed.subtotal : 0,
      tax: typeof parsed.tax === "number" ? parsed.tax : 0,
      tip: typeof parsed.tip === "number" ? parsed.tip : 0,
      total: typeof parsed.total === "number" ? parsed.total : 0
    };
  } catch (err) {
    throw new Error("Failed to parse receipt JSON response from Gemini Vision");
  }
};

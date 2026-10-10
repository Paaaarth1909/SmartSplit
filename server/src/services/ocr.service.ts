import { GoogleGenAI } from "@google/genai";
import { KeyManager } from "../utils/KeyManager.js";
import Groq from "groq-sdk";

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

const groqKeyManager = new KeyManager("GROQ_API_KEY");
const geminiKeyManager = new KeyManager("GEMINI_API_KEY");

const GROQ_MODELS = [
  "llama-3.2-90b-vision-preview",
  "llama-3.2-11b-vision-preview"
];

const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest"
];

export const processReceiptImage = async (
  imageBuffer: Buffer,
  mimeType: string
): Promise<OcrResult> => {
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

  // 1. Try Groq API keys first
  let groqKey = groqKeyManager.getKey();
  if (groqKey) {
    let attempts = groqKeyManager.hasMultipleKeys() ? 4 : 1; // Try up to 4 times across rotated keys
    
    for (let i = 0; i < attempts; i++) {
      if (responseText) break;
      const groq = new Groq({ apiKey: groqKey });
      
      for (const modelName of GROQ_MODELS) {
        try {
          const response = await groq.chat.completions.create({
            model: modelName,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { 
                    type: "image_url", 
                    image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBuffer.toString("base64")}` } 
                  }
                ]
              }
            ],
            temperature: 0.1,
          });
          
          if (response.choices[0]?.message?.content) {
            responseText = response.choices[0].message.content;
            break;
          }
        } catch (err: any) {
          console.warn(`[OCR] Groq model ${modelName} failed with key index.`, err?.message || err);
          lastError = err;
          // If rate limit error (429) or unauthorized (401), rotate key and break to outer loop to retry
          if (err?.status === 429 || err?.status === 401) {
            groqKey = groqKeyManager.getNextKey();
            break;
          }
        }
      }
    }
  }

  // 2. Fallback to Gemini if Groq fails or no response
  if (!responseText) {
    let geminiKey = geminiKeyManager.getKey();
    if (geminiKey) {
      let attempts = geminiKeyManager.hasMultipleKeys() ? 4 : 1;
      
      for (let i = 0; i < attempts; i++) {
        if (responseText) break;
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        
        for (const modelName of GEMINI_MODELS) {
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
            if (err?.status === 429 || err?.status === 401 || err?.status === 503) {
              geminiKey = geminiKeyManager.getNextKey();
              break;
            }
          }
        }
      }
    }
  }

  if (!responseText) {
    let errorMsg = lastError?.message || "Failed to generate content with both Groq and Gemini Vision APIs";
    try {
      const parsed = JSON.parse(errorMsg);
      if (parsed?.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch {}
    if (errorMsg.includes("high demand") || errorMsg.includes("UNAVAILABLE")) {
      errorMsg = "The AI model is currently experiencing high demand. Please try again in a moment or enter details manually.";
    }
    throw new Error(errorMsg);
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
    throw new Error("Failed to parse receipt JSON response from Vision AI");
  }
};

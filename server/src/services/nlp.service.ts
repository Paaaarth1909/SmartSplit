import { GoogleGenAI } from "@google/genai";
import { KeyManager } from "../utils/keyManager.js";
import Groq from "groq-sdk";

export interface ParsedNlpExpense {
  title: string;
  merchant: string;
  amount: number;
  payer: string;
  participants: string[];
  splitType: "equal" | "percentage" | "fixed" | "itemized";
  category: string;
  date: string;
}

const groqKeyManager = new KeyManager("GROQ_API_KEY");
const geminiKeyManager = new KeyManager("GEMINI_API_KEY");

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant"
];

const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest"
];

export const parseNaturalLanguageInput = async (
  inputPrompt: string
): Promise<ParsedNlpExpense> => {
  const systemPrompt = `You are a financial natural language expense parser.
Parse the user's natural language prompt into a strict JSON object with the following schema:
- title (string: short title for the expense, e.g. "Dinner at Olive Garden")
- merchant (string: store/restaurant/vendor name if present, else same as title)
- amount (number: total expense cost as a positive number)
- payer (string: who paid for this expense, default "You" if not specified)
- participants (array of strings: names of people involved in the split including payer if implied)
- splitType (string: "equal", "percentage", "fixed", or "itemized")
- category (string: Dining, Groceries, Travel, Entertainment, Utilities, or General)
- date (string: YYYY-MM-DD format, default today's date if not mentioned)

Example input: "Dinner $84 at Olive Garden, split equal with Raj and Meena, paid by Alex"
Expected output JSON:
{
  "title": "Dinner at Olive Garden",
  "merchant": "Olive Garden",
  "amount": 84,
  "payer": "Alex",
  "participants": ["Alex", "Raj", "Meena"],
  "splitType": "equal",
  "category": "Dining",
  "date": "${new Date().toISOString().split("T")[0]}"
}

Return pure JSON only. Do not add markdown codeblock formatting if possible.`;

  let responseText = "";
  let lastError: any = null;

  // 1. Try Groq API keys first
  let groqKey = groqKeyManager.getKey();
  if (groqKey) {
    let attempts = groqKeyManager.hasMultipleKeys() ? 4 : 1;
    
    for (let i = 0; i < attempts; i++) {
      if (responseText) break;
      const groq = new Groq({ apiKey: groqKey });
      
      for (const modelName of GROQ_MODELS) {
        try {
          const response = await groq.chat.completions.create({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `User prompt to parse: "${inputPrompt}"` }
            ],
            temperature: 0.1,
          });
          
          if (response.choices[0]?.message?.content) {
            responseText = response.choices[0].message.content;
            break;
          }
        } catch (err: any) {
          console.warn(`[NLP] Groq model ${modelName} failed:`, err?.message || err);
          lastError = err;
          if (err?.status === 429 || err?.status === 401) {
            groqKey = groqKeyManager.getNextKey();
            break; // Break inner model loop to retry with new key
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
                systemPrompt,
                `User prompt to parse: "${inputPrompt}"`
              ]
            });
            if (response && response.text) {
              responseText = response.text;
              break;
            }
          } catch (err: any) {
            console.warn(`[NLP] Gemini model ${modelName} failed:`, err?.message || err);
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
    throw new Error(
      lastError?.message || "Failed to parse natural language expense prompt with AI"
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
    const validSplitTypes = ["equal", "percentage", "fixed", "itemized"];
    return {
      title: parsed.title || "Expense",
      merchant: parsed.merchant || parsed.title || "General Merchant",
      amount: parseNumber(parsed.amount),
      payer: parsed.payer || "You",
      participants: Array.isArray(parsed.participants) ? parsed.participants : ["You"],
      splitType: validSplitTypes.includes(parsed.splitType) ? parsed.splitType : "equal",
      category: parsed.category || "General",
      date: parsed.date || new Date().toISOString().split("T")[0]
    };
  } catch (err) {
    throw new Error("Failed to parse response JSON from NLP service");
  }
};

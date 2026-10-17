import { GoogleGenAI } from "@google/genai";
import { KeyManager } from "../utils/KeyManager.js";
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
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];

const withTimeout = <T>(promise: Promise<T>, ms: number = 8000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ]);
};

export const fallbackHeuristicParse = (prompt: string): ParsedNlpExpense => {
  const p = prompt.trim();
  const amountMatch = p.match(/(?:[\$₹€£]|rs\.?\s*)?(\d+(?:\.\d{1,2})?)(?:\s*(?:[\$₹€£]|rs\.?|bucks|dollars|rupees))?/i);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

  let payer = "You";
  const paidByMatch = p.match(/(?:paid\s+by|by)\s+([A-Za-z0-9_-]+)/i);
  const payerPaidMatch = p.match(/([A-Za-z0-9_-]+)\s+paid/i);
  if (paidByMatch) {
    payer = paidByMatch[1];
  } else if (payerPaidMatch && !["who", "someone", "i", "we"].includes(payerPaidMatch[1].toLowerCase())) {
    payer = payerPaidMatch[1];
  }

  const participants = new Set<string>();
  if (payer && payer.toLowerCase() !== "you" && payer.toLowerCase() !== "me" && payer.toLowerCase() !== "i") {
    participants.add(payer);
  } else {
    participants.add("You");
  }

  const splitWithMatch = p.match(/(?:split\s+(?:with|between)|with|between)\s+([A-Za-z0-9_,\s&]+?)(?:paid|\$|\d|$)/i);
  if (splitWithMatch) {
    const rawNames = splitWithMatch[1]
      .split(/,|and|&|\s+/)
      .map((n) => n.trim())
      .filter((n) => n && !["the", "all", "equally", "equal", "split"].includes(n.toLowerCase()));
    rawNames.forEach((n) => participants.add(n));
  }

  let title = "Expense";
  let merchant = "General Merchant";
  const atMatch = p.match(/at\s+([A-Za-z0-9\s&'-]+?)(?:split|paid|\$|\d|$)/i);
  if (atMatch) {
    merchant = atMatch[1].trim();
    title = p.split(/at\s+/i)[0].trim() || `Visit to ${merchant}`;
  } else {
    const words = p.split(/\s+/).slice(0, 4).join(" ");
    title = words || "Expense";
    merchant = words || "General Merchant";
  }

  let category = "General";
  const lower = p.toLowerCase();
  if (/dinner|lunch|breakfast|food|restaurant|cafe|coffee|drinks|pizza|burger|meal|eat|bar/i.test(lower)) {
    category = "Dining";
  } else if (/taxi|cab|uber|lyft|flight|train|bus|gas|fuel|petrol|travel/i.test(lower)) {
    category = "Travel";
  } else if (/grocery|groceries|supermarket|mart|walmart/i.test(lower)) {
    category = "Groceries";
  } else if (/movie|concert|tickets|game|netflix|cinema/i.test(lower)) {
    category = "Entertainment";
  } else if (/rent|wifi|electric|water|bill/i.test(lower)) {
    category = "Utilities";
  }

  return {
    title: title.length > 50 ? title.substring(0, 50) : title,
    merchant: merchant.length > 50 ? merchant.substring(0, 50) : merchant,
    amount,
    payer: payer.toLowerCase() === "me" || payer.toLowerCase() === "i" ? "You" : payer,
    participants: Array.from(participants),
    splitType: "equal",
    category,
    date: new Date().toISOString().split("T")[0],
  };
};

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

Return pure JSON only. Do not add markdown codeblock formatting.`;

  let responseText = "";

  let groqKey = groqKeyManager.getKey();
  if (groqKey) {
    const groq = new Groq({ apiKey: groqKey });
    for (const modelName of GROQ_MODELS) {
      if (responseText) break;
      try {
        const response = await withTimeout(
          groq.chat.completions.create({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `User prompt to parse: "${inputPrompt}"` }
            ],
            temperature: 0.1,
          }),
          6000
        );

        if (response.choices[0]?.message?.content) {
          responseText = response.choices[0].message.content;
          break;
        }
      } catch (err: any) {
        console.warn(`[NLP] Groq model ${modelName} warning:`, err?.message || err);
      }
    }
  }

  if (!responseText) {
    let geminiKey = geminiKeyManager.getKey();
    if (geminiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      for (const modelName of GEMINI_MODELS) {
        if (responseText) break;
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model: modelName,
              contents: [
                systemPrompt,
                `User prompt to parse: "${inputPrompt}"`
              ]
            }),
            7000
          );
          if (response && response.text) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          console.warn(`[NLP] Gemini model ${modelName} warning:`, err?.message || err);
        }
      }
    }
  }

  if (!responseText) {
    console.warn("[NLP] AI models unavailable or timed out, executing rule-based heuristic fallback parser");
    return fallbackHeuristicParse(inputPrompt);
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
      participants: Array.isArray(parsed.participants) && parsed.participants.length > 0 ? parsed.participants : ["You"],
      splitType: validSplitTypes.includes(parsed.splitType) ? parsed.splitType : "equal",
      category: parsed.category || "General",
      date: parsed.date || new Date().toISOString().split("T")[0]
    };
  } catch (_err) {
    console.warn("[NLP] Failed to parse JSON from AI model response, using heuristic parser fallback");
    return fallbackHeuristicParse(inputPrompt);
  }
};

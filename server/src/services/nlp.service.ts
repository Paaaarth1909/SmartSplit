import { GoogleGenAI } from "@google/genai";

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

const MODELS = ["gemini-3.6-flash"];

export const parseNaturalLanguageInput = async (
  inputPrompt: string
): Promise<ParsedNlpExpense> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

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

  for (const modelName of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt },
              { text: `User prompt to parse: "${inputPrompt}"` }
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
      lastError?.message || "Failed to parse natural language expense prompt"
    );
  }

  const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    const parsed = JSON.parse(cleanedText);
    const validSplitTypes = ["equal", "percentage", "fixed", "itemized"];
    return {
      title: parsed.title || "Expense",
      merchant: parsed.merchant || parsed.title || "General Merchant",
      amount: typeof parsed.amount === "number" ? parsed.amount : 0,
      payer: parsed.payer || "You",
      participants: Array.isArray(parsed.participants) ? parsed.participants : ["You"],
      splitType: validSplitTypes.includes(parsed.splitType) ? parsed.splitType : "equal",
      category: parsed.category || "General",
      date: parsed.date || new Date().toISOString().split("T")[0]
    };
  } catch (err) {
    throw new Error("Failed to parse response JSON from Gemini NLP service");
  }
};

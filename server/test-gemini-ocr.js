import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: dummyBase64,
            mimeType: "image/png"
          }
        },
        prompt
      ]
    });
    console.log("Raw output:", response.text);
  } catch(e) {
    console.error(e.message);
  }
}
run();

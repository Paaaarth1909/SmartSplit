import fs from "fs";
import { GoogleGenAI } from "@google/genai";

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Analyze this receipt image and extract the following details into a strict JSON object:
- merchant (string: store/restaurant name)
- total (number)
Ensure all prices and totals are numeric values.
Do not wrap response in markdown codeblock markers if possible, return pure JSON.`;

  // Create a 1x1 transparent png in base64
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
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
    console.log(response.text);
  } catch(e) {
    console.error(e);
  }
}
run();

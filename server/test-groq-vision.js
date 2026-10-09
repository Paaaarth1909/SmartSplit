import Groq from "groq-sdk";
import fs from "fs";

async function run() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = "Analyze this receipt image and extract details into a strict JSON object: merchant, date, total.";
  
  // Create a 1x1 transparent png in base64
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.2-11b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${dummyBase64}`,
              },
            },
          ],
        }
      ],
      temperature: 0.1,
    });
    console.log(response.choices[0].message.content);
  } catch(e) {
    console.error(e.message);
  }
}
run();

import Groq from "groq-sdk";
async function run() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Test" }]
    });
    console.log("Success:", response.choices[0].message.content);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();

import Groq from "groq-sdk";
async function run() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
      messages: [{ role: "user", content: [{ type: "text", text: "Test" }, { type: "image_url", image_url: { url: `data:image/png;base64,${dummyBase64}` } }] }]
    });
    console.log(response.choices[0].message.content);
  } catch(e) {
    console.error(e.message);
  }
}
run();

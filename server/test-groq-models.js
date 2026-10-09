import Groq from "groq-sdk";
async function run() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const models = await groq.models.list();
    console.log(models.data.map(m => m.id).join("\n"));
  } catch(e) {
    console.error(e.message);
  }
}
run();

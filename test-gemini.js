const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function test() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Success with gemini-1.5-flash:", result.response.text());
  } catch (e) {
    console.error("Failed with gemini-1.5-flash:", e.message);
    
    // Try listing models
    try {
      console.log("Listing models...");
      // The SDK doesn't have a simple listModels method in basic versions, 
      // but let's try a different model name.
      const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const result2 = await model2.generateContent("Hello");
      console.log("Success with gemini-1.5-flash-latest:", result2.response.text());
    } catch (e2) {
      console.error("Failed with gemini-1.5-flash-latest:", e2.message);
    }
  }
}

test();

// utils/openaiClient.ts

import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.YOUR_SITE_URL || "",
    "X-Title": process.env.YOUR_APP_NAME || "",
  },
});

export default openai;

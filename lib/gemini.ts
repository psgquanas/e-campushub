import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";

const genAI = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

const MODEL_FALLBACKS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash-preview-09-2025",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
] as const;

export async function generateWithFallback(prompt: string) {
  let lastError: any;

  for (const model of MODEL_FALLBACKS) {
    try {
      const response = await genAI.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      const text = response.text || "";

      return {
        text,
        modelUsed: model,
        usage: response.usageMetadata ?? {},
      };
    } catch (error: any) {
      console.warn(`Model ${model} failed, trying next…`);
      lastError = error;
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

export async function streamGenerateWithFallback(prompt: string) {
  let lastError: any;

  for (const model of MODEL_FALLBACKS) {
    try {
      const result = await genAI.models.generateContentStream({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      return {
        stream: result,
        modelUsed: model,
      };
    } catch (error: any) {
      console.warn(`Model ${model} failed, trying next…`);
      lastError = error;
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

export async function analyzeDocument(fileBuffer: Buffer, mimeType: string) {
  let lastError: any;

  for (const model of MODEL_FALLBACKS) {
    try {
      console.log(`🔄 Trying model: ${model} for mimeType: ${mimeType}`);

      const result = await genAI.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Please provide a concise summary of this document and extract its key text. If it's a PDF or image, read all the text you can find.",
              },
              {
                inlineData: {
                  data: fileBuffer.toString("base64"),
                  mimeType,
                },
              },
            ],
          },
        ],
      });

      const text = result.text || "";

      console.log("✅ Model succeeded:", model);
      console.log("📄 Extracted text preview:", text.substring(0, 200));

      return {
        summary: text.split("\n\n")[0] || "Summary unavailable",
        extractedText: text,
        modelUsed: model,
      };
    } catch (error: any) {
      console.error(`❌ Model ${model} failed:`, error.message);
      lastError = error;
    }
  }

  console.error("All models failed for document analysis:", lastError);
  return {
    summary: "Error during analysis - all models failed",
    extractedText: "Text extraction failed",
  };
}

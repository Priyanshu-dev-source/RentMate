import OpenAI from "openai";
import { env } from "../config/env";
import { COMPATIBILITY_SYSTEM_PROMPT } from "../prompts/compatibility.prompt";

export class OpenAiService {
  private openai: OpenAI | null = null;

  constructor() {
    // If key exists and is not the dummy placeholder, initialize OpenAI SDK
    const apiKey = env.OPENAI_API_KEY;
    if (apiKey && apiKey !== "mock-key-for-fallback-testing" && apiKey.trim() !== "") {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Run structured completion request with Exponential Backoff retry logic.
   */
  async getCompatibilityAnalysis(prompt: string): Promise<{ score: number; explanation: string }> {
    if (!this.openai) {
      throw new Error("OpenAI client not initialized (missing or mock API key)");
    }

    const maxRetries = 3;
    let attempt = 0;
    let delay = 500; // start with 500ms

    while (attempt < maxRetries) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: COMPATIBILITY_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        });

        const rawContent = response.choices[0]?.message?.content;
        if (!rawContent) {
          throw new Error("Empty response received from OpenAI");
        }

        const parsed = JSON.parse(rawContent.trim());
        if (typeof parsed.score !== "number" || typeof parsed.explanation !== "string") {
          throw new Error("Parsed JSON structure does not match expected output parameters");
        }

        return {
          score: parsed.score,
          explanation: parsed.explanation,
        };
      } catch (err: any) {
        attempt++;
        console.warn(`OpenAI call failed (attempt ${attempt}/${maxRetries}):`, err.message);
        
        if (attempt >= maxRetries) {
          throw err; // throw and let the system invoke the fallback rule engine
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // double delay time
      }
    }

    throw new Error("Unexpected end of retry loop");
  }
}

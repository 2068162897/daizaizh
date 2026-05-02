import OpenAI from "openai";
import { siteConfig } from "../../../siteConfig";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = (process.env.OPENAI_API_KEY || "").trim();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = new OpenAI({ apiKey });
    const cfg = siteConfig.geminiConfig;

    const response = await client.responses.create({
      model: cfg.modelId,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: cfg.systemPrompt.replace(/\\n/g, "\n") }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: message }],
        },
      ],
      max_output_tokens: cfg.maxOutputTokens,
      temperature: cfg.temperature,
    });

    const reply = response.output_text || "本喵现在不想理你喵。";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error?.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET() {
  return new Response(JSON.stringify({ status: "Ready", provider: "OpenAI" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

import OpenAI from "openai";
import { siteConfig } from "../../../siteConfig";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = (process.env.OPENAI_API_KEY || "").trim();
    const baseURL = (process.env.OPENAI_BASE_URL || "").trim();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY missing" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const client = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });
    const cfg = siteConfig.geminiConfig;
    const systemPrompt = cfg.systemPrompt.replace(/\\n/g, "\n");
    let reply = "";

    try {
      const response = await client.responses.create({
        model: cfg.modelId,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: message }],
          },
        ],
        max_output_tokens: cfg.maxOutputTokens,
        temperature: cfg.temperature,
      });

      reply = response.output_text || "";
    } catch {
      const completion = await client.chat.completions.create({
        model: cfg.modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: cfg.maxOutputTokens,
        temperature: cfg.temperature,
      });

      const content = completion.choices?.[0]?.message?.content;
      reply = typeof content === "string" ? content : "";
    }

    if (!reply) {
      reply = "本喵现在不想理你喵。";
    }

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
  return new Response(JSON.stringify({ status: "Ready", provider: "OpenAI-compatible" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

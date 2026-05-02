import OpenAI from "openai";
import { siteConfig } from "../../../siteConfig";

export const runtime = "nodejs";

type EndpointMode = "sdk" | "responses" | "chat";
type JsonObject = Record<string, unknown>;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

function normalizeBaseURL(raw: string) {
  return raw.trim().replace(/\/+$/, "");
}

function detectEndpointMode(rawBaseURL: string): {
  mode: EndpointMode;
  baseURL?: string;
  endpoint?: string;
} {
  const normalized = normalizeBaseURL(rawBaseURL);

  if (!normalized) {
    return { mode: "sdk" };
  }

  if (normalized.endsWith("/responses")) {
    return { mode: "responses", endpoint: normalized };
  }

  if (normalized.endsWith("/chat/completions")) {
    return { mode: "chat", endpoint: normalized };
  }

  return { mode: "sdk", baseURL: normalized };
}

function asObject(value: unknown): JsonObject | null {
  return typeof value === "object" && value !== null ? (value as JsonObject) : null;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getResponseText(data: unknown): string {
  const root = asObject(data);
  const outputText = getString(root?.output_text);

  if (outputText.trim()) {
    return outputText.trim();
  }

  const output = Array.isArray(root?.output) ? root.output : [];

  if (output.length > 0) {
    const texts = output
      .flatMap((item) => {
        const entry = asObject(item);
        return Array.isArray(entry?.content) ? entry.content : [];
      })
      .map((item) => {
        const entry = asObject(item);
        return getString(entry?.text) || getString(entry?.value);
      })
      .filter((item) => item.trim());

    if (texts.length > 0) {
      return texts.join("\n").trim();
    }
  }

  return "";
}

function getChatText(data: unknown): string {
  const root = asObject(data);
  const choices = Array.isArray(root?.choices) ? root.choices : [];
  const firstChoice = asObject(choices[0]);
  const message = asObject(firstChoice?.message);
  const content = message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const texts = content
      .map((item) => {
        const entry = asObject(item);
        return getString(entry?.text);
      })
      .filter((item) => item.trim());

    if (texts.length > 0) {
      return texts.join("\n").trim();
    }
  }

  return "";
}

async function readErrorDetail(res: Response) {
  const raw = await res.text();

  if (!raw) {
    return `HTTP ${res.status}`;
  }

  try {
    const parsed = JSON.parse(raw);
    const root = asObject(parsed);
    const errorValue = root?.error;
    const errorObject = asObject(errorValue);

    return (
      getString(errorObject?.message) ||
      getString(errorValue) ||
      getString(root?.message) ||
      raw
    );
  } catch {
    return raw;
  }
}

async function requestViaResponsesEndpoint(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  message: string,
  maxOutputTokens: number,
  temperature: number
) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
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
      max_output_tokens: maxOutputTokens,
      temperature,
    }),
  });

  if (!res.ok) {
    throw new Error(await readErrorDetail(res));
  }

  return getResponseText(await res.json());
}

async function requestViaChatEndpoint(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  message: string,
  maxOutputTokens: number,
  temperature: number
) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: maxOutputTokens,
      temperature,
    }),
  });

  if (!res.ok) {
    throw new Error(await readErrorDetail(res));
  }

  return getChatText(await res.json());
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = (process.env.OPENAI_API_KEY || "").trim();
    const rawBaseURL = (process.env.OPENAI_BASE_URL || "").trim();

    if (!apiKey) {
      return jsonResponse({ error: "OPENAI_API_KEY missing" }, 500);
    }

    const cfg = siteConfig.geminiConfig;
    const model = (process.env.OPENAI_MODEL || cfg.modelId || "").trim();
    const systemPrompt = (cfg.systemPrompt || "").replace(/\\n/g, "\n");
    const target = detectEndpointMode(rawBaseURL);
    let reply = "";

    if (target.mode === "responses" && target.endpoint) {
      reply = await requestViaResponsesEndpoint(
        target.endpoint,
        apiKey,
        model,
        systemPrompt,
        message,
        cfg.maxOutputTokens,
        cfg.temperature
      );
    } else if (target.mode === "chat" && target.endpoint) {
      reply = await requestViaChatEndpoint(
        target.endpoint,
        apiKey,
        model,
        systemPrompt,
        message,
        cfg.maxOutputTokens,
        cfg.temperature
      );
    } else {
      const client = new OpenAI({
        apiKey,
        ...(target.baseURL ? { baseURL: target.baseURL } : {}),
      });

      let responsesError = "";

      try {
        const response = await client.responses.create({
          model,
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

        reply = response.output_text?.trim() || "";
      } catch (error) {
        responsesError = getErrorMessage(error);
      }

      if (!reply) {
        try {
          const completion = await client.chat.completions.create({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message },
            ],
            max_tokens: cfg.maxOutputTokens,
            temperature: cfg.temperature,
          });

          reply = getChatText(completion);
        } catch (error) {
          const chatError = getErrorMessage(error);
          throw new Error(
            responsesError
              ? `responses: ${responsesError}; chat: ${chatError}`
              : chatError
          );
        }
      }
    }

    if (!reply) {
      reply = "本喵现在有点短路，等会儿再来喵。";
    }

    return jsonResponse({ reply });
  } catch (error) {
    return jsonResponse({ error: getErrorMessage(error) }, 500);
  }
}

export async function GET() {
  const rawBaseURL = (process.env.OPENAI_BASE_URL || "").trim();
  const target = detectEndpointMode(rawBaseURL);

  return jsonResponse({
    status: "Ready",
    provider: "OpenAI-compatible",
    endpointMode: target.mode,
    baseURLConfigured: Boolean(rawBaseURL),
  });
}

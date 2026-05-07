export const runtime = "nodejs";

const METING_API = "https://api.injahow.cn/meting/";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function fetchMeta(type: "song" | "lrc" | "pic", id: string) {
  const url = new URL(METING_API);
  url.searchParams.set("server", "netease");
  url.searchParams.set("type", type);
  url.searchParams.set("id", id);

  const res = await fetch(url.toString(), {
    headers: { accept: "application/json,text/plain,*/*" },
  });

  if (!res.ok) {
    throw new Error(`Meting API failed: HTTP ${res.status}`);
  }

  return res;
}

function withProxyHeaders(headers: Headers) {
  const out = new Headers(headers);
  out.set("Access-Control-Allow-Origin", "*");
  out.set("Cache-Control", "public, max-age=300, s-maxage=300");
  return out;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = (url.searchParams.get("id") || "").trim();
    const type = (url.searchParams.get("type") || "audio").trim();

    if (!id) {
      return jsonResponse({ error: "Missing id" }, 400);
    }

    if (type === "meta" || type === "song") {
      const res = await fetchMeta("song", id);
      return new Response(await res.text(), {
        status: res.status,
        headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=300, s-maxage=300" },
      });
    }

    if (type === "lrc") {
      const res = await fetchMeta("lrc", id);
      return textResponse(await res.text(), res.status);
    }

    if (type === "pic") {
      const res = await fetchMeta("pic", id);
      return new Response(res.body, {
        status: res.status,
        headers: withProxyHeaders(res.headers),
      });
    }

    const metaRes = await fetchMeta("song", id);
    const songs = (await metaRes.json()) as Array<{ url?: string }>;
    const src = songs?.[0]?.url?.trim();

    if (!src) {
      return jsonResponse({ error: "Audio source missing" }, 404);
    }

    const range = req.headers.get("range") || req.headers.get("Range");
    const audioRes = await fetch(src, {
      headers: range ? { Range: range } : undefined,
    });

    return new Response(audioRes.body, {
      status: audioRes.status,
      headers: withProxyHeaders(audioRes.headers),
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Music proxy failed" },
      500
    );
  }
}

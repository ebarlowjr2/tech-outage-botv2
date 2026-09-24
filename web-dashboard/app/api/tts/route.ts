import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CHARS = 600;
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

/**
 * Text-to-speech for the on-air presenter.
 * POST { text, voice? } -> audio/mpeg (MP3).
 *
 * Requires OPENAI_API_KEY. If it is not set, returns 503 so the client can
 * fall back to silent captions instead of erroring the whole dashboard.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
  }

  let body: { text?: string; voice?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.text ?? "").trim().slice(0, MAX_CHARS);
  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const voice = body.voice || process.env.TTS_VOICE || "ash";
  const model = process.env.TTS_MODEL || "gpt-4o-mini-tts";

  try {
    const upstream = await fetch(OPENAI_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, voice, input: text, response_format: "mp3" }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error("[tts] upstream error", upstream.status, detail.slice(0, 300));
      return NextResponse.json({ error: "TTS upstream failed" }, { status: 502 });
    }

    const audio = await upstream.arrayBuffer();
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[tts] request failed", error);
    return NextResponse.json({ error: "TTS request failed" }, { status: 500 });
  }
}

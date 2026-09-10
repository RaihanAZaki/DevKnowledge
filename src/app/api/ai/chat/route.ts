import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({ message: z.string().trim().min(2).max(12000) });

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      take: 40,
    });
    return NextResponse.json({ messages });
  } catch (error) {
    return safeError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Message is invalid.", 422);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return jsonError("GEMINI_API_KEY is not configured on the server.", 503);
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

    const recent = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    const conversation = recent.reverse().flatMap((item) => [
      { role: "user", parts: [{ text: item.question }] },
      { role: "model", parts: [{ text: item.answer }] },
    ]);
    conversation.push({ role: "user", parts: [{ text: parsed.data.message }] });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "You are DevKnowledge AI, a pragmatic software engineering assistant. Give structured, concise explanations, explain reasons and impact, and use Markdown code blocks when code is helpful. Never claim to have executed code unless you actually did." }],
        },
        contents: conversation,
        generationConfig: { temperature: 0.35, maxOutputTokens: 4096 },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Gemini API error", response.status, body.slice(0, 800));
      return jsonError("AI provider request failed. Check API key, model, and quota.", 502);
    }

    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!answer) return jsonError("AI provider returned an empty response.", 502);

    const saved = await prisma.chatMessage.create({ data: { userId: user.id, question: parsed.data.message, answer } });
    return NextResponse.json({ message: saved });
  } catch (error) {
    return safeError(error);
  }
}

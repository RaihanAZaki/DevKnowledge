import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";

export async function getChatHistory(userId: string) {
  return prisma.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, take: 40 });
}

export async function generateAiReply(userId: string, message: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AppError("GEMINI_API_KEY is not configured on the server.", 503);
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const recent = await prisma.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 });
  const conversation = recent.reverse().flatMap((item) => [
    { role: "user", parts: [{ text: item.question }] },
    { role: "model", parts: [{ text: item.answer }] },
  ]);
  conversation.push({ role: "user", parts: [{ text: message }] });
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: "You are DevKnowledge AI, a pragmatic software engineering assistant. Give structured, concise explanations, explain reasons and impact, and use Markdown code blocks when code is helpful. Never claim to have executed code unless you actually did." }] },
      contents: conversation,
      generationConfig: { temperature: 0.35, maxOutputTokens: 4096 },
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    console.error("Gemini API error", response.status, body.slice(0, 800));
    throw new AppError("AI provider request failed. Check API key, model, and quota.", 502);
  }
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!answer) throw new AppError("AI provider returned an empty response.", 502);
  return prisma.chatMessage.create({ data: { userId, question: message, answer } });
}

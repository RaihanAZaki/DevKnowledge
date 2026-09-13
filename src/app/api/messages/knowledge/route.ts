import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { listShareableKnowledge } from "@/server/messages/knowledge-chat.service";

export async function GET(request: Request) {
  const user = await getServerSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const items = await listShareableKnowledge(user.id, searchParams.get("q") ?? "");
  return NextResponse.json({ items });
}

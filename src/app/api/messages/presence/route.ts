import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { touchPresence } from "@/server/messages/presence.service";

export async function POST() {
  const user = await getServerSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const presence = await touchPresence(user.id);
  return NextResponse.json({ presence });
}

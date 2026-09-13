import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { transferGroupOwnership } from "@/server/messages/group-chat.service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const user = await getServerSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await context.params;

  try {
    const body = await request.json();
    const result = await transferGroupOwnership({
      groupId: id,
      ownerId: user.id,
      newOwnerId: String(body.memberId ?? ""),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to transfer ownership." },
      { status: 400 },
    );
  }
}

import {
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "@/lib/auth";

import {
  getAcceptedFriends,
} from "@/server/messages/group-chat.service";

export async function GET() {
  const user =
    await getServerSession();

  if (!user) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  const friends =
    await getAcceptedFriends(
      user.id,
    );

  return NextResponse.json({
    friends,
  });
}
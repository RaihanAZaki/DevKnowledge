import {
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "@/lib/auth";

import {
  leaveGroup,
} from "@/server/messages/group-chat.service";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: Context,
) {
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

  const { id } =
    await context.params;

  try {
    await leaveGroup(
      id,
      user.id,
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to leave group.",
      },
      {
        status: 400,
      },
    );
  }
}
import {
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "@/lib/auth";

import {
  setGroupMemberRole,
} from "@/server/messages/group-chat.service";

type Context = {
  params: Promise<{
    id: string;
    memberId: string;
  }>;
};

export async function PUT(
  request: Request,
  context: Context,
) {
  const user =
    await getServerSession();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  const {
    id,
    memberId,
  } =
    await context.params;

  try {
    const body =
      await request.json();

    if (
      body.role !==
        "ADMIN" &&
      body.role !==
        "MEMBER"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid role.",
        },
        {
          status: 400,
        },
      );
    }

    const member =
      await setGroupMemberRole({
        groupId: id,
        actorId:
          user.id,
        memberId,
        role:
          body.role,
      });

    return NextResponse.json({
      member,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to change role.",
      },
      {
        status: 400,
      },
    );
  }
}
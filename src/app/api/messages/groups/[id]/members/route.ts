import {
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "@/lib/auth";

import {
    addGroupMembers,
    removeGroupMember,
} from "@/server/messages/group-chat.service";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
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
    const body =
      await request.json();

    const members =
      await addGroupMembers({
        groupId: id,
        actorId:
          user.id,

        memberIds:
          Array.isArray(
            body.memberIds,
          )
            ? body.memberIds.filter(
                (
                    value: unknown,
                ): value is string =>
                    typeof value === "string",
                )
            : [],
      });

    return NextResponse.json({
      members,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to add members.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function DELETE(
  request: Request,
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
    const body =
      await request.json();

    await removeGroupMember({
      groupId: id,
      actorId:
        user.id,
      memberId:
        String(
          body.memberId ??
            "",
        ),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to remove member.",
      },
      {
        status: 400,
      },
    );
  }
}
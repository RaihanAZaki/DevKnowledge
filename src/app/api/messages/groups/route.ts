import {
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "@/lib/auth";

import {
  createGroup,
  listUserGroups,
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

  const groups =
    await listUserGroups(
      user.id,
    );

  return NextResponse.json({
    groups,
  });
}

export async function POST(
  request: Request,
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

  try {
    const body =
      await request.json();

    const group =
      await createGroup({
        ownerId:
          user.id,

        name:
          String(
            body.name ??
              "",
          ),

        description:
          typeof body.description ===
          "string"
            ? body.description
            : undefined,

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

    return NextResponse.json(
      {
        group,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create group.",
      },
      {
        status: 400,
      },
    );
  }
}
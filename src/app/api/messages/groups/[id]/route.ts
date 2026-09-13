import {
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "@/lib/auth";

import {
  deleteGroup,
  getGroup,
  updateGroupInfo,
} from "@/server/messages/group-chat.service";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
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
    const result =
      await getGroup(
        id,
        user.id,
      );

    return NextResponse.json(
      result,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Group not found.",
      },
      {
        status: 404,
      },
    );
  }
}

export async function DELETE(
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
    await deleteGroup(
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
            : "Unable to delete group.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: Context,
) {
  const user = await getServerSession();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await context.params;

  try {
    const body = await request.json();
    const group = await updateGroupInfo({
      groupId: id,
      actorId: user.id,
      name: String(body.name ?? ""),
      description: body.description == null ? null : String(body.description),
    });
    return NextResponse.json({ group });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update group." },
      { status: 400 },
    );
  }
}

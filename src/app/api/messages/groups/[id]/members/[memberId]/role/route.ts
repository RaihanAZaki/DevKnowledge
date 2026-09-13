import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth";

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
        error: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const {
      id,
      memberId,
    } = await context.params;

    const body =
      await request.json();

    const role =
      body?.role;

    if (
      role !== "ADMIN" &&
      role !== "MEMBER"
    ) {
      return NextResponse.json(
        {
          error:
            "Role must be ADMIN or MEMBER.",
        },
        {
          status: 400,
        },
      );
    }

    const member =
      await setGroupMemberRole({
        groupId: id,
        actorId: user.id,
        memberId,
        role,
      });

    return NextResponse.json({
      success: true,
      member,
    });
  } catch (error) {
    console.error(
      "UPDATE GROUP MEMBER ROLE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update member role.",
      },
      {
        status: 400,
      },
    );
  }
}
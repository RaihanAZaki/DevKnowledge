import {
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "@/lib/auth";

import {
  updateGroupAvatar,
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
        error:
          "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  const { id } =
    await context.params;

  try {
    const formData =
      await request.formData();

    const file =
      formData.get(
        "file",
      );

    if (
      !(file instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "Photo is required.",
        },
        {
          status: 400,
        },
      );
    }

    const group =
      await updateGroupAvatar({
        groupId: id,
        userId:
          user.id,
        file,
      });

    return NextResponse.json({
      group,
    });
  } catch (error) {
    console.error(
      "UPDATE GROUP AVATAR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update group photo.",
      },
      {
        status: 400,
      },
    );
  }
}
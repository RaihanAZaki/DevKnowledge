import {
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "@/lib/auth";

import {
  getGroupMessages,
  sendGroupMessage,
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
    const messages =
      await getGroupMessages(
        id,
        user.id,
      );

    return NextResponse.json({
      messages,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load messages.",
      },
      {
        status: 404,
      },
    );
  }
}

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

    const message =
      await sendGroupMessage({
        groupId: id,
        senderId:
          user.id,
        content:
          String(
            body.content ??
              "",
          ),
        attachment:
          body.attachment &&
          typeof body.attachment === "object"
            ? body.attachment
            : null,
      });

    return NextResponse.json(
      {
        message,
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
            : "Unable to send message.",
      },
      {
        status: 400,
      },
    );
  }
}
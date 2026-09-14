import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";

import {
  jsonError,
  safeError,
} from "@/lib/http";

import {
  deleteForumThread,
  getForumThread,
  updateForumThread,
} from "@/server/forum/forum.service";

import {
  forumThreadSchema,
} from "@/server/forum/forum.schema";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: Context,
) {
  try {
    const user =
      await requireUser(
        request,
      );

    if (!user) {
      return jsonError(
        "Unauthorized.",
        401,
      );
    }

    const { id } =
      await context.params;

    const data =
      await getForumThread(
        id,
        user,
      );

    return NextResponse.json(
      data,
    );
  } catch (error) {
    return safeError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: Context,
) {
  try {
    const user =
      await requireUser(
        request,
      );

    if (!user) {
      return jsonError(
        "Unauthorized.",
        401,
      );
    }

    const { id } =
      await context.params;

    const body =
      await request.json();

    const parsed =
      forumThreadSchema.safeParse(
        body,
      );

    if (!parsed.success) {
      return jsonError(
        "Invalid discussion data.",
        422,
        parsed.error.flatten(),
      );
    }

    const thread =
      await updateForumThread(
        id,
        user,
        parsed.data,
      );

    return NextResponse.json({
      thread,
    });
  } catch (error) {
    return safeError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: Context,
) {
  try {
    const user =
      await requireUser(
        request,
      );

    if (!user) {
      return jsonError(
        "Unauthorized.",
        401,
      );
    }

    const { id } =
      await context.params;

    await deleteForumThread(
      id,
      user,
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return safeError(error);
  }
}
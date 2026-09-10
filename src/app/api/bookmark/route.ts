import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.id,
        targetId: body.targetId,
        type: body.type,
      },
    });

    return NextResponse.json(
      {
        bookmark,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST /api/bookmark error:", error);

    return NextResponse.json(
      {
        error: "Failed to create bookmark.",
      },
      {
        status: 500,
      }
    );
  }
}
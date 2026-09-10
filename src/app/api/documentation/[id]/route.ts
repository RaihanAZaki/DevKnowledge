import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { canManage, requireUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-logs";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().trim().min(3).max(180),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().trim().min(3).max(100000),
  language: z.string().trim().min(1).max(50),
  category: z.enum(CATEGORY_OPTIONS),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  isPublished: z.boolean().default(true),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: Context
) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const { id } = await context.params;

    const document = await prisma.documentation.findUnique({
      where: { id },

      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },

        sharedWith: {
          where: {
            userId: user.id,
          },

          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

   if (!document) {
    return jsonError("Document not found.", 404);
    }

    const isOwner = document.authorId === user.id;

    const isPublic =
      document.visibility === "PUBLIC" &&
      document.isPublished;

    const isShared =
      document.sharedWith.length > 0;

    if (!isOwner && !isPublic && !isShared) {
      return jsonError("Forbidden.", 403);
    }

    return NextResponse.json({
      document,
      canManage: canManage(document.authorId, user),
      access: {
        isOwner,
        isPublic,
        isShared,
      },
    });
  } catch (error) {
    return safeError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: Context
) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const { id } = await context.params;

    const current = await prisma.documentation.findUnique({
      where: {
        id,
      },
      select: {
        authorId: true,
      },
    });

    if (!current) {
      return jsonError("Document not found.", 404);
    }

    if (!canManage(current.authorId, user)) {
      return jsonError("Forbidden.", 403);
    }

    const parsed = schema.safeParse(
      await request.json()
    );

    if (!parsed.success) {
      return jsonError(
        "Invalid document data.",
        422,
        parsed.error.flatten()
      );
    }

    const document = await prisma.documentation.update({
      where: {
        id,
      },
      data: {
        ...parsed.data,
        excerpt: parsed.data.excerpt || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "DOCUMENTATION",
      entityId: document.id,
      description: `Updated documentation "${document.title}".`,
    });

    return NextResponse.json({
      document,
    });
  } catch (error) {
    return safeError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: Context
) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const { id } = await context.params;

    const current = await prisma.documentation.findUnique({
      where: {
        id,
      },
      select: {
        authorId: true,
        title: true,
      },
    });

    if (!current) {
      return jsonError("Document not found.", 404);
    }

    if (!canManage(current.authorId, user)) {
      return jsonError("Forbidden.", 403);
    }

    await prisma.documentation.delete({
      where: {
        id,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "DOCUMENTATION",
      entityId: id,
      description: `Deleted documentation "${current.title}".`,
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return safeError(error);
  }
}
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { canManage, requireUser } from "@/lib/auth";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-logs";

const schema = z.object({
  ticketNo: z.string().trim().min(1).max(60),
  title: z.string().trim().min(3).max(180),
  description: z.string().max(2000).optional().nullable(),
  reason: z.string().trim().min(3).max(8000),
  impact: z.string().max(4000).optional().nullable(),
  language: z.string().trim().min(1).max(50),
  framework: z.string().max(80).optional().nullable(),
  category: z.enum(CATEGORY_OPTIONS),
  beforeCode: z.string().max(50000),
  afterCode: z.string().max(50000),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    const snippet = await prisma.codeSnippet.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, role: true } } },
    });
    if (!snippet) return jsonError("Snippet not found.", 404);
    return NextResponse.json({ snippet, canManage: canManage(snippet.authorId, user) });
  } catch (error) {
    return safeError(error);
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    const current = await prisma.codeSnippet.findUnique({ where: { id }, select: { authorId: true } });
    if (!current) return jsonError("Snippet not found.", 404);
    if (!canManage(current.authorId, user)) return jsonError("Forbidden.", 403);

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid snippet data.", 422, parsed.error.flatten());
    const snippet =
    await prisma.codeSnippet.update({
      where: {
        id,
      },

      data: {
        ...parsed.data,
        description:
          parsed.data.description || null,
        impact:
          parsed.data.impact || null,
        framework:
          parsed.data.framework || null,
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
    entity: "SNIPPET",
    entityId: snippet.id,
    description: `Updated code snippet "${snippet.title}".`,
  });

  return NextResponse.json({
    snippet,
  });
  } catch (error) {
    return safeError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    const current = await prisma.codeSnippet.findUnique({ where: { id }, select: { authorId: true, title: true } });
    if (!current) return jsonError("Snippet not found.", 404);
    if (!canManage(current.authorId, user)) return jsonError("Forbidden.", 403);
    await prisma.codeSnippet.delete({
      where: {
        id,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "SNIPPET",
      entityId: id,
      description: `Deleted code snippet "${current.title}".`,
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return safeError(error);
  }
}

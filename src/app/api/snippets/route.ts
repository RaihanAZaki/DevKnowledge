import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-logs";

const snippetSchema = z.object({
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

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";
    const language = request.nextUrl.searchParams.get("language")?.trim() ?? "";
    const category = request.nextUrl.searchParams.get("category")?.trim() ?? "";

    const snippets = await prisma.codeSnippet.findMany({
      where: {
        ...(language ? { language } : {}),
        ...(CATEGORY_OPTIONS.includes(category as never) ? { category: category as (typeof CATEGORY_OPTIONS)[number] } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { ticketNo: { contains: search, mode: "insensitive" } },
                { reason: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ snippets });
  } catch (error) {
    return safeError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const parsed = snippetSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid snippet data.", 422, parsed.error.flatten());

    const snippet =
    await prisma.codeSnippet.create({
      data: {
        ...parsed.data,
        description:
          parsed.data.description || null,
        impact:
          parsed.data.impact || null,
        framework:
          parsed.data.framework || null,
        authorId: user.id,
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
      action: "CREATE",
      entity: "SNIPPET",
      entityId: snippet.id,
      description: `Created code snippet "${snippet.title}".`,
    });

    return NextResponse.json(
      {
        snippet,
      },
      {
        status: 201,
      }
    );
    } catch (error) {
      return safeError(error);
    }
}

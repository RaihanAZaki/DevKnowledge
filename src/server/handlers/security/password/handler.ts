import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { changePasswordSchema } from "@/server/security/security.schema";
import { changePassword } from "@/server/security/security.service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);

    const parsed = changePasswordSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid password data.", 422, parsed.error.flatten());

    await changePassword({
      userId: user.id,
      sessionId: user.sessionId,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });

    return NextResponse.json({ ok: true, message: "Password updated successfully." });
  } catch (error) {
    return safeError(error);
  }
}

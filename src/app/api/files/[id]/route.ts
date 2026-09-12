import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth";
import { deleteOwnedFile } from "@/server/files/file.service";

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const user = await getServerSession();

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

  const { id } = await context.params;

  try {
    await deleteOwnedFile(
      id,
      user.id,
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE FILE ERROR:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete file.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status:
          message === "File not found."
            ? 404
            : 500,
      },
    );
  }
}
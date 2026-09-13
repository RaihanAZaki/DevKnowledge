import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth";
import { deleteOwnedFile } from "@/server/files/file.service";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
  context: Context,
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

  try {
    const { id } = await context.params;

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

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete file.",
      },
      {
        status: 400,
      },
    );
  }
}
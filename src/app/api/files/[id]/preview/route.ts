import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth";
import { previewOwnedFile } from "@/server/files/file.service";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
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

    const { file, blob } =
      await previewOwnedFile(
        id,
        user.id,
      );

    return new Response(blob.stream, {
      headers: {
        "Content-Type":
          file.contentType,

        "Content-Disposition":
          `inline; filename="${encodeURIComponent(
            file.originalName,
          )}"`,

        "Cache-Control":
          "private, no-store",

        "X-Content-Type-Options":
          "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "PREVIEW FILE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to preview file.",
      },
      {
        status: 400,
      },
    );
  }
}
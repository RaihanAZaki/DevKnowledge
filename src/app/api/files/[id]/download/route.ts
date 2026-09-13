import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth";
import { downloadOwnedFile } from "@/server/files/file.service";

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
    const { id } =
      await context.params;

    const {
      file,
      blob,
    } =
      await downloadOwnedFile(
        id,
        user.id,
      );

    return new Response(
      blob.stream,
      {
        status: 200,

        headers: {
          "Content-Type":
            file.contentType ||
            "application/octet-stream",

          "Content-Disposition":
            `attachment; filename*=UTF-8''${encodeURIComponent(
              file.originalName,
            )}`,

          "Content-Length":
            String(file.size),

          "Cache-Control":
            "private, no-store",

          "X-Content-Type-Options":
            "nosniff",
        },
      },
    );
  } catch (error) {
    console.error(
      "DOWNLOAD FILE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to download file.",
      },
      {
        status: 400,
      },
    );
  }
}
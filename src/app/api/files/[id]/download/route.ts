import {
  getServerSession,
} from "@/lib/auth";

import {
  downloadOwnedFile,
} from "@/server/files/file.service";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const user =
    await getServerSession();

  if (!user) {
    return new Response(
      "Unauthorized",
      {
        status: 401,
      },
    );
  }

  const { id } =
    await context.params;

  try {
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
        headers: {
          "Content-Type":
            file.contentType,

          "Content-Disposition":
            `attachment; filename="${encodeURIComponent(
              file.originalName,
            )}"`,

          "Cache-Control":
            "private, no-store",
        },
      },
    );
  } catch {
    return new Response(
      "File not found",
      {
        status: 404,
      },
    );
  }
}
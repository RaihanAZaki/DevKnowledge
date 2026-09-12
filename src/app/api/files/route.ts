import {
  NextResponse,
} from "next/server";

import {
  getServerSession,
} from "@/lib/auth";

import {
  listUserFiles,
  uploadUserFile,
} from "@/server/files/file.service";

export async function GET() {
  const user =
    await getServerSession();

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

  const files =
    await listUserFiles(
      user.id,
    );

  return NextResponse.json({
    files,
  });
}

export async function POST(
  request: Request,
) {
  const user =
    await getServerSession();

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
    const formData =
      await request.formData();

    const uploaded =
      formData.get("file");

    if (
      !uploaded ||
      !(uploaded instanceof File)
    ) {
      return NextResponse.json(
        {
          error:
            "ZIP file is required.",
        },
        {
          status: 400,
        },
      );
    }

    const file =
      await uploadUserFile({
        userId: user.id,
        file: uploaded,
      });

    return NextResponse.json(
      {
        file,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Upload failed.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 400,
      },
    );
  }
}
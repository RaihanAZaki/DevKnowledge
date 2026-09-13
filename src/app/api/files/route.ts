import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth";
import {
  listUserFiles,
  uploadUserFile,
} from "@/server/files/file.service";

export async function GET() {
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
    const files = await listUserFiles(
      user.id,
    );

    return NextResponse.json({
      files,
    });
  } catch (error) {
    console.error(
      "LIST FILES ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load files.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function POST(
  request: Request,
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
    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            "File is required.",
        },
        {
          status: 400,
        },
      );
    }

    const storedFile =
      await uploadUserFile({
        userId: user.id,
        file,
      });

    return NextResponse.json(
      {
        success: true,
        file: storedFile,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "UPLOAD FILE ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload file.",
      },
      {
        status: 400,
      },
    );
  }
}
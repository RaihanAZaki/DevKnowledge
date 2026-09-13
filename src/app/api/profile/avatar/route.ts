import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth";
import {
  removeProfileAvatar,
  updateProfileAvatar,
} from "@/server/profile/profile.service";

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
            "Profile photo is required.",
        },
        {
          status: 400,
        },
      );
    }

    const profile =
      await updateProfileAvatar({
        userId: user.id,
        file,
      });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error(
      "UPDATE PROFILE AVATAR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update profile photo.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function DELETE() {
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
    const profile =
      await removeProfileAvatar(
        user.id,
      );

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error(
      "REMOVE PROFILE AVATAR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to remove profile photo.",
      },
      {
        status: 400,
      },
    );
  }
}
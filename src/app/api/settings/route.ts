import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth";
import {
  getUserSettings,
  updateUserSettings,
} from "@/server/settings/settings.service";

/*
|--------------------------------------------------------------------------
| GET /api/settings
|--------------------------------------------------------------------------
*/

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
    const settings =
      await getUserSettings(
        user.id,
      );

    return NextResponse.json({
      settings,
    });
  } catch (error) {
    console.error(
      "GET SETTINGS ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load settings.",
      },
      {
        status: 400,
      },
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUT /api/settings
|--------------------------------------------------------------------------
*/

export async function PUT(
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
    const body =
      await request.json();

    const preferences =
      await updateUserSettings({
        userId: user.id,
        data: body,
      });

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error(
      "UPDATE SETTINGS ERROR:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update settings.",
      },
      {
        status: 400,
      },
    );
  }
}
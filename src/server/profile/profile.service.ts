import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";

const commonProfileSelect = {
  id: true,
  name: true,
  role: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,

  _count: {
    select: {
      snippets: true,
      documents: true,
      threads: true,
    },
  },

  snippets: {
    select: {
      id: true,
      title: true,
      language: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc" as const,
    },
    take: 5,
  },

  threads: {
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc" as const,
    },
    take: 5,
  },
};

export async function getOwnProfile(
  userId: string,
) {
  const profile =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        ...commonProfileSelect,

        email: true,

        documents: {
          select: {
            id: true,
            title: true,
            language: true,
            updatedAt: true,
          },

          orderBy: {
            updatedAt: "desc",
          },

          take: 5,
        },
      },
    });

  if (!profile) {
    throw new AppError(
      "User not found.",
      404,
    );
  }

  return profile;
}

export async function getPublicProfile(
  id: string,
  currentUserId: string,
) {
  const profile =
    await prisma.user.findUnique({
      where: {
        id,
      },

      select: {
        ...commonProfileSelect,

        documents: {
          where: {
            isPublished: true,
          },

          select: {
            id: true,
            title: true,
            language: true,
            updatedAt: true,
          },

          orderBy: {
            updatedAt: "desc",
          },

          take: 5,
        },
      },
    });

  if (!profile) {
    throw new AppError(
      "User not found.",
      404,
    );
  }

  const friendship =
    currentUserId === id
      ? null
      : await prisma.friendship.findFirst({
          where: {
            OR: [
              {
                requesterId:
                  currentUserId,
                addresseeId: id,
              },
              {
                requesterId: id,
                addresseeId:
                  currentUserId,
              },
            ],
          },
        });

  let status:
    | "SELF"
    | "NONE"
    | "PENDING_SENT"
    | "PENDING_RECEIVED"
    | "FRIENDS" = "NONE";

  if (currentUserId === id) {
    status = "SELF";
  } else if (
    friendship?.status ===
    "ACCEPTED"
  ) {
    status = "FRIENDS";
  } else if (
    friendship?.status ===
    "PENDING"
  ) {
    status =
      friendship.requesterId ===
      currentUserId
        ? "PENDING_SENT"
        : "PENDING_RECEIVED";
  }

  return {
    profile,

    friendship: friendship
      ? {
          id: friendship.id,
          status,
        }
      : {
          id: null,
          status,
        },
  };
}

/*
|--------------------------------------------------------------------------
| Update profile
|--------------------------------------------------------------------------
*/

export async function updateOwnProfile({
  userId,
  name,
  bio,
}: {
  userId: string;
  name: string;
  bio?: string | null;
}) {
  const normalizedName =
    name.trim();

  if (
    normalizedName.length < 2
  ) {
    throw new AppError(
      "Name must contain at least 2 characters.",
      400,
    );
  }

  const normalizedBio =
    bio?.trim() || null;

  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      name:
        normalizedName,

      bio:
        normalizedBio,
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
}

/*
|--------------------------------------------------------------------------
| Update profile avatar
|--------------------------------------------------------------------------
*/

export async function updateProfileAvatar({
  userId,
  file,
}: {
  userId: string;
  file: File;
}) {
  /*
  |--------------------------------------------------------------------------
  | Content type
  |--------------------------------------------------------------------------
  */

  const allowedTypes =
    new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

  if (
    !allowedTypes.has(
      file.type,
    )
  ) {
    throw new AppError(
      "Only JPG, PNG, and WEBP images are allowed.",
      400,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Empty file
  |--------------------------------------------------------------------------
  */

  if (file.size === 0) {
    throw new AppError(
      "Image file is empty.",
      400,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Maximum size
  |--------------------------------------------------------------------------
  |
  | Base64 akan lebih besar sekitar 33% dari file asli,
  | jadi jangan simpan image terlalu besar ke database.
  |
  */

  const maxSize =
    1024 * 1024;

  if (
    file.size > maxSize
  ) {
    throw new AppError(
      "Maximum profile photo size is 1 MB.",
      400,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Detect actual file signature
  |--------------------------------------------------------------------------
  */

  const signature =
    new Uint8Array(
      await file
        .slice(0, 16)
        .arrayBuffer(),
    );

  let detectedType:
    | "image/jpeg"
    | "image/png"
    | "image/webp"
    | null = null;

  /*
  |--------------------------------------------------------------------------
  | JPEG
  |--------------------------------------------------------------------------
  |
  | FF D8 FF
  |
  */

  if (
    signature.length >= 3 &&
    signature[0] === 0xff &&
    signature[1] === 0xd8 &&
    signature[2] === 0xff
  ) {
    detectedType =
      "image/jpeg";
  }

  /*
  |--------------------------------------------------------------------------
  | PNG
  |--------------------------------------------------------------------------
  |
  | 89 50 4E 47 0D 0A 1A 0A
  |
  */

  if (
    signature.length >= 8 &&
    signature[0] === 0x89 &&
    signature[1] === 0x50 &&
    signature[2] === 0x4e &&
    signature[3] === 0x47 &&
    signature[4] === 0x0d &&
    signature[5] === 0x0a &&
    signature[6] === 0x1a &&
    signature[7] === 0x0a
  ) {
    detectedType =
      "image/png";
  }

  /*
  |--------------------------------------------------------------------------
  | WEBP
  |--------------------------------------------------------------------------
  |
  | RIFF....WEBP
  |
  */

  if (
    signature.length >=
      12 &&
    signature[0] === 0x52 &&
    signature[1] === 0x49 &&
    signature[2] === 0x46 &&
    signature[3] === 0x46 &&
    signature[8] === 0x57 &&
    signature[9] === 0x45 &&
    signature[10] === 0x42 &&
    signature[11] === 0x50
  ) {
    detectedType =
      "image/webp";
  }

  if (!detectedType) {
    throw new AppError(
      "Invalid image file.",
      400,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Browser MIME must match actual content
  |--------------------------------------------------------------------------
  */

  if (
    detectedType !== file.type
  ) {
    throw new AppError(
      "Image content does not match its file type.",
      400,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Convert to Base64 Data URL
  |--------------------------------------------------------------------------
  */

  const arrayBuffer =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(
      arrayBuffer,
    );

  const base64 =
    buffer.toString(
      "base64",
    );

  const dataUrl =
    `data:${detectedType};base64,${base64}`;

  /*
  |--------------------------------------------------------------------------
  | Save
  |--------------------------------------------------------------------------
  */

  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      avatarUrl:
        dataUrl,
    },

    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  });
}

/*
|--------------------------------------------------------------------------
| Remove profile avatar
|--------------------------------------------------------------------------
*/

export async function removeProfileAvatar(
  userId: string,
) {
  return prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      avatarUrl: null,
    },

    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  });
}
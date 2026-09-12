import {
  del,
  get,
  put,
} from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";

export async function listUserFiles(
  userId: string,
) {
  return prisma.storedFile.findMany({
    where: {
      userId,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function uploadUserFile({
  userId,
  file,
}: {
  userId: string;
  file: File;
}) {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new AppError(
      "Only ZIP files are allowed.",
      400,
    );
  }

  const maxSize =
    50 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new AppError(
      "Maximum ZIP size is 50 MB.",
      400,
    );
  }

  const safeName =
    file.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-");

  const pathname =
    `users/${userId}/${crypto.randomUUID()}-${safeName}`;

  const blob = await put(
    pathname,
    file,
    {
      access: "private",
      addRandomSuffix: false,
    },
  );

  return prisma.storedFile.create({
    data: {
      name:
        file.name.replace(
          /\.zip$/i,
          "",
        ),

      originalName:
        file.name,

      pathname:
        blob.pathname,

      contentType:
        file.type ||
        "application/zip",

      size:
        file.size,

      userId,
    },
  });
}

export async function findOwnedFile(
  id: string,
  userId: string,
) {
  const file =
    await prisma.storedFile.findFirst({
      where: {
        id,
        userId,
      },
    });

  if (!file) {
    throw new AppError(
      "File not found.",
      404,
    );
  }

  return file;
}

export async function downloadOwnedFile(
  id: string,
  userId: string,
) {
  const file =
    await findOwnedFile(
      id,
      userId,
    );

  const blob = await get(
    file.pathname,
    {
      access: "private",
    },
  );

  if (!blob) {
    throw new AppError(
      "Stored file could not be found.",
      404,
    );
  }

  return {
    file,
    blob,
  };
}

export async function deleteOwnedFile(
  id: string,
  userId: string,
) {
  const file =
    await findOwnedFile(
      id,
      userId,
    );

  await del(file.pathname);

  await prisma.storedFile.delete({
    where: {
      id: file.id,
    },
  });
}
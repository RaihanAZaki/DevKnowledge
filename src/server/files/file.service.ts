import {
  del,
  get,
  put,
} from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";

type SupportedFileType =
  | "zip"
  | "pdf"
  | "jpg"
  | "png";

type DetectedFile = {
  type: SupportedFileType;
  contentType: string;
  extension: string;
};

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const MAX_ZIP_SIZE =
  50 * 1024 * 1024;

const MAX_DOCUMENT_SIZE =
  20 * 1024 * 1024;

const SUPPORTED_EXTENSIONS =
  new Set([
    ".zip",
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
  ]);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getExtension(
  filename: string,
) {
  const index =
    filename.lastIndexOf(".");

  if (index === -1) {
    return "";
  }

  return filename
    .slice(index)
    .toLowerCase();
}

function removeExtension(
  filename: string,
) {
  const index =
    filename.lastIndexOf(".");

  if (index === -1) {
    return filename;
  }

  return filename.slice(0, index);
}

function sanitizeFilename(
  filename: string,
) {
  return filename
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "-",
    )
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/*
|--------------------------------------------------------------------------
| Signature detection
|--------------------------------------------------------------------------
|
| Jangan hanya percaya:
|
| file.name
| file.type
|
| Karena:
|
| virus.exe -> virus.pdf
|
| masih bisa punya extension PDF.
|
*/

function detectFileType(
  bytes: Uint8Array,
): DetectedFile | null {
  /*
  |--------------------------------------------------------------------------
  | PDF
  |--------------------------------------------------------------------------
  |
  | %PDF
  |
  | 25 50 44 46
  |
  */

  if (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return {
      type: "pdf",
      contentType:
        "application/pdf",
      extension: ".pdf",
    };
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
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return {
      type: "png",
      contentType: "image/png",
      extension: ".png",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | JPEG
  |--------------------------------------------------------------------------
  |
  | FF D8 FF
  |
  */

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return {
      type: "jpg",
      contentType:
        "image/jpeg",
      extension: ".jpg",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | ZIP
  |--------------------------------------------------------------------------
  |
  | PK 03 04
  | PK 05 06
  | PK 07 08
  |
  */

  if (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (
      (
        bytes[2] === 0x03 &&
        bytes[3] === 0x04
      ) ||
      (
        bytes[2] === 0x05 &&
        bytes[3] === 0x06
      ) ||
      (
        bytes[2] === 0x07 &&
        bytes[3] === 0x08
      )
    )
  ) {
    return {
      type: "zip",
      contentType:
        "application/zip",
      extension: ".zip",
    };
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| List
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Upload
|--------------------------------------------------------------------------
*/

export async function uploadUserFile({
  userId,
  file,
}: {
  userId: string;
  file: File;
}) {
  /*
  |--------------------------------------------------------------------------
  | Filename
  |--------------------------------------------------------------------------
  */

  const extension =
    getExtension(file.name);

  if (
    !SUPPORTED_EXTENSIONS.has(
      extension,
    )
  ) {
    throw new AppError(
      "Only ZIP, PDF, JPG, JPEG, and PNG files are allowed.",
      400,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Basic size
  |--------------------------------------------------------------------------
  */

  if (file.size === 0) {
    throw new AppError(
      "File is empty.",
      400,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Read signature
  |--------------------------------------------------------------------------
  |
  | 16 byte sudah cukup untuk tipe yang kita support.
  |
  */

  const signature =
    new Uint8Array(
      await file
        .slice(0, 16)
        .arrayBuffer(),
    );

  const detected =
    detectFileType(signature);

  if (!detected) {
    throw new AppError(
      "Unsupported or invalid file.",
      400,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Extension must match actual content
  |--------------------------------------------------------------------------
  */

  const validExtension =
    detected.type === "jpg"
      ? extension === ".jpg" ||
        extension === ".jpeg"
      : extension ===
        detected.extension;

  if (!validExtension) {
    throw new AppError(
      `File extension does not match the actual ${detected.type.toUpperCase()} file type.`,
      400,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Size
  |--------------------------------------------------------------------------
  */

  if (
    detected.type === "zip" &&
    file.size > MAX_ZIP_SIZE
  ) {
    throw new AppError(
      "Maximum ZIP size is 50 MB.",
      400,
    );
  }

  if (
    detected.type !== "zip" &&
    file.size >
      MAX_DOCUMENT_SIZE
  ) {
    throw new AppError(
      "Maximum PDF or image size is 20 MB.",
      400,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Content-Type
  |--------------------------------------------------------------------------
  |
  | Kita pakai hasil deteksi signature,
  | bukan file.type dari browser.
  |
  */

  const contentType =
    detected.contentType;

  /*
  |--------------------------------------------------------------------------
  | Filename
  |--------------------------------------------------------------------------
  */

  const safeName =
    sanitizeFilename(
      file.name,
    );

  if (!safeName) {
    throw new AppError(
      "Invalid filename.",
      400,
    );
  }

  const pathname =
    `users/${userId}/${crypto.randomUUID()}-${safeName}`;

  /*
  |--------------------------------------------------------------------------
  | Upload to private Vercel Blob
  |--------------------------------------------------------------------------
  */

  const blob = await put(
    pathname,
    file,
    {
      access: "private",
      addRandomSuffix: false,

      /*
      | Simpan MIME yang benar ke Blob.
      */

      contentType,
    },
  );

  /*
  |--------------------------------------------------------------------------
  | Database
  |--------------------------------------------------------------------------
  */

  return prisma.storedFile.create({
  data: {
    name: removeExtension(file.name),
    originalName: file.name,
    pathname: blob.pathname,

    contentType,
    mimeType: contentType,
    extension: detected.extension,

    size: file.size,
    userId,
  },
});}

/*
|--------------------------------------------------------------------------
| Find owned file
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Download
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Preview
|--------------------------------------------------------------------------
*/

export async function previewOwnedFile(
  id: string,
  userId: string,
) {
  const file =
    await findOwnedFile(
      id,
      userId,
    );

  /*
  |--------------------------------------------------------------------------
  | Only preview safe browser formats
  |--------------------------------------------------------------------------
  */

  const previewable =
    file.contentType ===
      "application/pdf" ||
    file.contentType ===
      "image/jpeg" ||
    file.contentType ===
      "image/png";

  if (!previewable) {
    throw new AppError(
      "This file type cannot be previewed.",
      400,
    );
  }

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

/*
|--------------------------------------------------------------------------
| Delete
|--------------------------------------------------------------------------
*/

export async function deleteOwnedFile(
  id: string,
  userId: string,
) {
  const file =
    await findOwnedFile(
      id,
      userId,
    );

  await del(
    file.pathname,
  );

  await prisma.storedFile.delete({
    where: {
      id: file.id,
    },
  });

  return {
    success: true,
  };
}

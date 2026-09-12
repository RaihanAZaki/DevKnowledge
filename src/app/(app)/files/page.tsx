import {
  redirect,
} from "next/navigation";

import {
  getServerSession,
} from "@/lib/auth";

import {
  listUserFiles,
} from "@/server/files/file.service";

import FilesClient from "./files-client";

export default async function FilesPage() {
  const user =
    await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const files =
    await listUserFiles(
      user.id,
    );

  const initialFiles =
    files.map(
      (file) => ({
        ...file,

        createdAt:
          file.createdAt.toISOString(),

        updatedAt:
          file.updatedAt.toISOString(),
      }),
    );

  return (
    <FilesClient
      initialFiles={
        initialFiles
      }
    />
  );
}
import {
  notFound,
  redirect,
} from "next/navigation";

import { getServerSession } from "@/lib/auth";
import { getPublicProfile } from "@/server/profile/profile.service";
import { serializeForClient } from "@/server/shared/serialize";
import { AppError } from "@/server/shared/app-error";

import UserProfileClient from "./user-profile-client";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const user =
    await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const { id } =
    await params;

  /*
   * Kalau membuka profile sendiri melalui /profile/[id],
   * arahkan ke /profile karena halaman itu yang editable.
   */
  if (id === user.id) {
    redirect("/profile");
  }

  try {
    const data =
      await getPublicProfile(
        id,
        user.id,
      );

    return (
      <UserProfileClient
        initialData={
          serializeForClient(
            data,
          )
        }
      />
    );
  } catch (error) {
    if (
      error instanceof AppError &&
      error.status === 404
    ) {
      notFound();
    }

    throw error;
  }
}
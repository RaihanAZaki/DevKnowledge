import { redirect } from "next/navigation";

import ProfileClient from "./profile-client";

import {
  getServerSession,
} from "@/lib/auth";

import {
  prisma,
} from "@/lib/prisma";

import {
  getReputationCardData,
} from "@/server/reputation/reputation.service";

export default async function ProfilePage() {
  const user =
    await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const [
    profile,
    reputation,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: user.id,
      },

      select: {
        id: true,
        name: true,
        email: true,
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
            updatedAt: "desc",
          },

          take: 8,
        },

        documents: {
          select: {
            id: true,
            title: true,
            updatedAt: true,
          },

          orderBy: {
            updatedAt: "desc",
          },

          take: 8,
        },

        threads: {
          select: {
            id: true,
            title: true,
            updatedAt: true,
          },

          orderBy: {
            updatedAt: "desc",
          },

          take: 8,
        },
      },
    }),

    getReputationCardData(
      user.id
    ),
  ]);

  if (!profile) {
    redirect("/login");
  }

  const serializedProfile = {
    ...profile,

    createdAt:
      profile.createdAt.toISOString(),

    snippets:
      profile.snippets.map(
        (item) => ({
          ...item,

          updatedAt:
            item.updatedAt.toISOString(),
        })
      ),

    documents:
      profile.documents.map(
        (item) => ({
          ...item,

          updatedAt:
            item.updatedAt.toISOString(),
        })
      ),

    threads:
      profile.threads.map(
        (item) => ({
          ...item,

          updatedAt:
            item.updatedAt.toISOString(),
        })
      ),
  };

  return (
    <ProfileClient
      initialProfile={
        serializedProfile
      }
      initialReputation={
        reputation
      }
    />
  );
}
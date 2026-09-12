import type { SessionUser } from "@/lib/auth";

export function documentAccess(
  document: {
    authorId: string;
    visibility: "PUBLIC" | "PRIVATE";
    isPublished: boolean;
    sharedWith?: Array<{ userId: string }>;
  },
  user: Pick<SessionUser, "id" | "role">,
) {
  const isOwner = document.authorId === user.id;
  const isPublic = document.visibility === "PUBLIC" && document.isPublished;
  const isShared = document.sharedWith?.some((share) => share.userId === user.id) ?? false;

  return {
    isOwner,
    isPublic,
    isShared,
    canView: isOwner || isPublic || isShared,
    canManage: isOwner || user.role === "ADMIN" || user.role === "MODERATOR",
  };
}

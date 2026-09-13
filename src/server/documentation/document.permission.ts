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

  const canModeratePublic =
    document.visibility === "PUBLIC" &&
    (user.role === "ADMIN" || user.role === "MODERATOR");

  return {
    isOwner,
    isPublic,
    isShared,
    canView: isOwner || isPublic || isShared,
    // Private documents stay owner-managed even for workspace moderators.
    // Admin/moderator moderation applies only to public documentation.
    canManage: isOwner || canModeratePublic,
  };
}

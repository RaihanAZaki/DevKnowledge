export function withDocumentAccess<T extends {
  authorId: string;
  visibility: "PUBLIC" | "PRIVATE";
  isPublished: boolean;
  sharedWith: Array<{ userId: string }>;
}>(document: T, userId: string) {
  return {
    ...document,
    access: {
      isOwner: document.authorId === userId,
      isShared: document.sharedWith.some((share) => share.userId === userId),
      isPublic: document.visibility === "PUBLIC" && document.isPublished,
    },
  };
}

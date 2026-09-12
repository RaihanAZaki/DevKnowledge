/*
  Warnings:

  - A unique constraint covering the columns `[userId,targetId,type]` on the table `Bookmark` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AuditLog_entity_idx";

-- DropIndex
DROP INDEX "ForumComment_threadId_idx";

-- DropIndex
DROP INDEX "ForumThread_category_idx";

-- DropIndex
DROP INDEX "Friendship_addresseeId_idx";

-- DropIndex
DROP INDEX "Friendship_status_idx";

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_targetId_type_key" ON "Bookmark"("userId", "targetId", "type");

-- CreateIndex
CREATE INDEX "CodeSnippet_createdAt_idx" ON "CodeSnippet"("createdAt");

-- CreateIndex
CREATE INDEX "Documentation_isPublished_visibility_createdAt_idx" ON "Documentation"("isPublished", "visibility", "createdAt");

-- CreateIndex
CREATE INDEX "ForumComment_threadId_createdAt_idx" ON "ForumComment"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumThread_category_createdAt_idx" ON "ForumThread"("category", "createdAt");

-- CreateIndex
CREATE INDEX "Friendship_status_addresseeId_idx" ON "Friendship"("status", "addresseeId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "ReputationHistory_userId_createdAt_idx" ON "ReputationHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SnippetVersion_snippetId_idx" ON "SnippetVersion"("snippetId");

-- CreateIndex
CREATE INDEX "UserReputation_userId_createdAt_idx" ON "UserReputation"("userId", "createdAt");

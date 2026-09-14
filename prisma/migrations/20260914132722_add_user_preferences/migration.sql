-- CreateEnum
CREATE TYPE "AppTheme" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" "AppTheme" NOT NULL DEFAULT 'SYSTEM',
    "compactMode" BOOLEAN NOT NULL DEFAULT false,
    "notifyFriendRequests" BOOLEAN NOT NULL DEFAULT true,
    "notifyMentions" BOOLEAN NOT NULL DEFAULT true,
    "notifyGroupMessages" BOOLEAN NOT NULL DEFAULT true,
    "notifyForumReplies" BOOLEAN NOT NULL DEFAULT true,
    "notifyAcceptedAnswers" BOOLEAN NOT NULL DEFAULT true,
    "notifyReputation" BOOLEAN NOT NULL DEFAULT true,
    "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
    "readReceipts" BOOLEAN NOT NULL DEFAULT true,
    "messageSounds" BOOLEAN NOT NULL DEFAULT false,
    "desktopNotifications" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

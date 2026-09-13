-- AlterTable
ALTER TABLE "ChatGroupMessage" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'MESSAGE',
ADD COLUMN     "knowledgeId" TEXT,
ADD COLUMN     "knowledgeTitle" TEXT,
ADD COLUMN     "knowledgeType" TEXT;

-- AlterTable
ALTER TABLE "DirectMessage" ADD COLUMN     "knowledgeId" TEXT,
ADD COLUMN     "knowledgeTitle" TEXT,
ADD COLUMN     "knowledgeType" TEXT;

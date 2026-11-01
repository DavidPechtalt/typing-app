-- CreateEnum
CREATE TYPE "TextSource" AS ENUM ('BUILTIN', 'UPLOAD', 'WIKIPEDIA');

-- AlterTable
ALTER TABLE "Text" ADD COLUMN     "source" "TextSource" NOT NULL DEFAULT 'BUILTIN',
ADD COLUMN     "sourceUrl" TEXT;

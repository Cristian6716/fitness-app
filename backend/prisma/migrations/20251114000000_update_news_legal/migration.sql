-- AlterTable
ALTER TABLE "news_articles" DROP COLUMN "content";

-- AlterTable
ALTER TABLE "news_articles" ALTER COLUMN "source_url" SET NOT NULL;

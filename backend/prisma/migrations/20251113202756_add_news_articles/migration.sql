-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "source" TEXT NOT NULL,
    "source_url" TEXT,
    "image_url" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT[],
    "sponsored" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "news_articles_category_idx" ON "news_articles"("category");

-- CreateIndex
CREATE INDEX "news_articles_published_at_idx" ON "news_articles"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_source_url_key" ON "news_articles"("source_url");

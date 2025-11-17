import express from 'express';
import { PrismaClient } from '@prisma/client';
import { fetchAndSaveArticles } from '../services/rssParser';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/news
 * Fetch paginated list of news articles
 * Query params: limit, offset, category
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const category = req.query.category as string | undefined;

    // Build where clause
    const where = category ? { category } : {};

    // Fetch articles
    const [articles, total] = await Promise.all([
      prisma.newsArticle.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.newsArticle.count({ where }),
    ]);

    res.json({
      articles,
      total,
    });
  } catch (error) {
    console.error('Error fetching news articles:', error);
    res.status(500).json({
      error: 'Failed to fetch news articles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/news/:id
 * Fetch single news article by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const article = await prisma.newsArticle.findUnique({
      where: { id },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    console.error('Error fetching news article:', error);
    res.status(500).json({
      error: 'Failed to fetch news article',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/news/fetch
 * Manually trigger RSS feed fetch
 */
router.post('/fetch', async (req, res) => {
  try {
    console.log('Manual RSS fetch triggered');
    const result = await fetchAndSaveArticles();

    res.json({
      success: true,
      added: result.added,
      skipped: result.skipped,
    });
  } catch (error) {
    console.error('Error fetching RSS feeds:', error);
    res.status(500).json({
      error: 'Failed to fetch RSS feeds',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

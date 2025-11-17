import Parser from 'rss-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const parser = new Parser({
  customFields: {
    item: [['media:content', 'media:content', { keepArray: true }]],
  },
});

interface RSSFeed {
  url: string;
  source: string;
}

// Italian fitness RSS feeds
const RSS_FEEDS: RSSFeed[] = [
  { url: 'https://nbfi.it/feed', source: 'NBFI Italia' },
  { url: 'https://blog.anytimefitness.it/feed', source: 'Anytime Fitness Italia' },
  { url: 'https://www.projectinvictus.it/feed/', source: 'Project Invictus' },
  { url: 'https://www.bodybuilding.it/feed/', source: 'Bodybuilding Italia' },
];

// Italian keywords for categorization
const CATEGORY_KEYWORDS = {
  training: [
    'allenamento',
    'workout',
    'esercizi',
    'forza',
    'muscoli',
    'palestra',
    'bodybuilding',
    'scheda',
    'training',
    'peso',
    'squat',
    'panca',
    'stacco',
  ],
  nutrition: [
    'nutrizione',
    'dieta',
    'alimentazione',
    'proteine',
    'carboidrati',
    'cibo',
    'pasto',
    'calorie',
    'ricetta',
    'integratori',
    'vitamine',
  ],
  wellness: [
    'salute',
    'benessere',
    'recupero',
    'sonno',
    'stress',
    'riposo',
    'mentale',
    'meditation',
    'yoga',
    'stretching',
  ],
};

/**
 * Categorize article based on Italian keywords in title and description
 */
function categorizeArticle(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();

  // Count keyword matches for each category
  const scores = {
    training: 0,
    nutrition: 0,
    wellness: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[category as keyof typeof scores]++;
      }
    }
  }

  // Return category with highest score, or 'general' if no matches
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'general';

  return Object.entries(scores).find(([, score]) => score === maxScore)?.[0] || 'general';
}

/**
 * Truncate text to max length and add ellipsis
 */
function truncateSummary(text: string, maxLength: number = 150): string {
  if (!text) return '';

  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ');

  // Trim whitespace
  cleaned = cleaned.trim();

  // Truncate if needed
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return cleaned.substring(0, maxLength).trim() + '...';
}

/**
 * Extract image URL from RSS item
 */
function extractImageUrl(item: any): string | null {
  // Try media:content
  if (item['media:content'] && item['media:content'].length > 0) {
    const media = item['media:content'][0];
    if (media.$ && media.$.url) {
      return media.$.url;
    }
  }

  // Try enclosure
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }

  // Try content:encoded for images
  if (item['content:encoded']) {
    const imgMatch = item['content:encoded'].match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) {
      return imgMatch[1];
    }
  }

  // Try description for images
  if (item.contentSnippet || item.description) {
    const content = item.contentSnippet || item.description;
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) {
      return imgMatch[1];
    }
  }

  return null;
}

/**
 * Fetch and save articles from all RSS feeds
 * LEGAL COMPLIANCE: Only stores title, short summary, and link - no full content
 */
export async function fetchAndSaveArticles(): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;

  console.log(`[RSS] Starting fetch from ${RSS_FEEDS.length} feeds...`);

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`[RSS] Fetching from ${feed.source}...`);
      const feedData = await parser.parseURL(feed.url);

      for (const item of feedData.items) {
        // Skip items without required fields
        if (!item.title || !item.link) {
          skipped++;
          continue;
        }

        // Check if article already exists by sourceUrl
        const existing = await prisma.newsArticle.findUnique({
          where: { sourceUrl: item.link },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Extract and prepare data
        const description = (item as any).contentSnippet || (item as any).description || '';
        const category = categorizeArticle(item.title, description);
        const summary = truncateSummary(description, 150);
        const imageUrl = extractImageUrl(item);
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

        // Save article (only title, summary, and link - no full content)
        await prisma.newsArticle.create({
          data: {
            title: item.title,
            summary,
            source: feed.source,
            sourceUrl: item.link,
            imageUrl,
            category,
            tags: [],
            sponsored: false,
            publishedAt,
          },
        });

        added++;
        console.log(`[RSS] Added: ${item.title}`);
      }
    } catch (error) {
      console.error(`[RSS] Error fetching from ${feed.source}:`, error);
    }
  }

  console.log(`[RSS] Fetch complete. Added: ${added}, Skipped: ${skipped}`);
  return { added, skipped };
}

import { GeneratedContent, ContentFilter, SearchResult, BulkOperation, ContentType } from '../types/types';

export class ContentManagementService {
  // Get all unique categories from content library
  static getAllCategories(content: GeneratedContent[]): string[] {
    const categories = new Set<string>();
    content.forEach(item => {
      if (item.categories) {
        item.categories.forEach(cat => categories.add(cat));
      }
    });
    return Array.from(categories).sort();
  }

  // Get all unique tags from content library
  static getAllTags(content: GeneratedContent[]): string[] {
    const tags = new Set<string>();
    content.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }

  // Get all unique authors from content library
  static getAllAuthors(content: GeneratedContent[]): string[] {
    const authors = new Set<string>();
    content.forEach(item => {
      if (item.author) {
        authors.add(item.author);
      }
    });
    return Array.from(authors).sort();
  }

  // Search content based on query
  static searchContent(content: GeneratedContent[], query: string): SearchResult[] {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    content.forEach(item => {
      let score = 0;
      let matchedFields: string[] = [];

      // Title match (highest weight)
      if (item.title.toLowerCase().includes(lowerQuery)) {
        score += 10;
        matchedFields.push('title');
      }

      // Content match (medium weight)
      if (item.content.toLowerCase().includes(lowerQuery)) {
        score += 5;
        matchedFields.push('content');
      }

      // Excerpt match (medium weight)
      if (item.excerpt && item.excerpt.toLowerCase().includes(lowerQuery)) {
        score += 3;
        matchedFields.push('excerpt');
      }

      // Categories match (low weight)
      if (item.categories && item.categories.some(cat => cat.toLowerCase().includes(lowerQuery))) {
        score += 2;
        matchedFields.push('categories');
      }

      // Tags match (low weight)
      if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        score += 2;
        matchedFields.push('tags');
      }

      // Author match (low weight)
      if (item.author && item.author.toLowerCase().includes(lowerQuery)) {
        score += 1;
        matchedFields.push('author');
      }

      if (score > 0) {
        results.push({
          content: item,
          score,
          matchedFields
        });
      }
    });

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  // Filter content based on filter criteria
  static filterContent(content: GeneratedContent[], filter: ContentFilter): GeneratedContent[] {
    return content.filter(item => {
      // Status filter
      if (filter.status && filter.status.length > 0) {
        if (!filter.status.includes(item.status)) {
          return false;
        }
      }

      // Type filter
      if (filter.type && filter.type.length > 0) {
        if (!filter.type.includes(item.type)) {
          return false;
        }
      }

      // Site filter
      if (filter.siteId && item.siteId !== filter.siteId) {
        return false;
      }

      // Categories filter
      if (filter.categories && filter.categories.length > 0) {
        if (!item.categories || !filter.categories.some(cat => item.categories!.includes(cat))) {
          return false;
        }
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        if (!item.tags || !filter.tags.some(tag => item.tags!.includes(tag))) {
          return false;
        }
      }

      // Author filter
      if (filter.author && item.author !== filter.author) {
        return false;
      }

      // Date range filter
      if (filter.dateFrom && item.createdAt < filter.dateFrom) {
        return false;
      }
      if (filter.dateTo && item.createdAt > filter.dateTo) {
        return false;
      }

      return true;
    });
  }

  // Execute bulk operations
  static executeBulkOperation(content: GeneratedContent[], operation: BulkOperation): GeneratedContent[] {
    return content.map(item => {
      if (operation.contentIds.includes(item.id)) {
        switch (operation.type) {
          case 'publish':
            return { ...item, status: 'published', publishedAt: new Date() };
          case 'unpublish':
            return { ...item, status: 'draft', publishedAt: undefined };
          case 'delete':
            return { ...item, status: 'deleted', deletedAt: new Date() };
          case 'archive':
            return { ...item, status: 'archived', archivedAt: new Date() };
          case 'restore':
            return { ...item, status: 'draft', deletedAt: undefined, archivedAt: undefined };
          default:
            return item;
        }
      }
      return item;
    });
  }

  // Add categories to content
  static addCategories(content: GeneratedContent, categories: string[]): GeneratedContent {
    const existingCategories = content.categories || [];
    const newCategories = [...new Set([...existingCategories, ...categories])];
    return { ...content, categories: newCategories };
  }

  // Add tags to content
  static addTags(content: GeneratedContent, tags: string[]): GeneratedContent {
    const existingTags = content.tags || [];
    const newTags = [...new Set([...existingTags, ...tags])];
    return { ...content, tags: newTags };
  }

  // Remove categories from content
  static removeCategories(content: GeneratedContent, categories: string[]): GeneratedContent {
    const existingCategories = content.categories || [];
    const newCategories = existingCategories.filter(cat => !categories.includes(cat));
    return { ...content, categories: newCategories };
  }

  // Remove tags from content
  static removeTags(content: GeneratedContent, tags: string[]): GeneratedContent {
    const existingTags = content.tags || [];
    const newTags = existingTags.filter(tag => !tags.includes(tag));
    return { ...content, tags: newTags };
  }

  // Get content statistics
  static getContentStats(content: GeneratedContent[]) {
    const stats = {
      total: content.length,
      published: 0,
      draft: 0,
      scheduled: 0,
      archived: 0,
      deleted: 0,
      byType: {} as Record<ContentType, number>,
      bySite: {} as Record<string, number>,
      byAuthor: {} as Record<string, number>,
      totalViews: 0,
      averageWordCount: 0
    };

    content.forEach(item => {
      // Count by status
      stats[item.status]++;

      // Count by type
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;

      // Count by site
      if (item.siteId) {
        stats.bySite[item.siteId] = (stats.bySite[item.siteId] || 0) + 1;
      }

      // Count by author
      if (item.author) {
        stats.byAuthor[item.author] = (stats.byAuthor[item.author] || 0) + 1;
      }

      // Sum views and word count
      stats.totalViews += item.views || 0;
      stats.averageWordCount += item.wordCount || 0;
    });

    // Calculate average word count
    stats.averageWordCount = content.length > 0 ? Math.round(stats.averageWordCount / content.length) : 0;

    return stats;
  }

  // Get content performance metrics
  static getPerformanceMetrics(content: GeneratedContent[]) {
    const metrics = {
      topViewed: content
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10),
      recentContent: content
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
      engagement: {
        averageViews: content.reduce((sum, item) => sum + (item.views || 0), 0) / content.length || 0,
        totalEngagement: content.reduce((sum, item) => sum + (item.engagement || 0), 0),
        mostEngaged: content
          .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
          .slice(0, 5)
      }
    };

    return metrics;
  }
}
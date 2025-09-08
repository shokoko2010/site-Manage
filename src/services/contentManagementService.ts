import { GeneratedContent, ContentVersion, ContentFilter, SearchResult, BulkOperation, ExternalLink, ArticleContent, ProductContent, ContentType } from '../types/types';

export class ContentManagementService {
  // Content categorization and tagging
  static addCategories(content: GeneratedContent, categories: string[]): GeneratedContent {
    const existingCategories = content.categories || [];
    const newCategories = [...new Set([...existingCategories, ...categories])];
    
    return {
      ...content,
      categories: newCategories,
      lastModified: new Date(),
      version: (content.version || 1) + 1
    };
  }

  static removeCategories(content: GeneratedContent, categories: string[]): GeneratedContent {
    const existingCategories = content.categories || [];
    const updatedCategories = existingCategories.filter(cat => !categories.includes(cat));
    
    return {
      ...content,
      categories: updatedCategories,
      lastModified: new Date(),
      version: (content.version || 1) + 1
    };
  }

  static addTags(content: GeneratedContent, tags: string[]): GeneratedContent {
    const existingTags = content.tags || [];
    const newTags = [...new Set([...existingTags, ...tags])];
    
    return {
      ...content,
      tags: newTags,
      lastModified: new Date(),
      version: (content.version || 1) + 1
    };
  }

  static removeTags(content: GeneratedContent, tags: string[]): GeneratedContent {
    const existingTags = content.tags || [];
    const updatedTags = existingTags.filter(tag => !tags.includes(tag));
    
    return {
      ...content,
      tags: updatedTags,
      lastModified: new Date(),
      version: (content.version || 1) + 1
    };
  }

  // Advanced search and filtering
  static searchContent(contentList: GeneratedContent[], query: string): SearchResult[] {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return contentList
      .map(content => {
        let score = 0;
        const matchedFields: string[] = [];
        const highlights: { field: string; text: string; position: number }[] = [];

        // Search in title
        const titleLower = content.title.toLowerCase();
        searchTerms.forEach(term => {
          if (titleLower.includes(term)) {
            score += 10; // Title matches are weighted higher
            if (!matchedFields.includes('title')) matchedFields.push('title');
            
            const index = titleLower.indexOf(term);
            highlights.push({
              field: 'title',
              text: content.title.substring(Math.max(0, index - 20), index + term.length + 20),
              position: index
            });
          }
        });

        // Search in body
        const bodyLower = content.body.toLowerCase();
        searchTerms.forEach(term => {
          if (bodyLower.includes(term)) {
            score += 5; // Body matches are weighted lower
            if (!matchedFields.includes('body')) matchedFields.push('body');
            
            const index = bodyLower.indexOf(term);
            highlights.push({
              field: 'body',
              text: content.body.substring(Math.max(0, index - 30), index + term.length + 30),
              position: index
            });
          }
        });

        // Search in meta description
        if (content.metaDescription) {
          const metaLower = content.metaDescription.toLowerCase();
          searchTerms.forEach(term => {
            if (metaLower.includes(term)) {
              score += 3;
              if (!matchedFields.includes('metaDescription')) matchedFields.push('metaDescription');
            }
          });
        }

        // Search in tags
        if (content.tags) {
          content.tags.forEach(tag => {
            const tagLower = tag.toLowerCase();
            searchTerms.forEach(term => {
              if (tagLower.includes(term)) {
                score += 2;
                if (!matchedFields.includes('tags')) matchedFields.push('tags');
              }
            });
          });
        }

        // Search in categories
        if (content.categories) {
          content.categories.forEach(category => {
            const categoryLower = category.toLowerCase();
            searchTerms.forEach(term => {
              if (categoryLower.includes(term)) {
                score += 2;
                if (!matchedFields.includes('categories')) matchedFields.push('categories');
              }
            });
          });
        }

        return {
          content,
          score,
          matchedFields,
          highlights
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  static filterContent(contentList: GeneratedContent[], filter: ContentFilter): GeneratedContent[] {
    return contentList.filter(content => {
      // Status filter
      if (filter.status && filter.status.length > 0) {
        if (content.scheduledFor && !filter.status.includes('scheduled')) return false;
        if (!content.scheduledFor && !filter.status.includes(content.status)) return false;
      }

      // Type filter
      if (filter.type && filter.type.length > 0) {
        if (!filter.type.includes(content.type)) return false;
      }

      // Categories filter
      if (filter.categories && filter.categories.length > 0) {
        if (!content.categories || !filter.categories.some(cat => content.categories?.includes(cat))) {
          return false;
        }
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        if (!content.tags || !filter.tags.some(tag => content.tags?.includes(tag))) {
          return false;
        }
      }

      // Author filter
      if (filter.author && content.author !== filter.author) {
        return false;
      }

      // Priority filter
      if (filter.priority && filter.priority.length > 0) {
        if (!content.priority || !filter.priority.includes(content.priority)) {
          return false;
        }
      }

      // Date range filter
      if (filter.dateRange) {
        const contentDate = new Date(content.createdAt);
        if (contentDate < filter.dateRange.start || contentDate > filter.dateRange.end) {
          return false;
        }
      }

      // Site filter
      if (filter.siteId && content.siteId !== filter.siteId) {
        return false;
      }

      // Search query filter
      if (filter.searchQuery) {
        const searchResults = this.searchContent([content], filter.searchQuery);
        if (searchResults.length === 0) return false;
      }

      // Word count filter
      if (filter.wordCount) {
        const wordCount = this.calculateWordCount(content);
        if (wordCount < filter.wordCount.min || wordCount > filter.wordCount.max) {
          return false;
        }
      }

      // SEO score filter
      if (filter.seoScore) {
        const seoScore = content.seoScore || 0;
        if (seoScore < filter.seoScore.min || seoScore > filter.seoScore.max) {
          return false;
        }
      }

      return true;
    });
  }

  // Content versioning and history tracking
  static createVersion(content: GeneratedContent, changeLog?: string): ContentVersion {
    return {
      id: `${content.id}_v${(content.version || 1) + 1}`,
      version: (content.version || 1) + 1,
      title: content.title,
      body: content.body,
      metaDescription: content.metaDescription,
      createdAt: new Date(),
      author: content.author || 'Unknown',
      changeLog
    };
  }

  static restoreVersion(content: GeneratedContent, version: ContentVersion): GeneratedContent {
    return {
      ...content,
      title: version.title,
      body: version.body,
      metaDescription: version.metaDescription,
      version: version.version,
      lastModified: new Date()
    };
  }

  // Bulk operations
  static executeBulkOperation(contentList: GeneratedContent[], operation: BulkOperation): GeneratedContent[] {
    const updatedContent = contentList.map(content => {
      if (!operation.contentIds.includes(content.id)) return content;

      switch (operation.type) {
        case 'delete':
          return content; // Will be filtered out later

        case 'publish':
          return {
            ...content,
            status: 'published',
            lastModified: new Date(),
            version: (content.version || 1) + 1
          };

        case 'unpublish':
          return {
            ...content,
            status: 'draft',
            lastModified: new Date(),
            version: (content.version || 1) + 1
          };

        case 'categorize':
          return this.addCategories(content, operation.data.categories || []);

        case 'tag':
          return this.addTags(content, operation.data.tags || []);

        case 'schedule':
          return {
            ...content,
            scheduledFor: operation.data.scheduledFor,
            lastModified: new Date(),
            version: (content.version || 1) + 1
          };

        case 'change_priority':
          return {
            ...content,
            priority: operation.data.priority,
            lastModified: new Date(),
            version: (content.version || 1) + 1
          };

        default:
          return content;
      }
    });

    // Remove deleted items
    if (operation.type === 'delete') {
      return updatedContent.filter(content => !operation.contentIds.includes(content.id));
    }

    return updatedContent;
  }

  // Utility methods
  static calculateWordCount(content: GeneratedContent): number {
    const text = `${content.title} ${content.metaDescription || ''} ${content.body}`;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  static calculateSeoScore(content: GeneratedContent): number {
    let score = 0;
    
    // Title length (optimal: 50-60 characters)
    if (content.title.length >= 50 && content.title.length <= 60) score += 20;
    else if (content.title.length >= 30 && content.title.length <= 70) score += 10;

    // Meta description length (optimal: 150-160 characters)
    if (content.metaDescription && content.metaDescription.length >= 150 && content.metaDescription.length <= 160) score += 20;
    else if (content.metaDescription && content.metaDescription.length >= 120 && content.metaDescription.length <= 180) score += 10;

    // Content length (optimal: 1000+ words)
    const wordCount = this.calculateWordCount(content);
    if (wordCount >= 1000) score += 20;
    else if (wordCount >= 500) score += 10;

    // Keywords in title
    if (content.categories && content.categories.length > 0) {
      const hasCategoryInTitle = content.categories.some(cat => 
        content.title.toLowerCase().includes(cat.toLowerCase())
      );
      if (hasCategoryInTitle) score += 15;
    }

    // Tags presence
    if (content.tags && content.tags.length > 0) score += 10;

    // Internal links
    if (content.internalLinkSuggestions && content.internalLinkSuggestions.length > 0) score += 15;

    return Math.min(score, 100); // Cap at 100
  }

  static extractExternalLinks(content: GeneratedContent): ExternalLink[] {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const matches = content.body.match(urlRegex);
    
    if (!matches) return [];

    return matches.map(url => ({
      url,
      title: '',
      anchorText: this.extractAnchorText(content.body, url),
      isFollow: true,
      lastChecked: new Date(),
      isBroken: false
    }));
  }

  private static extractAnchorText(html: string, url: string): string {
    const linkRegex = new RegExp(`<a[^>]*href="${url}"[^>]*>([^<]*)</a>`, 'i');
    const match = html.match(linkRegex);
    return match ? match[1] : url;
  }

  static getAllCategories(contentList: GeneratedContent[]): string[] {
    const allCategories = contentList.flatMap(content => content.categories || []);
    return [...new Set(allCategories)].sort();
  }

  static getAllTags(contentList: GeneratedContent[]): string[] {
    const allTags = contentList.flatMap(content => content.tags || []);
    return [...new Set(allTags)].sort();
  }

  static getAllAuthors(contentList: GeneratedContent[]): string[] {
    const allAuthors = contentList.flatMap(content => content.author ? [content.author] : []);
    return [...new Set(allAuthors)].sort();
  }
}
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

// WordPress Sync Service
class WordPressSyncService {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.username = username;
    this.password = password;
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    const url = `${this.baseUrl}/wp-json/wp/v2${endpoint}`;
    const authString = Buffer.from(`${this.username}:${this.password}`).toString('base64');

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async syncPosts(siteId: string) {
    try {
      // Fetch posts from WordPress
      const posts = await this.makeRequest('/posts?per_page=100');
      
      const syncResults = {
        total: posts.length,
        created: 0,
        updated: 0,
        errors: 0,
        details: [] as any[]
      };

      for (const post of posts) {
        try {
          // Check if content already exists
          const existingContent = await db.generatedContent.findFirst({
            where: {
              siteId: siteId,
              OR: [
                { postId: post.id },
                { slug: post.slug }
              ]
            }
          });

          const contentData = {
            title: post.title.rendered.replace(/<[^>]*>/g, ''),
            body: post.content.rendered,
            metaDescription: post.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
            slug: post.slug,
            status: post.status.toUpperCase() as any,
            type: 'ARTICLE' as any,
            language: 'ENGLISH' as any,
            origin: 'SYNCED' as any,
            postId: post.id,
            postLink: post.link,
            publishedAt: post.date ? new Date(post.date) : null,
            featuredImage: post.featured_media ? `${this.baseUrl}/wp-json/wp/v2/media/${post.featured_media}` : null
          };

          if (existingContent) {
            // Update existing content
            await db.generatedContent.update({
              where: { id: existingContent.id },
              data: contentData
            });
            syncResults.updated++;
            syncResults.details.push({
              action: 'updated',
              title: post.title.rendered,
              id: existingContent.id
            });
          } else {
            // Create new content
            await db.generatedContent.create({
              data: {
                ...contentData,
                userId: post.author || 'system', // This should be the actual user ID
                siteId: siteId
              }
            });
            syncResults.created++;
            syncResults.details.push({
              action: 'created',
              title: post.title.rendered,
              id: post.id
            });
          }
        } catch (error) {
          syncResults.errors++;
          syncResults.details.push({
            action: 'error',
            title: post.title.rendered,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Update site's last synced time
      await db.wordPressSite.update({
        where: { id: siteId },
        data: { lastSyncedAt: new Date() }
      });

      return {
        success: true,
        ...syncResults
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync posts'
      };
    }
  }

  async syncPages(siteId: string) {
    try {
      // Fetch pages from WordPress
      const pages = await this.makeRequest('/pages?per_page=100');
      
      const syncResults = {
        total: pages.length,
        created: 0,
        updated: 0,
        errors: 0,
        details: [] as any[]
      };

      for (const page of pages) {
        try {
          // Check if content already exists
          const existingContent = await db.generatedContent.findFirst({
            where: {
              siteId: siteId,
              OR: [
                { postId: page.id },
                { slug: page.slug }
              ]
            }
          });

          const contentData = {
            title: page.title.rendered.replace(/<[^>]*>/g, ''),
            body: page.content.rendered,
            metaDescription: page.excerpt?.rendered?.replace(/<[^>]*>/g, '') || '',
            slug: page.slug,
            status: page.status.toUpperCase() as any,
            type: 'ARTICLE' as any,
            language: 'ENGLISH' as any,
            origin: 'SYNCED' as any,
            postId: page.id,
            postLink: page.link,
            publishedAt: page.date ? new Date(page.date) : null,
            featuredImage: page.featured_media ? `${this.baseUrl}/wp-json/wp/v2/media/${page.featured_media}` : null
          };

          if (existingContent) {
            // Update existing content
            await db.generatedContent.update({
              where: { id: existingContent.id },
              data: contentData
            });
            syncResults.updated++;
            syncResults.details.push({
              action: 'updated',
              title: page.title.rendered,
              id: existingContent.id
            });
          } else {
            // Create new content
            await db.generatedContent.create({
              data: {
                ...contentData,
                userId: page.author || 'system', // This should be the actual user ID
                siteId: siteId
              }
            });
            syncResults.created++;
            syncResults.details.push({
              action: 'created',
              title: page.title.rendered,
              id: page.id
            });
          }
        } catch (error) {
          syncResults.errors++;
          syncResults.details.push({
            action: 'error',
            title: page.title.rendered,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return {
        success: true,
        ...syncResults
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync pages'
      };
    }
  }

  async getSiteStats() {
    try {
      const [posts, pages, categories, tags] = await Promise.all([
        this.makeRequest('/posts?per_page=1'),
        this.makeRequest('/pages?per_page=1'),
        this.makeRequest('/categories?per_page=1'),
        this.makeRequest('/tags?per_page=1')
      ]);

      // Get total counts from headers
      const getTotalFromHeaders = (response: any) => {
        return parseInt(response.headers?.get('X-WP-Total') || '0');
      };

      return {
        success: true,
        stats: {
          posts: getTotalFromHeaders(posts),
          pages: getTotalFromHeaders(pages),
          categories: getTotalFromHeaders(categories),
          tags: getTotalFromHeaders(tags)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get site stats'
      };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;

    const { action, siteId } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Fetch site from database
    const site = await db.wordPressSite.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    if (!site.username || !site.appPassword) {
      return NextResponse.json(
        { error: 'Site credentials not configured' },
        { status: 400 }
      );
    }

    const syncService = new WordPressSyncService(site.url, site.username, site.appPassword);

    switch (action) {
      case 'sync_posts':
        const syncResult = await syncService.syncPosts(siteId);
        return NextResponse.json(syncResult);

      case 'sync_pages':
        const pageSyncResult = await syncService.syncPages(siteId);
        return NextResponse.json(pageSyncResult);

      case 'get_stats':
        const statsResult = await syncService.getSiteStats();
        return NextResponse.json(statsResult);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('WordPress sync error:', error);
    return NextResponse.json(
      { 
        error: 'WordPress sync error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
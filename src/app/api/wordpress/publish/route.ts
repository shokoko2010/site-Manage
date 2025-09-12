import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

// WordPress REST API service (simplified for publishing)
class WordPressPublisher {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.username = username;
    this.password = password;
  }

  private async makeApiRequest(endpoint: string, options: any = {}) {
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
      console.error('WordPress API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: url
      });
      throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async publishPost(postData: {
    title: string;
    content: string;
    excerpt?: string;
    status?: 'draft' | 'publish' | 'pending';
    categories?: number[];
    tags?: number[];
    featuredMedia?: number;
  }) {
    const data: any = {
      title: postData.title,
      content: postData.content,
      excerpt: postData.excerpt || '',
      status: postData.status || 'draft'
    };

    if (postData.categories && postData.categories.length > 0) {
      data.categories = postData.categories;
    }

    if (postData.tags && postData.tags.length > 0) {
      data.tags = postData.tags;
    }

    if (postData.featuredMedia) {
      data.featured_media = postData.featuredMedia;
    }

    try {
      const post = await this.makeApiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      return {
        success: true,
        postId: post.id,
        postUrl: post.link,
        status: post.status,
        message: 'Post published successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish post'
      };
    }
  }

  async updatePost(postId: number, postData: {
    title?: string;
    content?: string;
    excerpt?: string;
    status?: 'draft' | 'publish' | 'pending';
  }) {
    const data: any = {};

    if (postData.title) data.title = postData.title;
    if (postData.content) data.content = postData.content;
    if (postData.excerpt) data.excerpt = postData.excerpt;
    if (postData.status) data.status = postData.status;

    try {
      const post = await this.makeApiRequest(`/posts/${postId}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      return {
        success: true,
        postId: post.id,
        postUrl: post.link,
        status: post.status,
        message: 'Post updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update post'
      };
    }
  }

  async getCategories() {
    try {
      const categories = await this.makeApiRequest('/categories?per_page=100');
      return {
        success: true,
        categories: categories.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          count: cat.count
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories'
      };
    }
  }

  async getTags() {
    try {
      const tags = await this.makeApiRequest('/tags?per_page=100');
      return {
        success: true,
        tags: tags.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          count: tag.count
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tags'
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

    const { action, contentId, siteId, postData } = await request.json();

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

    // Fetch the site from database
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

    const publisher = new WordPressPublisher(site.url, site.username, site.appPassword);

    switch (action) {
      case 'publish':
        if (!postData) {
          return NextResponse.json(
            { error: 'Post data is required for publishing' },
            { status: 400 }
          );
        }

        const publishResult = await publisher.publishPost(postData);
        
        if (publishResult.success && contentId) {
          // Update the content in your database with the WordPress post ID
          // This would be done via your Prisma client
          console.log(`Content ${contentId} published to WordPress as post ${publishResult.postId}`);
        }

        return NextResponse.json(publishResult);

      case 'update':
        if (!postData || !postData.postId) {
          return NextResponse.json(
            { error: 'Post ID and data are required for updating' },
            { status: 400 }
          );
        }

        const updateResult = await publisher.updatePost(postData.postId, postData);
        return NextResponse.json(updateResult);

      case 'get_categories':
        const categoriesResult = await publisher.getCategories();
        return NextResponse.json(categoriesResult);

      case 'get_tags':
        const tagsResult = await publisher.getTags();
        return NextResponse.json(tagsResult);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('WordPress publishing error:', error);
    return NextResponse.json(
      { 
        error: 'WordPress publishing error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

// WordPress REST API service
class WordPressService {
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

  async testConnection() {
    try {
      const users = await this.makeRequest('/users');
      return { success: true, message: 'Connection successful', users: users.length };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  async getPosts() {
    return this.makeRequest('/posts?per_page=100');
  }

  async getPages() {
    return this.makeRequest('/pages?per_page=100');
  }

  async createPost(postData: any) {
    const data = {
      title: postData.title,
      content: postData.content,
      excerpt: postData.excerpt || '',
      status: postData.status || 'draft',
      categories: postData.categories || [],
      tags: postData.tags || [],
      featured_media: postData.featured_media || 0
    };

    return this.makeRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updatePost(postId: number, postData: any) {
    const data = {
      title: postData.title,
      content: postData.content,
      excerpt: postData.excerpt || '',
      status: postData.status || 'draft'
    };

    return this.makeRequest(`/posts/${postId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getCategories() {
    return this.makeRequest('/categories?per_page=100');
  }

  async getTags() {
    return this.makeRequest('/tags?per_page=100');
  }

  async uploadImage(imageData: Buffer, filename: string) {
    const formData = new FormData();
    formData.append('file', new Blob([imageData]), filename);

    const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`,
        'Content-Disposition': `attachment; filename="${filename}"`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.status}`);
    }

    return response.json();
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

    const { action, siteId, postData } = await request.json();

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    // Get site credentials from database
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

    const wpService = new WordPressService(site.url, site.username, site.appPassword);

    switch (action) {
      case 'test':
        const testResult = await wpService.testConnection();
        return NextResponse.json(testResult);

      case 'create_post':
        if (!postData) {
          return NextResponse.json(
            { error: 'Post data is required' },
            { status: 400 }
          );
        }
        const post = await wpService.createPost(postData);
        return NextResponse.json({
          success: true,
          message: 'Post created successfully',
          post
        });

      case 'get_posts':
        const posts = await wpService.getPosts();
        return NextResponse.json({
          success: true,
          posts
        });

      case 'get_categories':
        const categories = await wpService.getCategories();
        return NextResponse.json({
          success: true,
          categories
        });

      case 'get_tags':
        const tags = await wpService.getTags();
        return NextResponse.json({
          success: true,
          tags
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('WordPress API error:', error);
    return NextResponse.json(
      { 
        error: 'WordPress API error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
import axios from 'axios';

export interface WordPressPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  modified: string;
  slug: string;
  status: string;
  link: string;
  author: number;
  featured_media?: number;
  categories?: number[];
  tags?: number[];
  performance_stats?: {
    views: number;
    comments: number;
    shares: number;
  };
}

export interface WordPressSite {
  id: string;
  url: string;
  name: string;
  username?: string;
  appPassword?: string;
  isVirtual: boolean;
  isActive: boolean;
  lastSyncedAt?: Date;
}

class WordPressService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(siteId: string, endpoint: string): string {
    return `${siteId}:${endpoint}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private async makeWordPressRequest(
    site: WordPressSite,
    endpoint: string,
    params: any = {}
  ): Promise<any> {
    if (site.isVirtual) {
      throw new Error('Cannot make WordPress requests to virtual sites');
    }

    const cacheKey = this.getCacheKey(site.id, endpoint);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${site.url}/wp-json/wp/v2/${endpoint}`;
      
      const auth = site.username && site.appPassword 
        ? {
            username: site.username,
            password: site.appPassword
          }
        : null;

      const response = await axios.get(url, {
        params: {
          per_page: 100,
          ...params
        },
        auth,
        timeout: 30000,
        headers: {
          'User-Agent': 'Zex-Content/1.0'
        }
      });

      this.setCache(cacheKey, response.data);
      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`WordPress API error: ${message}`);
      }
      throw error;
    }
  }

  async getPosts(site: WordPressSite, params: any = {}): Promise<WordPressPost[]> {
    try {
      const posts = await this.makeWordPressRequest(site, 'posts', {
        status: 'publish',
        _embed: true,
        ...params
      });

      return posts.map((post: any) => ({
        id: post.id,
        title: post.title.rendered.replace(/<[^>]*>/g, ''),
        content: post.content.rendered,
        excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, ''),
        date: post.date,
        modified: post.modified,
        slug: post.slug,
        status: post.status,
        link: post.link,
        author: post.author,
        featured_media: post.featured_media,
        categories: post.categories,
        tags: post.tags,
        performance_stats: {
          views: Math.floor(Math.random() * 10000), // Mock data for demo
          comments: Math.floor(Math.random() * 100),
          shares: Math.floor(Math.random() * 50)
        }
      }));
    } catch (error) {
      console.error(`Error fetching posts from ${site.name}:`, error);
      return [];
    }
  }

  async getPost(site: WordPressSite, postId: number): Promise<WordPressPost | null> {
    try {
      const post = await this.makeWordPressRequest(site, `posts/${postId}`, {
        _embed: true
      });

      return {
        id: post.id,
        title: post.title.rendered.replace(/<[^>]*>/g, ''),
        content: post.content.rendered,
        excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, ''),
        date: post.date,
        modified: post.modified,
        slug: post.slug,
        status: post.status,
        link: post.link,
        author: post.author,
        featured_media: post.featured_media,
        categories: post.categories,
        tags: post.tags
      };
    } catch (error) {
      console.error(`Error fetching post ${postId} from ${site.name}:`, error);
      return null;
    }
  }

  async createPost(
    site: WordPressSite,
    postData: {
      title: string;
      content: string;
      excerpt?: string;
      status?: 'draft' | 'publish' | 'pending';
      categories?: number[];
      tags?: number[];
      featured_media?: number;
    }
  ): Promise<WordPressPost> {
    if (site.isVirtual) {
      throw new Error('Cannot create posts on virtual sites');
    }

    try {
      const response = await axios.post(
        `${site.url}/wp-json/wp/v2/posts`,
        {
          title: postData.title,
          content: postData.content,
          excerpt: postData.excerpt || '',
          status: postData.status || 'draft',
          categories: postData.categories || [],
          tags: postData.tags || [],
          featured_media: postData.featured_media
        },
        {
          auth: site.username && site.appPassword 
            ? {
                username: site.username,
                password: site.appPassword
              }
            : undefined,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Zex-Content/1.0'
          }
        }
      );

      return {
        id: response.data.id,
        title: response.data.title.rendered.replace(/<[^>]*>/g, ''),
        content: response.data.content.rendered,
        excerpt: response.data.excerpt.rendered.replace(/<[^>]*>/g, ''),
        date: response.data.date,
        modified: response.data.modified,
        slug: response.data.slug,
        status: response.data.status,
        link: response.data.link,
        author: response.data.author,
        featured_media: response.data.featured_media,
        categories: response.data.categories,
        tags: response.data.tags
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to create post: ${message}`);
      }
      throw error;
    }
  }

  async updatePost(
    site: WordPressSite,
    postId: number,
    postData: {
      title?: string;
      content?: string;
      excerpt?: string;
      status?: 'draft' | 'publish' | 'pending';
      categories?: number[];
      tags?: number[];
      featured_media?: number;
    }
  ): Promise<WordPressPost> {
    if (site.isVirtual) {
      throw new Error('Cannot update posts on virtual sites');
    }

    try {
      const response = await axios.put(
        `${site.url}/wp-json/wp/v2/posts/${postId}`,
        postData,
        {
          auth: site.username && site.appPassword 
            ? {
                username: site.username,
                password: site.appPassword
              }
            : undefined,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Zex-Content/1.0'
          }
        }
      );

      return {
        id: response.data.id,
        title: response.data.title.rendered.replace(/<[^>]*>/g, ''),
        content: response.data.content.rendered,
        excerpt: response.data.excerpt.rendered.replace(/<[^>]*>/g, ''),
        date: response.data.date,
        modified: response.data.modified,
        slug: response.data.slug,
        status: response.data.status,
        link: response.data.link,
        author: response.data.author,
        featured_media: response.data.featured_media,
        categories: response.data.categories,
        tags: response.data.tags
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to update post: ${message}`);
      }
      throw error;
    }
  }

  async getCategories(site: WordPressSite): Promise<any[]> {
    try {
      return await this.makeWordPressRequest(site, 'categories', {
        per_page: 100
      });
    } catch (error) {
      console.error(`Error fetching categories from ${site.name}:`, error);
      return [];
    }
  }

  async getTags(site: WordPressSite): Promise<any[]> {
    try {
      return await this.makeWordPressRequest(site, 'tags', {
        per_page: 100
      });
    } catch (error) {
      console.error(`Error fetching tags from ${site.name}:`, error);
      return [];
    }
  }

  async testConnection(site: WordPressSite): Promise<boolean> {
    try {
      if (site.isVirtual) {
        return true; // Virtual sites always "connect"
      }

      await this.makeWordPressRequest(site, 'posts', {
        per_page: 1
      });
      return true;
    } catch (error) {
      console.error(`Connection test failed for ${site.name}:`, error);
      return false;
    }
  }

  async getSiteInfo(site: WordPressSite): Promise<any> {
    try {
      const response = await axios.get(`${site.url}/wp-json/`, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching site info for ${site.name}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const wordpressService = new WordPressService();

// Export convenience functions
export const fetchAllPostsFromAllSites = async (sites: WordPressSite[]): Promise<WordPressPost[]> => {
  const allPosts: WordPressPost[] = [];

  for (const site of sites) {
    try {
      const posts = await wordpressService.getPosts(site);
      allPosts.push(...posts);
    } catch (error) {
      console.error(`Failed to fetch posts from ${site.name}:`, error);
    }
  }

  return allPosts;
};

export default WordPressService;
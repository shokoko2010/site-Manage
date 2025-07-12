import { marked } from 'marked';
import { WordPressSite, GeneratedContent, PublishingOptions, SiteContext, ContentType, ArticleContent, ProductContent, SitePost } from '../types';

const SITES_STORAGE_KEY = 'ai-wp-manager-sites';

// --- Local Storage Management ---
/**
 * NOTE: Storing credentials in Local Storage is not secure for a production application.
 * This is done for demonstration purposes within a frontend-only context.
 * A real-world application should use a backend server to store credentials securely (e.g., encrypted in a database)
 * and proxy requests to the WordPress sites.
 */
export const getSitesFromStorage = (): WordPressSite[] => {
    try {
        const storedSites = localStorage.getItem(SITES_STORAGE_KEY);
        return storedSites ? JSON.parse(storedSites) : [];
    } catch (error) {
        console.error('Failed to parse sites from Local Storage:', error);
        return [];
    }
};

export const saveSitesToStorage = (sites: WordPressSite[]): void => {
    try {
        localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(sites));
    } catch (error) {
        console.error('Failed to save sites to Local Storage:', error);
    }
};


// --- API Helper ---
const createAuthHeaders = (username: string, appPassword: string): Headers => {
    const headers = new Headers();
    headers.append('Authorization', 'Basic ' + btoa(`${username}:${appPassword}`));
    return headers;
};

const apiFetch = async (url: string, options: RequestInit) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            // Try to parse the error response from WordPress
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = errorData.message || response.statusText || 'An unknown error occurred.';

            // Provide more helpful messages for common statuses
            if (response.status === 401 || response.status === 403) {
                 errorMessage = `Authentication failed. Please check your credentials and user permissions on the WordPress site. Ensure the connection snippet from Settings is active. (Status: ${response.status})`;
            } else if (response.status === 404) {
                 errorMessage = `Not found. Please check if the site URL is correct and the REST API is enabled. (Status: ${response.status})`;
            }
            
            throw new Error(errorMessage);
        }
        return response;
    } catch (error) {
        // Handle network errors (like CORS, DNS, etc.) that prevent the request from completing
        if (error instanceof TypeError) {
            throw new Error(`Network error or CORS issue. Please check your internet connection, the site URL, and ensure the connection snippet from Settings is active on your WordPress site.`);
        }
        // Re-throw errors from the try block (like the ones we created for bad statuses) or other unexpected errors
        throw error;
    }
};

const getTotalCount = (response: Response): number => {
    const total = response.headers.get('X-WP-Total');
    return total ? parseInt(total, 10) : 0;
};


// --- Core API Functions ---

export const addSite = async (url: string, username: string, appPassword: string): Promise<WordPressSite> => {
    const cleanedUrl = new URL(url).origin; // Normalize URL
    const headers = createAuthHeaders(username, appPassword);
    
    // Check for duplicates in storage first
    const existingSites = getSitesFromStorage();
    if (existingSites.some(s => s.id === cleanedUrl)) {
        throw new Error("This site already exists.");
    }

    // 1. Validate credentials and get site name
    const infoResponse = await apiFetch(`${cleanedUrl}/wp-json/`, { headers });
    const info = await infoResponse.json();
    const siteName = info.name;
    if (!siteName) {
        throw new Error("Could not retrieve site name. Check URL and credentials.");
    }

    // 2. Get stats in parallel
    const [postsRes, pagesRes, productsRes] = await Promise.allSettled([
        apiFetch(`${cleanedUrl}/wp-json/wp/v2/posts?per_page=1`, { headers }),
        apiFetch(`${cleanedUrl}/wp-json/wp/v2/pages?per_page=1`, { headers }),
        apiFetch(`${cleanedUrl}/wp-json/wc/v3/products?per_page=1`, { headers: createAuthHeaders(username, appPassword) }) // WooCommerce might need its own auth context
    ]);

    const newSite: WordPressSite = {
        id: cleanedUrl,
        url: cleanedUrl,
        name: siteName,
        isVirtual: false,
        username,
        appPassword,
        stats: {
            posts: postsRes.status === 'fulfilled' ? getTotalCount(postsRes.value) : 0,
            pages: pagesRes.status === 'fulfilled' ? getTotalCount(pagesRes.value) : 0,
            products: productsRes.status === 'fulfilled' ? getTotalCount(productsRes.value) : 0,
        },
    };
    
    // Add to local storage
    saveSitesToStorage([...existingSites, newSite]);

    return newSite;
};

export const getSiteContext = async (site: WordPressSite): Promise<SiteContext> => {
    if (!site.username || !site.appPassword) {
        throw new Error("Cannot get site context without credentials.");
    }
    const headers = createAuthHeaders(site.username, site.appPassword);
    const [postsRes, categoriesRes] = await Promise.all([
        apiFetch(`${site.url}/wp-json/wp/v2/posts?per_page=20&_fields=id,title,link`, { headers }),
        apiFetch(`${site.url}/wp-json/wp/v2/categories?per_page=20&_fields=name`, { headers }),
    ]);

    const recentPosts = await postsRes.json();
    const categories = await categoriesRes.json();

    return { recentPosts, categories };
};


export const fetchAllPosts = async (site: WordPressSite): Promise<SitePost[]> => {
    if (site.isVirtual || !site.username || !site.appPassword) {
        return [];
    }
    const headers = createAuthHeaders(site.username, site.appPassword);
    let allPosts: SitePost[] = [];
    let page = 1;
    let totalPages = 1;

    do {
        const response = await apiFetch(`${site.url}/wp-json/wp/v2/posts?per_page=20&page=${page}&_fields=id,title,content,status,date,link,performance_stats`, { headers });
        const posts = await response.json();
        allPosts = allPosts.concat(posts);
        totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
        page++;
    } while (page <= totalPages);

    return allPosts;
};


// --- Publishing Logic ---

// Helper to convert base64 to Blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

const uploadMedia = async (site: WordPressSite, base64Data: string, title: string): Promise<number> => {
    if (!site.username || !site.appPassword) {
        throw new Error("Cannot upload media without credentials.");
    }
    // For FormData, let the browser set the Content-Type header.
    const headers = createAuthHeaders(site.username, site.appPassword);
    
    const blob = base64ToBlob(base64Data, 'image/jpeg');
    const formData = new FormData();
    formData.append('file', blob, `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`);
    formData.append('title', title);
    formData.append('alt_text', title);

    const response = await apiFetch(`${site.url}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: headers,
        body: formData,
    });
    
    const mediaDetails = await response.json();
    if (!mediaDetails.id) {
        throw new Error("Media upload succeeded but did not return an ID.");
    }
    return mediaDetails.id;
}


const getTermIds = async (site: WordPressSite, terms: string, endpoint: 'categories' | 'tags'): Promise<number[]> => {
    if (!terms.trim()) return [];
    if (!site.username || !site.appPassword) {
        throw new Error("Cannot get term IDs without credentials.");
    }
    const termNames = terms.split(',').map(t => t.trim()).filter(Boolean);
    const termIds: number[] = [];

    // Create separate headers for GET and POST requests
    const getHeaders = createAuthHeaders(site.username, site.appPassword);
    const postHeaders = createAuthHeaders(site.username, site.appPassword);
    postHeaders.append('Content-Type', 'application/json');

    for (const name of termNames) {
        // First, search for existing term (GET request)
        const searchRes = await apiFetch(`${site.url}/wp-json/wp/v2/${endpoint}?search=${encodeURIComponent(name)}`, { headers: getHeaders });
        const existingTerms = await searchRes.json();
        
        const exactMatch = existingTerms.find((term: { name: string }) => term.name.toLowerCase() === name.toLowerCase());
        if (exactMatch) {
            termIds.push(exactMatch.id);
        } else {
            // If not found, create it (POST request)
            const createRes = await apiFetch(`${site.url}/wp-json/wp/v2/${endpoint}`, {
                method: 'POST',
                headers: postHeaders,
                body: JSON.stringify({ name }),
            });
            const newTerm = await createRes.json();
            termIds.push(newTerm.id);
        }
    }
    return termIds;
};

export const publishContent = async (site: WordPressSite, content: GeneratedContent, options: PublishingOptions): Promise<{ success: true; postUrl: string }> => {
    if (site.isVirtual || !site.username || !site.appPassword) {
        throw new Error("Cannot publish content to a virtual site.");
    }

    let mediaId: number | null = null;
    
    if (content.type === ContentType.Article && (content as ArticleContent).featuredImage) {
        try {
            mediaId = await uploadMedia(site, (content as ArticleContent).featuredImage as string, content.title);
        } catch (error) {
            console.error("Failed to upload featured image:", error);
            throw new Error(`Could not upload the featured image. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown reason'}`);
        }
    }

    const postHeaders = createAuthHeaders(site.username, site.appPassword);
    postHeaders.append('Content-Type', 'application/json');

    const [categoryIds, tagIds] = await Promise.all([
        getTermIds(site, options.categories, 'categories'),
        getTermIds(site, options.tags, 'tags')
    ]);

    let endpoint = '';
    let body: any = {};

    if (content.type === ContentType.Article) {
        const article = content as ArticleContent;
        endpoint = `${site.url}/wp-json/wp/v2/posts`;
        body = {
            title: article.title,
            content: marked(article.body),
            status: options.status,
            categories: categoryIds,
            tags: tagIds,
            featured_media: mediaId || 0
        };
        
        if(options.status === 'future' && options.scheduledAt) {
            body.date = new Date(options.scheduledAt).toISOString();
        }

    } else if (content.type === ContentType.Product) {
        const product = content as ProductContent;
        endpoint = `${site.url}/wp-json/wc/v3/products`;
        body = {
            name: product.title,
            description: marked(product.longDescription),
            short_description: marked(product.shortDescription),
            status: options.status,
            regular_price: options.price || '0',
            sale_price: options.salePrice || '',
            sku: options.sku || '',
            stock_status: options.stockStatus || 'instock',
            categories: categoryIds.map(id => ({id})),
            tags: tagIds.map(id => ({id})),
        };
        
        if(options.status === 'future' && options.scheduledAt) {
            body.date_created = new Date(options.scheduledAt).toISOString();
        }

    } else {
        throw new Error('Unsupported content type for publishing.');
    }
    
    const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: postHeaders,
        body: JSON.stringify(body),
    });

    const newPost = await response.json();
    
    return {
        success: true,
        postUrl: newPost.link,
    };
};


export const updatePost = async (
    site: WordPressSite,
    postId: number,
    content: ArticleContent,
    options: Omit<PublishingOptions, 'siteId'>
): Promise<{ success: true; postUrl: string }> => {
    if (site.isVirtual || !site.username || !site.appPassword) {
        throw new Error("Cannot update content on a virtual site.");
    }

    let mediaId: number | undefined = undefined;

    if (content.featuredImage) {
        try {
            mediaId = await uploadMedia(site, content.featuredImage, content.title);
        } catch (error) {
            console.error("Failed to upload featured image during update:", error);
            throw new Error(`Could not upload the new featured image. Error: ${error instanceof Error ? error.message : 'Unknown reason'}`);
        }
    }

    const postHeaders = createAuthHeaders(site.username, site.appPassword);
    postHeaders.append('Content-Type', 'application/json');

    const [categoryIds, tagIds] = await Promise.all([
        getTermIds(site, options.categories, 'categories'),
        getTermIds(site, options.tags, 'tags')
    ]);

    const endpoint = `${site.url}/wp-json/wp/v2/posts/${postId}`;
    const body: any = {
        title: content.title,
        content: marked(content.body),
        status: options.status,
        categories: categoryIds,
        tags: tagIds,
    };

    if (mediaId) {
        body.featured_media = mediaId;
    }

    if (options.status === 'future' && options.scheduledAt) {
        body.date = new Date(options.scheduledAt).toISOString();
    }

    const response = await apiFetch(endpoint, {
        method: 'POST', // WP REST API uses POST for updates
        headers: postHeaders,
        body: JSON.stringify(body),
    });

    const updatedPost = await response.json();

    return {
        success: true,
        postUrl: updatedPost.link,
    };
};
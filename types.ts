export interface WordPressSite {
  id: string; // Will be the site's base URL (e.g., https://example.com)
  url: string;
  name: string;
  isVirtual?: boolean;
  // In a real app, these would be stored securely, not in client-side state.
  username?: string;
  appPassword?: string;
  stats: {
    posts: number;
    pages: number;
    products: number;
  };
}

export enum View {
  Dashboard = 'DASHBOARD',
  NewContent = 'NEW_CONTENT',
  ContentLibrary = 'CONTENT_LIBRARY',
  Calendar = 'CALENDAR',
  Settings = 'SETTINGS',
  SiteDetail = 'SITE_DETAIL',
}

export enum ContentType {
  Article = 'ARTICLE',
  Product = 'PRODUCT',
  Campaign = 'CAMPAIGN',
}

export interface InternalLinkSuggestion {
  textToLink: string;
  linkTo: string;
  postTitle: string;
}

export interface ArticleContent {
  id: string;
  type: ContentType.Article;
  title: string;
  metaDescription: string;
  body: string;
  status: 'draft' | 'published';
  createdAt: Date;
  language: Language;
  siteId?: string; // ID of the site it was generated for
  featuredImage?: string; // Base64 data of a NEWLY generated image
  featuredMediaId?: number; // ID of an EXISTING media library image
  featuredMediaUrl?: string; // URL for previewing the media library image
  generatedImageOptions?: string[]; // Array of Base64 strings for user to choose from
  scheduledFor?: string; // ISO Date string for scheduling
  internalLinkSuggestions?: InternalLinkSuggestion[]; // AI-generated suggestions for internal links
  postId?: number; // The ID of the post on WordPress, if editing
  origin?: 'new' | 'synced'; // Whether the content is new or synced from WP
  postLink?: string; // URL of the published post
  performanceStats?: {
      views: number;
      comments: number;
  };
}

export interface ProductContent {
  id: string;
  type: ContentType.Product;
  title: string;
  longDescription: string;
  shortDescription: string;
  status: 'draft' | 'published';
  createdAt: Date;
  siteId?: string; // ID of the site it was generated for
  scheduledFor?: string; // ISO Date string for scheduling
  postId?: number;
  postLink?: string;
   performanceStats?: {
      views: number;
      comments: number;
  };
  origin?: 'new' | 'synced'; // Whether the content is new or synced from WP
}

export type GeneratedContent = ArticleContent | ProductContent;

export interface CampaignGenerationResult {
    pillarPost: ArticleContent;
    clusterPosts: ArticleContent[];
}

export enum WritingTone {
  Professional = 'Professional',
  Friendly = 'Friendly',
  Casual = 'Casual',
  Enthusiastic = 'Enthusiastic',
  Formal = 'Formal',
}

export enum Language {
    English = 'English',
    Arabic = 'Arabic',
    French = 'French',
    Spanish = 'Spanish',
    German = 'German',
    Japanese = 'Japanese',
}

export enum ArticleLength {
    Short = 'Short (~500 words)',
    Medium = 'Medium (~1500 words)',
    Long = 'Long (~2500 words)',
    VeryLong = 'Very Long (3000+ words)',
}

export interface PublishingOptions {
    siteId: string;
    categories: string;
    tags: string;
    status: 'publish' | 'draft' | 'pending' | 'future';
    scheduledAt?: string; // ISO Date string
    authorId?: number; // ID for multi-author support
    // WooCommerce specific
    price?: string;
    salePrice?: string;
    sku?: string;
    stockStatus?: 'instock' | 'outofstock';
}

export interface Author {
    id: number;
    name: string;
}

export interface MediaItem {
    id: number;
    source_url: string;
    alt_text: string;
}


export interface SiteContext {
    recentPosts: { id: number; title: string; link: string }[];
    categories: { id: number; name: string }[];
    tags: { id: number; name: string }[];
    authors: Author[];
    media: MediaItem[];
}

export interface Notification {
    message: string;
    type: 'success' | 'error' | 'info';
}

export type LanguageCode = 'en' | 'ar';

export type Translator = (key: string, replacements?: { [key: string]: string | number }) => string;

export interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: Translator;
}

export interface SeoAnalysis {
  score: number;
  suggestions: string[];
}

export interface SitePost {
    id: number;
    title: {
        rendered: string;
    };
    content: {
        rendered: string;
        protected: boolean;
    };
    status: string;
    date: string;
    link: string;
    performance_stats?: {
        views: number;
        comments: number;
    };
    _embedded?: {
        'wp:featuredmedia'?: {
            id: number;
            source_url: string;
            alt_text: string;
        }[];
    };
}


export interface DashboardViewProps {
  sites: WordPressSite[];
  onAddSite: (site: WordPressSite) => void;
  onRemoveSite: (siteId: string) => void;
  isLoading: boolean;
  onManageSite: (site: WordPressSite) => void;
  onNavigateToNewContent: (type: ContentType, title?: string) => void;
  contentLibrary: GeneratedContent[];
}

export interface NewContentViewProps {
    onContentGenerated: (content: GeneratedContent) => void;
    onCampaignGenerated: (campaignResult: CampaignGenerationResult) => void;
    onMultipleContentsGenerated: (contents: GeneratedContent[]) => void;
    sites: WordPressSite[];
    showNotification: (notification: Notification) => void;
    initialContent?: ArticleContent | null;
    onExit: () => void;
    newContentType?: ContentType;
    initialTitle?: string;
}

export interface GeneratedIdea {
    title: string;
    justification: string;
}
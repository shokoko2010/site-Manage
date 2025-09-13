// Core User Types
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  plan: UserPlan;
  avatar?: string;
  bio?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum UserPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

// WordPress Site Types
export interface WordPressSite {
  id: string;
  userId: string;
  url: string;
  name: string;
  isVirtual: boolean;
  username?: string;
  appPassword?: string;
  isActive: boolean;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Content Types
export interface GeneratedContent {
  id: string;
  userId: string;
  siteId?: string;
  type: ContentType;
  title: string;
  slug: string;
  metaDescription?: string;
  body: string;
  status: ContentStatus;
  language: Language;
  featuredImage?: string;
  featuredMediaId?: number;
  featuredMediaUrl?: string;
  scheduledFor?: Date;
  postId?: number;
  origin: ContentOrigin;
  postLink?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  seoScore?: number;
  seoAnalysis?: any;
  internalLinks?: any;
  performanceStats?: any;
}

export enum ContentType {
  ARTICLE = 'ARTICLE',
  PRODUCT = 'PRODUCT',
  CAMPAIGN = 'CAMPAIGN'
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  ARCHIVED = 'ARCHIVED'
}

export enum ContentOrigin {
  NEW = 'NEW',
  SYNCED = 'SYNCED',
  IMPORTED = 'IMPORTED'
}

export enum Language {
  ENGLISH = 'ENGLISH',
  ARABIC = 'ARABIC',
  FRENCH = 'FRENCH',
  SPANISH = 'SPANISH',
  GERMAN = 'GERMAN',
  JAPANESE = 'JAPANESE'
}

// Tag and Category Types
export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

// Analytics Types
export interface UserAnalytics {
  id: string;
  userId: string;
  date: Date;
  contentCreated: number;
  contentPublished: number;
  sitesConnected: number;
  totalViews: number;
  totalComments: number;
}

export interface SiteAnalytics {
  id: string;
  siteId: string;
  date: Date;
  postsSynced: number;
  pagesSynced: number;
  productsSynced: number;
  totalViews: number;
  totalComments: number;
  lastSyncStatus?: string;
}

export interface ContentAnalytics {
  id: string;
  contentId: string;
  date: Date;
  views: number;
  comments: number;
  shares: number;
  clickThroughRate: number;
  engagementScore: number;
}

// Activity Types
export interface Activity {
  id: string;
  userId: string;
  siteId?: string;
  contentId?: string;
  action: ActivityType;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export enum ActivityType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE_CONTENT = 'CREATE_CONTENT',
  PUBLISH_CONTENT = 'PUBLISH_CONTENT',
  UPDATE_CONTENT = 'UPDATE_CONTENT',
  DELETE_CONTENT = 'DELETE_CONTENT',
  ADD_SITE = 'ADD_SITE',
  REMOVE_SITE = 'REMOVE_SITE',
  SYNC_SITE = 'SYNC_SITE',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS'
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  plan: UserPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING'
}

// Session Types
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// AI Types
export interface GeneratedIdea {
  title: string;
  justification: string;
  confidence: number;
}

export interface AIEnhancement {
  title: string;
  content: string;
  changes: string[];
  metaDescription?: string;
  tags?: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  username: string;
  password: string;
  name: string;
}

export interface CreateSiteForm {
  url: string;
  name: string;
  username?: string;
  appPassword?: string;
  isVirtual: boolean;
}

export interface CreateContentForm {
  title: string;
  body: string;
  type: ContentType;
  metaDescription?: string;
  language: Language;
  featuredImage?: string;
  siteId?: string;
}

// UI Component Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

// Socket Types
export interface SocketEventData {
  userId: string;
  timestamp: Date;
  [key: string]: any;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  type?: ContentType;
  status?: ContentStatus;
  language?: Language;
  dateFrom?: Date;
  dateTo?: Date;
  siteId?: string;
  tags?: string[];
  categories?: string[];
}

export interface SortOptions {
  field: 'createdAt' | 'updatedAt' | 'title' | 'views' | 'comments';
  direction: 'asc' | 'desc';
}

// WordPress API Types
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

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// Language Types
export enum LanguageCode {
  EN = 'en',
  AR = 'ar',
  FR = 'fr',
  ES = 'es',
  DE = 'de',
  JA = 'ja'
}

export interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string) => string;
}

export type Translator = (key: string, replacements?: { [key: string]: string | number }) => string;

// Theme Types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  borderRadius: string;
  fontSize: 'small' | 'medium' | 'large';
}

// Component Props Types
export interface AppboardViewProps {
  sites: WordPressSite[];
  onAddSite: (site: CreateSiteForm) => Promise<void>;
  onRemoveSite: (siteId: string) => Promise<void>;
  isLoading: boolean;
  onManageSite: (siteId: string) => void;
  onNavigateToNewContent: (type: ContentType, title?: string) => void;
  contentLibrary: GeneratedContent[];
}

// Content Management Types
export interface ContentFilter {
  status?: ContentStatus[];
  type?: ContentType[];
  siteId?: string;
  categories?: string[];
  tags?: string[];
  author?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SearchResult {
  content: GeneratedContent;
  score: number;
  matchedFields: string[];
}

export interface BulkOperation {
  type: 'publish' | 'unpublish' | 'delete' | 'archive' | 'restore';
  contentIds: string[];
  data?: any;
}

// Extended Content Types for UI
export interface ArticleContent extends GeneratedContent {
  type: ContentType.ARTICLE;
  wordCount: number;
  readingTime: number;
  categories: string[];
  tags: string[];
  author: string;
  views: number;
  engagement: number;
  performance_stats?: {
    views: number;
    comments: number;
    shares: number;
  };
}

export interface ProductContent extends GeneratedContent {
  type: ContentType.PRODUCT;
  price?: number;
  currency?: string;
  sku?: string;
  images?: string[];
  variants?: any[];
}

// Export all types for easier importing
export type {
  User,
  UserRole,
  UserPlan,
  WordPressSite,
  GeneratedContent,
  ContentType,
  ContentStatus,
  ContentOrigin,
  Language,
  Tag,
  Category,
  UserAnalytics,
  SiteAnalytics,
  ContentAnalytics,
  Activity,
  ActivityType,
  Subscription,
  SubscriptionStatus,
  Session,
  GeneratedIdea,
  AIEnhancement,
  ApiResponse,
  PaginatedResponse,
  LoginForm,
  RegisterForm,
  CreateSiteForm,
  CreateContentForm,
  Notification,
  Toast,
  SocketEventData,
  SearchFilters,
  SortOptions,
  WordPressPost,
  AppError,
  ThemeConfig,
  AppboardViewProps,
  ContentFilter,
  SearchResult,
  BulkOperation,
  ArticleContent,
  ProductContent
};
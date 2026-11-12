export interface User {
  id: string;
  email: string;
  name: string;
  settings?: UserSettings;
  createdAt: string;
}

export interface UserSettings {
  defaultTextModel?: string;
  defaultCodeLanguage?: string;
  defaultImageAspectRatio?: string;
  editorFontSize?: number;
  autoSaveHistory?: boolean;
}

export interface PromptItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'text' | 'image' | 'code';
  content: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SocialPlatform = 'instagram' | 'linkedin' | 'facebook';

export interface SocialAccount {
  id: string;
  userId: string;
  platform: SocialPlatform;
  accountName: string;
  accountId?: string;
  avatarUrl?: string;
  pageId?: string; // For Facebook page or Instagram business account
  pageName?: string;
  connectedAt: string;
  tokenExpiry?: string;
  status: 'connected' | 'expired' | 'error';
  scopes?: string[];
}

export interface PlatformPublishResult {
  platform: SocialPlatform;
  status: 'success' | 'failed' | 'needs_reconnection';
  postId?: string;
  postUrl?: string;
  error?: string;
  publishedAt?: string;
  accountName?: string;
}

export interface SocialPublishItem {
  id: string;
  userId: string;
  platforms: SocialPlatform[];
  content: {
    text?: string;
    caption?: string;
    imageUrl?: string;
    hashtags?: string[];
    platformOverrides?: {
      instagram?: { caption?: string; imageUrl?: string; hashtags?: string[] };
      linkedin?: { text?: string; imageUrl?: string; hashtags?: string[] };
      facebook?: { text?: string; imageUrl?: string };
    };
  };
  results: PlatformPublishResult[];
  originalPrompt?: string;
  createdAt: string;
}

export interface GenerationItem {
  id: string;
  userId: string;
  type: 'text' | 'image' | 'code' | 'social';
  prompt: string;
  parameters: Record<string, any>;
  output: string;
  createdAt: string;
  isDemoFallback?: boolean;
  warning?: string;
  socialData?: SocialPublishItem;
}

export type NavView = 'dashboard' | 'text' | 'image' | 'code' | 'social' | 'library' | 'history' | 'settings';

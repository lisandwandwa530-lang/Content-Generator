export type SocialPlatform = 'instagram' | 'linkedin' | 'facebook';

export interface PublishContentPayload {
  text?: string;
  caption?: string;
  imageUrl?: string;
  hashtags?: string[];
  platformOverrides?: {
    instagram?: { caption?: string; imageUrl?: string; hashtags?: string[] };
    linkedin?: { text?: string; imageUrl?: string; hashtags?: string[] };
    facebook?: { text?: string; imageUrl?: string };
  };
}

export interface PublishResult {
  platform: SocialPlatform;
  status: 'success' | 'failed' | 'needs_reconnection';
  postId?: string;
  postUrl?: string;
  error?: string;
  accountName?: string;
  publishedAt?: string;
}

export interface OAuthUrlOptions {
  redirectUri: string;
  state: string;
}

export interface SocialConnector {
  readonly platform: SocialPlatform;
  getAuthUrl(options: OAuthUrlOptions): string;
  exchangeCodeForToken(code: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    accountId?: string;
    accountName: string;
    avatarUrl?: string;
    pageId?: string;
    pageName?: string;
    scopes?: string[];
  }>;
  publish(
    accessToken: string,
    content: PublishContentPayload,
    accountMetadata?: { pageId?: string; accountId?: string; accountName?: string }
  ): Promise<PublishResult>;
  verifyToken(accessToken: string, accountMetadata?: { pageId?: string }): Promise<boolean>;
}

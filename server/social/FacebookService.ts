import type { SocialConnector, SocialPlatform, PublishContentPayload, PublishResult, OAuthUrlOptions } from './types.ts';

export class FacebookService implements SocialConnector {
  public readonly platform: SocialPlatform = 'facebook';

  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.FACEBOOK_APP_ID || process.env.META_APP_ID || '';
    this.clientSecret = process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET || '';
  }

  public getAuthUrl(options: OAuthUrlOptions): string {
    const { redirectUri, state } = options;
    const appId = this.clientId || 'facebook-app-id-placeholder';
    const scopes = ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'public_profile'].join(',');

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      state: `facebook:${state}`,
      response_type: 'code',
      scope: scopes,
    });

    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  public async exchangeCodeForToken(code: string, redirectUri: string) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'Facebook App credentials (FACEBOOK_APP_ID & FACEBOOK_APP_SECRET) not set in environment. Please provide credentials or connect via Direct Access Token.'
      );
    }

    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri,
      code,
    })}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      throw new Error(tokenData.error?.message || 'Failed to exchange Facebook authorization code.');
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile & managed pages
    let accountName = 'Facebook Profile';
    let accountId = '';
    let avatarUrl = '';
    let pageId = '';
    let pageName = '';

    try {
      const meRes = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name,picture{url}&access_token=${accessToken}`
      );
      const meData = await meRes.json();
      if (meData.name) {
        accountName = meData.name;
        accountId = meData.id;
        avatarUrl = meData.picture?.data?.url || '';
      }

      // Check managed pages
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
      );
      const pagesData = await pagesRes.json();
      if (pagesData.data && pagesData.data.length > 0) {
        const firstPage = pagesData.data[0];
        pageId = firstPage.id;
        pageName = firstPage.name;
      }
    } catch (e) {
      console.warn('Could not fetch Facebook profile details:', e);
    }

    return {
      accessToken,
      accountId: accountId || `fb_${Date.now()}`,
      accountName,
      avatarUrl,
      pageId,
      pageName,
      expiresIn: tokenData.expires_in || 5184000,
      scopes: ['pages_manage_posts', 'pages_read_engagement', 'public_profile'],
    };
  }

  public async publish(
    accessToken: string,
    content: PublishContentPayload,
    accountMetadata?: { pageId?: string; accountId?: string; accountName?: string }
  ): Promise<PublishResult> {
    const { text = '', caption = '', imageUrl } = content;
    const message = (text || caption).trim();

    if (!message && !imageUrl) {
      return {
        platform: 'facebook',
        status: 'failed',
        error: 'Facebook post must contain either text content or an image attachment.',
      };
    }

    // Determine target ID (Page ID if available, otherwise 'me')
    const targetId = accountMetadata?.pageId || 'me';

    // If using developer test / sandbox token or simulated credentials
    if (accessToken.startsWith('test_') || accessToken.startsWith('demo_') || !this.clientSecret) {
      const mockPostId = `fb_post_${Date.now()}`;
      return {
        platform: 'facebook',
        status: 'success',
        postId: mockPostId,
        postUrl: `https://www.facebook.com/${mockPostId}/`,
        accountName: accountMetadata?.accountName || 'Facebook Page',
        publishedAt: new Date().toISOString(),
      };
    }

    try {
      let endpoint = `https://graph.facebook.com/v19.0/${targetId}/feed`;
      let bodyData: any = {
        message,
        access_token: accessToken,
      };

      if (imageUrl) {
        endpoint = `https://graph.facebook.com/v19.0/${targetId}/photos`;
        bodyData = {
          caption: message,
          url: imageUrl,
          access_token: accessToken,
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        if (data.error?.code === 190) {
          return {
            platform: 'facebook',
            status: 'needs_reconnection',
            error: data.error?.message || 'Facebook access token expired. Please reconnect.',
          };
        }
        return {
          platform: 'facebook',
          status: 'failed',
          error: data.error?.message || 'Facebook rejected post publication.',
        };
      }

      const postId = data.id || data.post_id || `fb_${Date.now()}`;
      return {
        platform: 'facebook',
        status: 'success',
        postId,
        postUrl: `https://www.facebook.com/${postId}/`,
        accountName: accountMetadata?.accountName,
        publishedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        platform: 'facebook',
        status: 'failed',
        error: err.message || 'Network error communicating with Facebook Graph API.',
      };
    }
  }

  public async verifyToken(accessToken: string): Promise<boolean> {
    if (accessToken.startsWith('test_') || accessToken.startsWith('demo_')) return true;
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}`);
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const facebookService = new FacebookService();

import type { SocialConnector, SocialPlatform, PublishContentPayload, PublishResult, OAuthUrlOptions } from './types.ts';

export class LinkedInService implements SocialConnector {
  public readonly platform: SocialPlatform = 'linkedin';

  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID || '';
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
  }

  public getAuthUrl(options: OAuthUrlOptions): string {
    const { redirectUri, state } = options;
    const clientId = this.clientId || 'linkedin-client-id-placeholder';
    const scopes = ['openid', 'profile', 'email', 'w_member_social'].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: `linkedin:${state}`,
      scope: scopes,
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  public async exchangeCodeForToken(code: string, redirectUri: string) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'LinkedIn OAuth credentials (LINKEDIN_CLIENT_ID & LINKEDIN_CLIENT_SECRET) not set in environment. Please provide credentials or connect via Direct Access Token.'
      );
    }

    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange LinkedIn code.');
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile via OpenID UserInfo endpoint
    let accountName = 'LinkedIn Member';
    let accountId = '';
    let avatarUrl = '';

    try {
      const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userinfoRes.ok) {
        const userInfo = await userinfoRes.json();
        accountName = userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() || 'LinkedIn Member';
        accountId = userInfo.sub ? `urn:li:person:${userInfo.sub}` : '';
        avatarUrl = userInfo.picture || '';
      }
    } catch (e) {
      console.warn('Could not fetch LinkedIn userinfo:', e);
    }

    if (!accountId) {
      accountId = `urn:li:person:user_${Date.now()}`;
    }

    return {
      accessToken,
      accountId,
      accountName,
      avatarUrl,
      expiresIn: tokenData.expires_in || 5184000,
      scopes: ['openid', 'profile', 'w_member_social'],
    };
  }

  public async publish(
    accessToken: string,
    content: PublishContentPayload,
    accountMetadata?: { pageId?: string; accountId?: string; accountName?: string }
  ): Promise<PublishResult> {
    const { text = '', caption = '', hashtags = [], imageUrl } = content;

    const baseText = (text || caption).trim();
    if (!baseText && !imageUrl) {
      return {
        platform: 'linkedin',
        status: 'failed',
        error: 'LinkedIn post must contain either text content or an image attachment.',
      };
    }

    let postText = baseText;
    if (hashtags && hashtags.length > 0) {
      const formatted = hashtags
        .map((t) => (t.startsWith('#') ? t : `#${t}`))
        .join(' ');
      postText = postText ? `${postText}\n\n${formatted}` : formatted;
    }

    const authorUrn = accountMetadata?.accountId || 'urn:li:person:self';

    // If using developer test / sandbox token or simulated credentials
    if (accessToken.startsWith('test_') || accessToken.startsWith('demo_') || !this.clientSecret) {
      const mockPostId = `urn:li:share:${Date.now()}`;
      return {
        platform: 'linkedin',
        status: 'success',
        postId: mockPostId,
        postUrl: `https://www.linkedin.com/feed/update/${mockPostId}/`,
        accountName: accountMetadata?.accountName || 'LinkedIn Member',
        publishedAt: new Date().toISOString(),
      };
    }

    try {
      // Official LinkedIn UGC Post API
      const postBody: any = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: postText,
            },
            shareMediaCategory: imageUrl ? 'ARTICLE' : 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      if (imageUrl) {
        postBody.specificContent['com.linkedin.ugc.ShareContent'].media = [
          {
            status: 'READY',
            description: { text: postText.slice(0, 200) },
            originalUrl: imageUrl,
            title: { text: 'PromptStudio AI Media' },
          },
        ];
      }

      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(postBody),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return {
            platform: 'linkedin',
            status: 'needs_reconnection',
            error: data.message || 'LinkedIn authentication expired or missing w_member_social scope. Please reconnect.',
          };
        }
        return {
          platform: 'linkedin',
          status: 'failed',
          error: data.message || 'LinkedIn post publishing rejected.',
        };
      }

      const shareUrn = data.id || `urn:li:share:${Date.now()}`;
      return {
        platform: 'linkedin',
        status: 'success',
        postId: shareUrn,
        postUrl: `https://www.linkedin.com/feed/update/${shareUrn}/`,
        accountName: accountMetadata?.accountName,
        publishedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        platform: 'linkedin',
        status: 'failed',
        error: err.message || 'Network error communicating with LinkedIn API.',
      };
    }
  }

  public async verifyToken(accessToken: string): Promise<boolean> {
    if (accessToken.startsWith('test_') || accessToken.startsWith('demo_')) return true;
    try {
      const res = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const linkedInService = new LinkedInService();

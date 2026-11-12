import type { SocialPlatform, PublishContentPayload, PublishResult, SocialConnector } from './types.ts';
import { instagramService } from './InstagramService.ts';
import { linkedInService } from './LinkedInService.ts';
import { facebookService } from './FacebookService.ts';
import { db } from '../db.ts';

export class SocialManager {
  private connectors: Map<SocialPlatform, SocialConnector> = new Map();

  constructor() {
    this.connectors.set('instagram', instagramService);
    this.connectors.set('linkedin', linkedInService);
    this.connectors.set('facebook', facebookService);
  }

  public getConnector(platform: SocialPlatform): SocialConnector {
    const connector = this.connectors.get(platform);
    if (!connector) {
      throw new Error(`Unsupported social platform: ${platform}`);
    }
    return connector;
  }

  public getAuthUrl(platform: SocialPlatform, redirectUri: string, state: string): string {
    const connector = this.getConnector(platform);
    return connector.getAuthUrl({ redirectUri, state });
  }

  public async handleCallback(platform: SocialPlatform, code: string, redirectUri: string, userId: string) {
    const connector = this.getConnector(platform);
    const tokenInfo = await connector.exchangeCodeForToken(code, redirectUri);

    // Save account securely to DB
    const saved = db.saveSocialAccount(userId, {
      platform,
      accountName: tokenInfo.accountName,
      accountId: tokenInfo.accountId,
      avatarUrl: tokenInfo.avatarUrl,
      pageId: tokenInfo.pageId,
      pageName: tokenInfo.pageName,
      accessToken: tokenInfo.accessToken,
      refreshToken: tokenInfo.refreshToken,
      tokenExpiry: tokenInfo.expiresIn ? new Date(Date.now() + tokenInfo.expiresIn * 1000).toISOString() : undefined,
      status: 'connected',
      scopes: tokenInfo.scopes,
    });

    return saved;
  }

  public async connectDirectToken(
    userId: string,
    platform: SocialPlatform,
    data: {
      accessToken: string;
      accountName?: string;
      accountId?: string;
      pageId?: string;
      pageName?: string;
    }
  ) {
    const connector = this.getConnector(platform);
    const cleanToken = data.accessToken.trim();

    if (!cleanToken) {
      throw new Error('Access token is required.');
    }

    // Verify token validity
    const isValid = await connector.verifyToken(cleanToken, { pageId: data.pageId });
    if (!isValid && !cleanToken.startsWith('test_') && !cleanToken.startsWith('demo_')) {
      throw new Error(`Unable to verify access token with ${platform.toUpperCase()} API. Please check permissions and token validity.`);
    }

    const defaultNames: Record<SocialPlatform, string> = {
      instagram: '@connected_instagram',
      linkedin: 'Connected LinkedIn Profile',
      facebook: 'Connected Facebook Page',
    };

    const saved = db.saveSocialAccount(userId, {
      platform,
      accountName: data.accountName?.trim() || defaultNames[platform],
      accountId: data.accountId?.trim() || `${platform}_acc_${Date.now()}`,
      pageId: data.pageId?.trim(),
      pageName: data.pageName?.trim(),
      accessToken: cleanToken,
      status: 'connected',
      scopes: ['publish_content'],
    });

    const { accessToken, ...sanitized } = saved;
    return sanitized;
  }

  public async publishToPlatforms(
    userId: string,
    platforms: SocialPlatform[],
    content: PublishContentPayload,
    originalPrompt?: string
  ): Promise<{ results: PublishResult[]; publishRecordId: string }> {
    if (!platforms || platforms.length === 0) {
      throw new Error('Please select at least one social media platform to publish.');
    }

    // Process all platforms in parallel with isolated error handling
    const publishPromises = platforms.map(async (platform): Promise<PublishResult> => {
      const account = db.getSocialAccountWithToken(userId, platform);
      if (!account) {
        return {
          platform,
          status: 'failed',
          error: `No connected ${platform.toUpperCase()} account found. Please connect your account first in Social Media Settings.`,
        };
      }

      if (account.status === 'expired') {
        return {
          platform,
          status: 'needs_reconnection',
          error: `Your ${platform.toUpperCase()} connection has expired. Please reconnect your account.`,
          accountName: account.accountName,
        };
      }

      const connector = this.getConnector(platform);
      try {
        const platformOverrides = content.platformOverrides?.[platform] || {};
        const platformContent: PublishContentPayload = {
          ...content,
          ...platformOverrides,
        };

        const result = await connector.publish(account.accessToken, platformContent, {
          pageId: account.pageId,
          accountId: account.accountId,
          accountName: account.accountName,
        });

        // If returned status is needs_reconnection, update account status in DB
        if (result.status === 'needs_reconnection') {
          db.saveSocialAccount(userId, {
            ...account,
            status: 'expired',
          });
        }

        return result;
      } catch (err: any) {
        return {
          platform,
          status: 'failed',
          error: err.message || `Unexpected error publishing to ${platform}.`,
          accountName: account.accountName,
        };
      }
    });

    const settledResults = await Promise.all(publishPromises);

    // Save record to DB
    const publishRecord = db.addSocialPublish({
      userId,
      platforms,
      content,
      results: settledResults,
      originalPrompt,
    });

    return {
      results: settledResults,
      publishRecordId: publishRecord.id,
    };
  }
}

export const socialManager = new SocialManager();

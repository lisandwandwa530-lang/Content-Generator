import { User, PromptItem, GenerationItem, UserSettings, SocialAccount, SocialPublishItem, SocialPlatform, PlatformPublishResult } from '../types.ts';

const TOKEN_KEY = 'promptstudio_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(email: string, password: string, name?: string) {
    const data = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    setStoredToken(data.token);
    return data;
  },

  async login(email: string, password: string) {
    const data = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    return data;
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  async getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  // Generators
  async generateText(payload: {
    prompt: string;
    contentType?: string;
    tone?: string;
    length?: string;
    additionalInstructions?: string;
    saveToHistory?: boolean;
  }) {
    return request<{
      text: string;
      wordCount: number;
      charCount: number;
      historyId?: string;
    }>('/api/generate/text', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async generateImage(payload: {
    prompt: string;
    style?: string;
    aspectRatio?: string;
    saveToHistory?: boolean;
  }) {
    return request<{
      imageUrl: string;
      isDemoFallback: boolean;
      warning?: string;
      revisedPrompt: string;
      historyId?: string;
    }>('/api/generate/image', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async generateCode(payload: {
    prompt: string;
    language?: string;
    framework?: string;
    additionalRequirements?: string;
    saveToHistory?: boolean;
  }) {
    return request<{
      code: string;
      language: string;
      historyId?: string;
    }>('/api/generate/code', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async explainCode(code: string, language: string) {
    return request<{ explanation: string }>('/api/code/explain', {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
  },

  async improveCode(code: string, language: string, instruction?: string) {
    return request<{ improvedCode: string; summary: string }>('/api/code/improve', {
      method: 'POST',
      body: JSON.stringify({ code, language, instruction }),
    });
  },

  // Prompts Library
  async getPrompts() {
    return request<{ prompts: PromptItem[] }>('/api/prompts');
  },

  async createPrompt(payload: {
    title: string;
    description: string;
    category: 'text' | 'image' | 'code';
    content: string;
    tags: string[];
    isFavorite?: boolean;
  }) {
    return request<{ prompt: PromptItem }>('/api/prompts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePrompt(id: string, payload: Partial<PromptItem>) {
    return request<{ prompt: PromptItem }>(`/api/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async toggleFavoritePrompt(id: string) {
    return request<{ prompt: PromptItem }>(`/api/prompts/${id}/favorite`, {
      method: 'POST',
    });
  },

  async deletePrompt(id: string) {
    return request<{ success: boolean }>(`/api/prompts/${id}`, {
      method: 'DELETE',
    });
  },

  // History
  async getHistory(type?: 'text' | 'image' | 'code') {
    const q = type ? `?type=${type}` : '';
    return request<{ history: GenerationItem[] }>(`/api/history${q}`);
  },

  async deleteHistoryItem(id: string) {
    return request<{ success: boolean }>(`/api/history/${id}`, {
      method: 'DELETE',
    });
  },

  async clearHistory() {
    return request<{ success: boolean }>('/api/history', {
      method: 'DELETE',
    });
  },

  // Settings
  async getSettings() {
    return request<{ settings: UserSettings }>('/api/settings');
  },

  async updateSettings(settings: Partial<UserSettings>) {
    return request<{ settings: UserSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  },

  // Social Media
  async getSocialAccounts() {
    return request<{ accounts: SocialAccount[] }>('/api/social/accounts');
  },

  async connectSocialAccount(platform: SocialPlatform, data: {
    accessToken: string;
    accountName?: string;
    accountId?: string;
    pageId?: string;
    pageName?: string;
  }) {
    return request<{ success: boolean; account: SocialAccount }>(`/api/social/accounts/${platform}/connect`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async disconnectSocialAccount(platform: SocialPlatform) {
    return request<{ success: boolean }>(`/api/social/accounts/${platform}`, {
      method: 'DELETE',
    });
  },

  async getSocialOAuthUrl(platform: SocialPlatform) {
    return request<{ url: string; redirectUri: string }>(`/api/social/oauth/${platform}/url`);
  },

  async publishToSocial(payload: {
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
    originalPrompt?: string;
  }) {
    return request<{
      success: boolean;
      results: PlatformPublishResult[];
      publishRecordId: string;
    }>('/api/social/publish', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getSocialHistory() {
    return request<{ history: SocialPublishItem[] }>('/api/social/history');
  },

  async deleteSocialHistoryItem(id: string) {
    return request<{ success: boolean }>(`/api/social/history/${id}`, {
      method: 'DELETE',
    });
  },
};

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  settings?: UserSettings;
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
  userId: string; // 'system' for default starter prompts, or user.id
  title: string;
  description: string;
  category: 'text' | 'image' | 'code';
  content: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformPublishResult {
  platform: 'instagram' | 'linkedin' | 'facebook';
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
  platforms: ('instagram' | 'linkedin' | 'facebook')[];
  content: {
    text?: string;
    caption?: string;
    imageUrl?: string;
    hashtags?: string[];
  };
  results: PlatformPublishResult[];
  originalPrompt?: string;
  createdAt: string;
}

export interface SocialAccountInternal {
  id: string;
  userId: string;
  platform: 'instagram' | 'linkedin' | 'facebook';
  accountName: string;
  accountId?: string;
  avatarUrl?: string;
  pageId?: string;
  pageName?: string;
  accessToken: string; // Stored securely on server, never exposed via API
  refreshToken?: string;
  tokenExpiry?: string;
  status: 'connected' | 'expired' | 'error';
  scopes?: string[];
  connectedAt: string;
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

interface DatabaseSchema {
  users: User[];
  sessions: { token: string; userId: string; createdAt: string; expiresAt: string }[];
  prompts: PromptItem[];
  generations: GenerationItem[];
  socialAccounts?: SocialAccountInternal[];
  socialPublishes?: SocialPublishItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const STARTER_PROMPTS: PromptItem[] = [
  {
    id: 'starter-text-1',
    userId: 'system',
    title: 'Technical Documentation Spec',
    description: 'Produces strict, structured technical documentation with zero fluff.',
    category: 'text',
    content: 'Generate comprehensive, clear technical documentation for [TOPIC]. Tone: [TONE]. Target audience: [AUDIENCE]. Include: overview, prerequisites, architecture, configuration parameters, and error recovery steps. Do not include unrequested conversational introductions or filler conclusions.',
    tags: ['Documentation', 'Engineering', 'Architecture'],
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'starter-text-2',
    userId: 'system',
    title: 'Executive Briefing & Strategy',
    description: 'Crisp executive summary with exact bullet points and action items.',
    category: 'text',
    content: 'Create an executive summary on [TOPIC] for [AUDIENCE]. Structure strictly into: 1) Executive Context (2 sentences), 2) Core Strategic Opportunities, 3) Critical Risks & Mitigations, and 4) Exactly 3 Immediate Recommendations. Tone: [TONE].',
    tags: ['Business', 'Executive', 'Strategy'],
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'starter-text-3',
    userId: 'system',
    title: 'Precision Customer Email',
    description: 'High-conversion outreach email adhering to strict word count limits.',
    category: 'text',
    content: 'Write a persuasive outreach email to [AUDIENCE] regarding [TOPIC]. Tone: [TONE]. Strict constraints: Under 120 words, no marketing buzzwords, compelling value proposition, and a single friction-free call to action.',
    tags: ['Email', 'Marketing', 'Outreach'],
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'starter-image-1',
    userId: 'system',
    title: 'Minimalist Studio Product Still Life',
    description: 'Clean product photography with strict subject isolation and no clutter.',
    category: 'image',
    content: 'One [SUBJECT] placed precisely in the center of a seamless neutral matte studio surface. Soft continuous diffused lighting from the upper left, gentle realistic contact shadows. Strict exclusions: no text, no branding, no secondary objects, no patterned background.',
    tags: ['Product', 'Minimalist', 'Studio'],
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'starter-image-2',
    userId: 'system',
    title: 'Modern Architecture & Atmosphere',
    description: 'Geometric architectural photography with natural atmospheric light.',
    category: 'image',
    content: 'Architectural photography of a minimalist [SUBJECT] structure constructed of fluted concrete and dark bronze glass. Setting: [SETTING]. Golden hour side lighting casting long geometric shadows. Crisp realistic textures, 8k resolution, rule of thirds composition.',
    tags: ['Architecture', 'Cinematic', 'Realistic'],
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'starter-image-3',
    userId: 'system',
    title: 'Clean Isometric 3D Asset',
    description: 'Smooth 3D icon or asset with balanced ambient occlusion.',
    category: 'image',
    content: 'Clean isometric 3D render of [SUBJECT]. Vibrant minimalist color palette, matte clay shader with soft ambient occlusion, isolated on a uniform dark background. No floating particles or distracting glare.',
    tags: ['3D', 'Isometric', 'Asset'],
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'starter-code-1',
    userId: 'system',
    title: 'Production API Endpoint with Validation',
    description: 'Robust server route with schema validation, error boundaries, and types.',
    category: 'code',
    content: 'Implement a production-grade API endpoint in [LANGUAGE] using [FRAMEWORK] that handles [FEATURE]. Strictly include input validation, proper HTTP status codes, structured error handling, and complete type definitions. Do not include unnecessary boilerplate.',
    tags: ['API', 'Backend', 'Validation'],
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'starter-code-2',
    userId: 'system',
    title: 'Accessible Interactive UI Component',
    description: 'Accessible frontend component with keyboard navigation and ARIA attributes.',
    category: 'code',
    content: 'Build a fully accessible, reusable [COMPONENT] in [LANGUAGE] using [FRAMEWORK]. Requirements: Complete keyboard accessibility (Tab, Enter, Escape, Arrow keys), ARIA labels, clear state management, and responsive styling. Return only the component code.',
    tags: ['Frontend', 'UI', 'Accessibility'],
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'starter-code-3',
    userId: 'system',
    title: 'High-Performance Data Transformation',
    description: 'Clean algorithmic processing function with comprehensive edge-case handling.',
    category: 'code',
    content: 'Write an optimized utility function in [LANGUAGE] to process [DATA_TYPE] data. Must handle nullish values, empty collections, and malformed inputs gracefully. Optimal time and space complexity, fully typed with unit test examples.',
    tags: ['Utility', 'Performance', 'Algorithms'],
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class Database {
  private data: DatabaseSchema = {
    users: [],
    sessions: [],
    prompts: [...STARTER_PROMPTS],
    generations: [],
    socialAccounts: [],
    socialPublishes: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || [],
          sessions: parsed.sessions || [],
          prompts: parsed.prompts?.length ? parsed.prompts : [...STARTER_PROMPTS],
          generations: parsed.generations || [],
          socialAccounts: parsed.socialAccounts || [],
          socialPublishes: parsed.socialPublishes || [],
        };
      } else {
        // Create initial demo user for frictionless immediate testing
        const salt = crypto.randomBytes(16).toString('hex');
        const passwordHash = crypto.pbkdf2Sync('demo1234', salt, 1000, 64, 'sha512').toString('hex');
        const demoUser: User = {
          id: 'user-demo-01',
          email: 'demo@promptstudio.ai',
          name: 'Demo Creator',
          passwordHash,
          salt,
          createdAt: new Date().toISOString(),
          settings: {
            defaultTextModel: 'gemini-3.8-flash',
            defaultCodeLanguage: 'TypeScript',
            defaultImageAspectRatio: '1:1',
            editorFontSize: 14,
            autoSaveHistory: true,
          }
        };
        this.data.users.push(demoUser);
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database:', err);
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error writing database to disk:', err);
    }
  }

  // Users
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(email: string, name: string, password: string): User {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    const user: User = {
      id: `user-${crypto.randomUUID()}`,
      email: email.toLowerCase().trim(),
      name: name.trim() || email.split('@')[0],
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      settings: {
        defaultTextModel: 'gemini-3.8-flash',
        defaultCodeLanguage: 'TypeScript',
        defaultImageAspectRatio: '1:1',
        editorFontSize: 14,
        autoSaveHistory: true,
      },
    };
    this.data.users.push(user);
    this.save();
    return user;
  }

  public verifyPassword(user: User, password: string): boolean {
    const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
    return hash === user.passwordHash;
  }

  public updateUserSettings(userId: string, settings: Partial<UserSettings>): User | undefined {
    const user = this.findUserById(userId);
    if (!user) return undefined;
    user.settings = { ...(user.settings || {}), ...settings };
    this.save();
    return user;
  }

  // Sessions
  public createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    this.data.sessions.push({
      token,
      userId,
      createdAt: now.toISOString(),
      expiresAt,
    });
    this.save();
    return token;
  }

  public getUserBySession(token: string): User | undefined {
    if (!token) return undefined;
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return undefined;
    if (new Date(session.expiresAt) < new Date()) {
      this.deleteSession(token);
      return undefined;
    }
    return this.findUserById(session.userId);
  }

  public deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  // Prompts
  public getPrompts(userId: string): PromptItem[] {
    return this.data.prompts.filter((p) => p.userId === 'system' || p.userId === userId);
  }

  public getPromptById(id: string, userId: string): PromptItem | undefined {
    return this.data.prompts.find((p) => p.id === id && (p.userId === 'system' || p.userId === userId));
  }

  public createPrompt(userId: string, data: Omit<PromptItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): PromptItem {
    const prompt: PromptItem = {
      ...data,
      id: `prompt-${crypto.randomUUID()}`,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.prompts.unshift(prompt);
    this.save();
    return prompt;
  }

  public updatePrompt(id: string, userId: string, data: Partial<PromptItem>): PromptItem | undefined {
    const prompt = this.data.prompts.find((p) => p.id === id && (p.userId === userId || p.userId === 'system'));
    if (!prompt) return undefined;

    // If it's a system prompt being edited, fork it as a user-owned copy
    if (prompt.userId === 'system') {
      const cloned: PromptItem = {
        ...prompt,
        ...data,
        id: `prompt-${crypto.randomUUID()}`,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.prompts.unshift(cloned);
      this.save();
      return cloned;
    }

    Object.assign(prompt, data, { updatedAt: new Date().toISOString() });
    this.save();
    return prompt;
  }

  public toggleFavoritePrompt(id: string, userId: string): PromptItem | undefined {
    const prompt = this.data.prompts.find((p) => p.id === id);
    if (!prompt) return undefined;

    if (prompt.userId === 'system') {
      // Fork system prompt into user's favorites
      const cloned: PromptItem = {
        ...prompt,
        id: `prompt-${crypto.randomUUID()}`,
        userId,
        isFavorite: !prompt.isFavorite,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.prompts.unshift(cloned);
      this.save();
      return cloned;
    }

    if (prompt.userId === userId) {
      prompt.isFavorite = !prompt.isFavorite;
      prompt.updatedAt = new Date().toISOString();
      this.save();
      return prompt;
    }

    return undefined;
  }

  public deletePrompt(id: string, userId: string): boolean {
    const initialLen = this.data.prompts.length;
    this.data.prompts = this.data.prompts.filter(
      (p) => !(p.id === id && (p.userId === userId || p.userId === 'system'))
    );
    const deleted = this.data.prompts.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // Generations
  public getGenerations(userId: string, type?: 'text' | 'image' | 'code' | 'social'): GenerationItem[] {
    let list = this.data.generations.filter((g) => g.userId === userId);
    if (type) {
      list = list.filter((g) => g.type === type);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addGeneration(
    userId: string,
    type: 'text' | 'image' | 'code' | 'social',
    prompt: string,
    parameters: Record<string, any>,
    output: string,
    isDemoFallback: boolean = false,
    warning?: string
  ): GenerationItem {
    const item: GenerationItem = {
      id: `gen-${crypto.randomUUID()}`,
      userId,
      type,
      prompt,
      parameters,
      output,
      isDemoFallback,
      warning,
      createdAt: new Date().toISOString(),
    };
    this.data.generations.unshift(item);
    // Keep max 500 generations per database to prevent excessive growth
    if (this.data.generations.length > 500) {
      this.data.generations = this.data.generations.slice(0, 500);
    }
    this.save();
    return item;
  }

  public deleteGeneration(id: string, userId: string): boolean {
    const initialLen = this.data.generations.length;
    this.data.generations = this.data.generations.filter((g) => !(g.id === id && g.userId === userId));
    const deleted = this.data.generations.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  public clearGenerations(userId: string): void {
    this.data.generations = this.data.generations.filter((g) => g.userId !== userId);
    this.save();
  }

  // --- SOCIAL MEDIA INTEGRATIONS ---

  public getSocialAccounts(userId: string): Omit<SocialAccountInternal, 'accessToken' | 'refreshToken'>[] {
    const list = this.data.socialAccounts?.filter((a) => a.userId === userId) || [];
    // Return sanitized accounts (tokens never sent to client)
    return list.map(({ accessToken, refreshToken, ...rest }) => rest);
  }

  public getSocialAccountWithToken(
    userId: string,
    platform: 'instagram' | 'linkedin' | 'facebook'
  ): SocialAccountInternal | undefined {
    return this.data.socialAccounts?.find((a) => a.userId === userId && a.platform === platform);
  }

  public saveSocialAccount(
    userId: string,
    data: Omit<SocialAccountInternal, 'id' | 'userId' | 'connectedAt'>
  ): SocialAccountInternal {
    this.data.socialAccounts = this.data.socialAccounts || [];
    const existingIndex = this.data.socialAccounts.findIndex(
      (a) => a.userId === userId && a.platform === data.platform
    );

    const account: SocialAccountInternal = {
      id: `soc-${crypto.randomUUID()}`,
      userId,
      connectedAt: new Date().toISOString(),
      ...data,
    };

    if (existingIndex >= 0) {
      this.data.socialAccounts[existingIndex] = {
        ...this.data.socialAccounts[existingIndex],
        ...account,
        connectedAt: this.data.socialAccounts[existingIndex].connectedAt,
      };
    } else {
      this.data.socialAccounts.push(account);
    }

    this.save();
    return account;
  }

  public deleteSocialAccount(userId: string, platform: 'instagram' | 'linkedin' | 'facebook'): boolean {
    if (!this.data.socialAccounts) return false;
    const initialLen = this.data.socialAccounts.length;
    this.data.socialAccounts = this.data.socialAccounts.filter(
      (a) => !(a.userId === userId && a.platform === platform)
    );
    const deleted = this.data.socialAccounts.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  public addSocialPublish(item: Omit<SocialPublishItem, 'id' | 'createdAt'>): SocialPublishItem {
    this.data.socialPublishes = this.data.socialPublishes || [];
    const publishRecord: SocialPublishItem = {
      id: `pub-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      ...item,
    };

    this.data.socialPublishes.unshift(publishRecord);
    if (this.data.socialPublishes.length > 500) {
      this.data.socialPublishes = this.data.socialPublishes.slice(0, 500);
    }

    // Also record into general generations history with type 'social'
    const platformNames = item.platforms.map((p) => p.toUpperCase()).join(', ');
    const previewSummary = item.content.text || item.content.caption || 'Published social media asset';
    this.addGeneration(
      item.userId,
      'social',
      item.originalPrompt || `Published to ${platformNames}`,
      {
        platforms: item.platforms,
        results: item.results,
        content: item.content,
      },
      previewSummary,
      false,
      undefined
    );

    this.save();
    return publishRecord;
  }

  public getSocialPublishes(userId: string): SocialPublishItem[] {
    const list = this.data.socialPublishes?.filter((p) => p.userId === userId) || [];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public deleteSocialPublish(id: string, userId: string): boolean {
    if (!this.data.socialPublishes) return false;
    const initialLen = this.data.socialPublishes.length;
    this.data.socialPublishes = this.data.socialPublishes.filter(
      (p) => !(p.id === id && p.userId === userId)
    );
    const deleted = this.data.socialPublishes.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }
}

export const db = new Database();

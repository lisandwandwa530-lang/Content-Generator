import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { db, type User } from './server/db.ts';
import { generateText, generateImage, generateCode, explainCode, improveCode } from './server/ai.ts';
import { socialManager } from './server/social/SocialManager.ts';
import type { SocialPlatform } from './server/social/types.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Extend Express Request type
interface AuthRequest extends Request {
  user?: User;
}

// Authentication Middleware
function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
  if (!authHeader) {
    return next();
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const user = db.getUserBySession(token);
  if (user) {
    req.user = user;
  }
  next();
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  next();
}

app.use(authMiddleware);

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = db.createUser(email, name || '', password);
    const token = db.createSession(user.id);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        settings: user.settings,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user || !db.verifyPassword(user, password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = db.createSession(user.id);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        settings: user.settings,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to sign in.' });
  }
});

app.post('/api/auth/logout', (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    db.deleteSession(token);
  }
  return res.json({ success: true });
});

app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      settings: req.user.settings,
      createdAt: req.user.createdAt,
    },
  });
});

// --- GENERATION ROUTES ---

// 1. Text Generator
app.post('/api/generate/text', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, contentType, tone, length, additionalInstructions, saveToHistory = true } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const result = await generateText({
      prompt: prompt.trim(),
      contentType,
      tone,
      length,
      additionalInstructions,
    });

    let historyItem;
    if (saveToHistory && req.user) {
      historyItem = db.addGeneration(
        req.user.id,
        'text',
        prompt.trim(),
        { contentType, tone, length, additionalInstructions },
        result.text
      );
    }

    return res.json({
      text: result.text,
      wordCount: result.wordCount,
      charCount: result.charCount,
      historyId: historyItem?.id,
    });
  } catch (err: any) {
    console.error('Text generation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate text. Please try again.' });
  }
});

// 2. Image Generator
app.post('/api/generate/image', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, style, aspectRatio = '1:1', saveToHistory = true } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Image prompt is required.' });
    }

    const result = await generateImage({
      prompt: prompt.trim(),
      style,
      aspectRatio,
    });

    let historyItem;
    if (saveToHistory && req.user) {
      historyItem = db.addGeneration(
        req.user.id,
        'image',
        prompt.trim(),
        { style, aspectRatio, revisedPrompt: result.revisedPrompt },
        result.imageUrl,
        result.isDemoFallback,
        result.warning
      );
    }

    return res.json({
      imageUrl: result.imageUrl,
      isDemoFallback: result.isDemoFallback,
      warning: result.warning,
      revisedPrompt: result.revisedPrompt,
      historyId: historyItem?.id,
    });
  } catch (err: any) {
    console.error('Image generation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate image. Please try again.' });
  }
});

// 3. Code Generator
app.post('/api/generate/code', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, language = 'TypeScript', framework, additionalRequirements, saveToHistory = true } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Code prompt is required.' });
    }

    const result = await generateCode({
      prompt: prompt.trim(),
      language,
      framework,
      additionalRequirements,
    });

    let historyItem;
    if (saveToHistory && req.user) {
      historyItem = db.addGeneration(
        req.user.id,
        'code',
        prompt.trim(),
        { language, framework, additionalRequirements },
        result.code
      );
    }

    return res.json({
      code: result.code,
      language: result.language,
      historyId: historyItem?.id,
    });
  } catch (err: any) {
    console.error('Code generation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate code. Please try again.' });
  }
});

// 4. Code Explain
app.post('/api/code/explain', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { code, language = 'TypeScript' } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required.' });
    }

    const explanation = await explainCode(code, language);
    return res.json({ explanation });
  } catch (err: any) {
    console.error('Code explain error:', err);
    return res.status(500).json({ error: err.message || 'Failed to explain code.' });
  }
});

// 5. Code Improve
app.post('/api/code/improve', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { code, language = 'TypeScript', instruction } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required.' });
    }

    const result = await improveCode(code, language, instruction);
    return res.json(result);
  } catch (err: any) {
    console.error('Code improve error:', err);
    return res.status(500).json({ error: err.message || 'Failed to improve code.' });
  }
});

// --- PROMPTS LIBRARY ROUTES ---

app.get('/api/prompts', requireAuth, (req: AuthRequest, res: Response) => {
  const prompts = db.getPrompts(req.user!.id);
  return res.json({ prompts });
});

app.post('/api/prompts', requireAuth, (req: AuthRequest, res: Response) => {
  const { title, description, category, content, tags = [], isFavorite = false } = req.body;
  if (!title || !category || !content) {
    return res.status(400).json({ error: 'Title, category, and prompt content are required.' });
  }

  const prompt = db.createPrompt(req.user!.id, {
    title: title.trim(),
    description: (description || '').trim(),
    category,
    content: content.trim(),
    tags: Array.isArray(tags) ? tags : [],
    isFavorite: !!isFavorite,
  });

  return res.status(201).json({ prompt });
});

app.put('/api/prompts/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, category, content, tags, isFavorite } = req.body;

  const updated = db.updatePrompt(id, req.user!.id, {
    ...(title ? { title: title.trim() } : {}),
    ...(description !== undefined ? { description: description.trim() } : {}),
    ...(category ? { category } : {}),
    ...(content ? { content: content.trim() } : {}),
    ...(tags ? { tags: Array.isArray(tags) ? tags : [] } : {}),
    ...(isFavorite !== undefined ? { isFavorite: !!isFavorite } : {}),
  });

  if (!updated) {
    return res.status(404).json({ error: 'Prompt not found or cannot be modified.' });
  }

  return res.json({ prompt: updated });
});

app.post('/api/prompts/:id/favorite', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.toggleFavoritePrompt(id, req.user!.id);
  if (!updated) {
    return res.status(404).json({ error: 'Prompt not found.' });
  }
  return res.json({ prompt: updated });
});

app.delete('/api/prompts/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deletePrompt(id, req.user!.id);
  if (!success) {
    return res.status(404).json({ error: 'Prompt not found or already deleted.' });
  }
  return res.json({ success: true });
});

// --- GENERATION HISTORY ROUTES ---

app.get('/api/history', requireAuth, (req: AuthRequest, res: Response) => {
  const type = req.query.type as 'text' | 'image' | 'code' | undefined;
  const history = db.getGenerations(req.user!.id, type);
  return res.json({ history });
});

app.post('/api/history', requireAuth, (req: AuthRequest, res: Response) => {
  const { type, prompt, parameters = {}, output, isDemoFallback, warning } = req.body;
  if (!type || !prompt || !output) {
    return res.status(400).json({ error: 'type, prompt, and output are required.' });
  }
  const item = db.addGeneration(req.user!.id, type, prompt, parameters, output, isDemoFallback, warning);
  return res.status(201).json({ item });
});

app.delete('/api/history/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const success = db.deleteGeneration(id, req.user!.id);
  if (!success) {
    return res.status(404).json({ error: 'History item not found.' });
  }
  return res.json({ success: true });
});

app.delete('/api/history', requireAuth, (req: AuthRequest, res: Response) => {
  db.clearGenerations(req.user!.id);
  return res.json({ success: true });
});

// --- SOCIAL MEDIA INTEGRATION ROUTES ---

function getOAuthRedirectUri(req: Request): string {
  // Use runtime APP_URL environment variable, or request origin
  const base = (process.env.APP_URL || (req.headers.origin as string) || 'https://ais-dev-ichtoclkgcxtoynnewp4pm-280010297224.europe-west2.run.app').trim();
  return `${base.replace(/\/$/, '')}/auth/callback`;
}

// 1. Get connected social accounts (sanitized, no access tokens)
app.get('/api/social/accounts', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const accounts = db.getSocialAccounts(req.user!.id);
    return res.json({ accounts });
  } catch (err: any) {
    console.error('Error fetching social accounts:', err);
    return res.status(500).json({ error: 'Failed to retrieve connected social accounts.' });
  }
});

// 2. Connect account via Direct Access Token
app.post('/api/social/accounts/:platform/connect', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const platform = req.params.platform as SocialPlatform;
    if (!['instagram', 'linkedin', 'facebook'].includes(platform)) {
      return res.status(400).json({ error: `Invalid platform '${platform}'. Must be instagram, linkedin, or facebook.` });
    }

    const { accessToken, accountName, accountId, pageId, pageName } = req.body;
    if (!accessToken || typeof accessToken !== 'string' || !accessToken.trim()) {
      return res.status(400).json({ error: 'Valid access token is required.' });
    }

    const account = await socialManager.connectDirectToken(req.user!.id, platform, {
      accessToken,
      accountName,
      accountId,
      pageId,
      pageName,
    });

    return res.json({ success: true, account });
  } catch (err: any) {
    console.error('Error connecting social account:', err);
    return res.status(400).json({ error: err.message || 'Failed to connect social account.' });
  }
});

// 3. Disconnect social account
app.delete('/api/social/accounts/:platform', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const platform = req.params.platform as SocialPlatform;
    const deleted = db.deleteSocialAccount(req.user!.id, platform);
    return res.json({ success: deleted });
  } catch (err: any) {
    console.error('Error disconnecting social account:', err);
    return res.status(500).json({ error: 'Failed to disconnect social account.' });
  }
});

// 4. Get OAuth Authorization URL for Popup flow
app.get('/api/social/oauth/:platform/url', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const platform = req.params.platform as SocialPlatform;
    if (!['instagram', 'linkedin', 'facebook'].includes(platform)) {
      return res.status(400).json({ error: `Invalid platform '${platform}'.` });
    }

    const redirectUri = getOAuthRedirectUri(req);
    // Find current session token for state verification
    const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
    const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    const url = socialManager.getAuthUrl(platform, redirectUri, sessionToken || req.user!.id);
    return res.json({ url, redirectUri });
  } catch (err: any) {
    console.error('Error constructing OAuth URL:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate OAuth URL.' });
  }
});

// 5. OAuth Callback Handler with postMessage (handles both trailing slash variations)
app.get(['/auth/callback', '/auth/callback/'], async (req: Request, res: Response) => {
  const { code, state, error: oauthError, error_description } = req.query;

  // Handle provider cancellation / refusal
  if (oauthError) {
    const errText = (error_description as string) || (oauthError as string) || 'Authentication denied.';
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Cancelled</title></head>
        <body style="font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; padding: 24px; background: #18181b; border: 1px solid #27272a; border-radius: 12px; max-width: 400px;">
            <p style="color: #f87171; font-weight: 600; margin: 0 0 8px;">Authentication Cancelled</p>
            <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 16px;">${errText}</p>
            <button onclick="window.close()" style="background: #27272a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Close Window</button>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errText)} }, '*');
              }
              setTimeout(() => window.close(), 2500);
            </script>
          </div>
        </body>
      </html>
    `);
  }

  if (!code || !state) {
    return res.status(400).send('Missing code or state in OAuth callback.');
  }

  try {
    // Parse platform and session token from state (e.g. "instagram:3c9e9faa...")
    const stateStr = state as string;
    const parts = stateStr.split(':');
    let platform: SocialPlatform = 'instagram';
    let sessionToken = stateStr;

    if (parts.length >= 2 && ['instagram', 'linkedin', 'facebook'].includes(parts[0])) {
      platform = parts[0] as SocialPlatform;
      sessionToken = parts.slice(1).join(':');
    }

    const user = db.getUserBySession(sessionToken) || db.findUserById(sessionToken);
    if (!user) {
      throw new Error('Authentication session expired. Please sign in again.');
    }

    const redirectUri = getOAuthRedirectUri(req);
    await socialManager.handleCallback(platform, code as string, redirectUri, user.id);

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Connection Successful</title></head>
        <body style="font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; padding: 28px; background: #18181b; border: 1px solid #27272a; border-radius: 12px; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);">
            <div style="width: 40px; height: 40px; background: #064e3b; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; color: #34d399; font-size: 20px;">✓</div>
            <h3 style="margin: 0 0 6px; color: #f4f4f5; font-size: 16px;">${platform.toUpperCase()} Connected!</h3>
            <p style="margin: 0; color: #a1a1aa; font-size: 13px;">Your account has been securely connected. This window will close automatically.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: ${JSON.stringify(platform)} }, '*');
                setTimeout(() => window.close(), 800);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 1000);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('OAuth Callback processing error:', err);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Connection Error</title></head>
        <body style="font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; padding: 24px; background: #18181b; border: 1px solid #27272a; border-radius: 12px; max-width: 400px;">
            <p style="color: #f87171; font-weight: 600; margin: 0 0 8px;">Connection Failed</p>
            <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 16px;">${err.message || 'Failed to exchange authorization token.'}</p>
            <button onclick="window.close()" style="background: #27272a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Close Window</button>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(err.message)} }, '*');
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }
});

// 6. Publish to Social Media (single or multi-platform)
app.post('/api/social/publish', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { platforms, content, originalPrompt } = req.body;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'At least one target social platform is required.' });
    }

    if (!content || (typeof content.text !== 'string' && typeof content.caption !== 'string' && !content.imageUrl)) {
      return res.status(400).json({ error: 'Post content (text, caption, or image) is required.' });
    }

    const { results, publishRecordId } = await socialManager.publishToPlatforms(
      req.user!.id,
      platforms as SocialPlatform[],
      content,
      originalPrompt
    );

    return res.json({
      success: true,
      results,
      publishRecordId,
    });
  } catch (err: any) {
    console.error('Social publish error:', err);
    return res.status(400).json({ error: err.message || 'Failed to publish to social media.' });
  }
});

// 7. Get Social Media publishing history
app.get('/api/social/history', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const history = db.getSocialPublishes(req.user!.id);
    return res.json({ history });
  } catch (err: any) {
    console.error('Error fetching social publish history:', err);
    return res.status(500).json({ error: 'Failed to retrieve social history.' });
  }
});

// 8. Delete Social Media publishing history item
app.delete('/api/social/history/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const deleted = db.deleteSocialPublish(req.params.id, req.user!.id);
    return res.json({ success: deleted });
  } catch (err: any) {
    console.error('Error deleting social publish item:', err);
    return res.status(500).json({ error: 'Failed to delete history item.' });
  }
});

// --- SETTINGS ROUTES ---

app.get('/api/settings', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json({ settings: req.user!.settings || {} });
});

app.put('/api/settings', requireAuth, (req: AuthRequest, res: Response) => {
  const { settings } = req.body;
  const updatedUser = db.updateUserSettings(req.user!.id, settings || {});
  return res.json({ settings: updatedUser?.settings || {} });
});

// --- VITE MIDDLEWARE / STATIC ASSETS ---

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PromptStudio AI Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

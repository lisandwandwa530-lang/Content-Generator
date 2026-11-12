import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { SocialAccount, SocialPlatform } from '../../types.ts';
import {
  Settings,
  User,
  Shield,
  Sliders,
  Trash2,
  LogOut,
  Save,
  Check,
  Cpu,
  Share2,
  Instagram,
  Linkedin,
  Facebook,
  ExternalLink,
  Key,
} from 'lucide-react';

export function SettingsView() {
  const { user, updateSettings, logout } = useAuth();
  const { success, error } = useToast();

  const [defaultLanguage, setDefaultLanguage] = useState(
    user?.settings?.defaultCodeLanguage || 'TypeScript'
  );
  const [defaultAspectRatio, setDefaultAspectRatio] = useState(
    user?.settings?.defaultImageAspectRatio || '1:1'
  );
  const [autoSaveHistory, setAutoSaveHistory] = useState(
    user?.settings?.autoSaveHistory !== false
  );
  const [saving, setSaving] = useState(false);

  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);

  useEffect(() => {
    loadSocialAccounts();
  }, []);

  const loadSocialAccounts = async () => {
    setLoadingSocial(true);
    try {
      const res = await api.getSocialAccounts();
      setSocialAccounts(res.accounts || []);
    } catch {
      // ignore
    } finally {
      setLoadingSocial(false);
    }
  };

  const handleDisconnectSocial = async (platform: SocialPlatform) => {
    if (!confirm(`Disconnect ${platform.toUpperCase()}?`)) return;
    try {
      await api.disconnectSocialAccount(platform);
      success(`${platform.toUpperCase()} disconnected.`);
      loadSocialAccounts();
    } catch {
      error(`Failed to disconnect ${platform}.`);
    }
  };

  const handleConnectSocialOAuth = async (platform: SocialPlatform) => {
    try {
      const { url } = await api.getSocialOAuthUrl(platform);
      window.open(url, `${platform}_oauth`, 'width=650,height=750');
    } catch (err: any) {
      error(err.message || 'Failed to start OAuth.');
    }
  };

  const getAccount = (platform: SocialPlatform) => socialAccounts.find((a) => a.platform === platform);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        defaultCodeLanguage: defaultLanguage,
        defaultImageAspectRatio: defaultAspectRatio,
        autoSaveHistory,
      });
      success('Workspace settings saved');
    } catch {
      error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to permanently clear your generation history?')) return;
    try {
      await api.clearHistory();
      success('Generation history cleared');
    } catch {
      error('Failed to clear history');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Account Info Card */}
      <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-semibold text-neutral-200">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-100">{user?.name || 'Studio User'}</h2>
            <p className="text-xs text-neutral-400">{user?.email}</p>
          </div>
        </div>

        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-neutral-500 block mb-1">Account ID</span>
            <span className="font-mono text-neutral-300">{user?.id}</span>
          </div>
          <div>
            <span className="text-neutral-500 block mb-1">Registered Since</span>
            <span className="text-neutral-300">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Social Media Connections Card */}
      <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-neutral-100">Social Media Connections</h2>
          </div>
          <span className="text-xs text-neutral-500">Instagram · LinkedIn · Facebook</span>
        </div>

        <p className="text-xs text-neutral-400">
          Connect your social media accounts to publish generated text, images, and captions directly with live previews.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Instagram */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-semibold text-neutral-200">Instagram</span>
                </div>
                {getAccount('instagram') ? (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300">
                    Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-neutral-800 text-neutral-400">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 truncate">
                {getAccount('instagram')?.accountName || 'Meta Graph API Feed publishing'}
              </p>
            </div>

            {getAccount('instagram') ? (
              <button
                type="button"
                onClick={() => handleDisconnectSocial('instagram')}
                className="w-full py-1.5 text-xs text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleConnectSocialOAuth('instagram')}
                className="w-full py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                Connect Instagram
              </button>
            )}
          </div>

          {/* LinkedIn */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-neutral-200">LinkedIn</span>
                </div>
                {getAccount('linkedin') ? (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300">
                    Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-neutral-800 text-neutral-400">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 truncate">
                {getAccount('linkedin')?.accountName || 'LinkedIn Member Social posts'}
              </p>
            </div>

            {getAccount('linkedin') ? (
              <button
                type="button"
                onClick={() => handleDisconnectSocial('linkedin')}
                className="w-full py-1.5 text-xs text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleConnectSocialOAuth('linkedin')}
                className="w-full py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                Connect LinkedIn
              </button>
            )}
          </div>

          {/* Facebook */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-neutral-200">Facebook</span>
                </div>
                {getAccount('facebook') ? (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300">
                    Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-neutral-800 text-neutral-400">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 truncate">
                {getAccount('facebook')?.accountName || 'Pages & feed publishing'}
              </p>
            </div>

            {getAccount('facebook') ? (
              <button
                type="button"
                onClick={() => handleDisconnectSocial('facebook')}
                className="w-full py-1.5 text-xs text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleConnectSocialOAuth('facebook')}
                className="w-full py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                Connect Facebook
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Generation Defaults */}
      <form onSubmit={handleSaveSettings} className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-neutral-100">Generation Defaults</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Default Code Language
            </label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="TypeScript">TypeScript</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Python">Python</option>
              <option value="Rust">Rust</option>
              <option value="Go">Go</option>
              <option value="SQL">SQL</option>
              <option value="HTML/CSS">HTML / CSS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Default Image Aspect Ratio
            </label>
            <select
              value={defaultAspectRatio}
              onChange={(e) => setDefaultAspectRatio(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="1:1">1:1 (Square)</option>
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="4:3">4:3 (Standard)</option>
              <option value="3:4">3:4 (Tall)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <input
            type="checkbox"
            id="autosave"
            checked={autoSaveHistory}
            onChange={(e) => setAutoSaveHistory(e.target.checked)}
            className="rounded bg-neutral-950 border-neutral-700 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="autosave" className="text-xs text-neutral-300 cursor-pointer">
            Automatically save generations to history
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>

      {/* Model & System Capabilities */}
      <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-neutral-100">AI Model & Studio Core</h2>
        </div>
        <div className="space-y-2 text-xs text-neutral-400">
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/60">
            <span>Text Engine</span>
            <span className="font-mono text-neutral-200">Gemini 3.8 Flash (Server-Side)</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/60">
            <span>Code Engine</span>
            <span className="font-mono text-neutral-200">Gemini 3.8 Flash</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/60">
            <span>Image Engine</span>
            <span className="font-mono text-neutral-200">Gemini 3.1 Flash Lite Image + Vector Fallback</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span>API Telemetry Header</span>
            <span className="font-mono text-neutral-200">aistudio-build</span>
          </div>
        </div>
      </div>

      {/* Danger Zone & Logout */}
      <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-rose-400">Workspace Actions</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div>
            <p className="text-xs font-medium text-neutral-200">Clear Generation History</p>
            <p className="text-xs text-neutral-500">Permanently delete all saved text, image, and code outputs.</p>
          </div>
          <button
            type="button"
            onClick={handleClearHistory}
            className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-white hover:bg-rose-600/20 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
          >
            Clear All History
          </button>
        </div>

        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <p className="text-xs text-neutral-400">Sign out of your active session on this device.</p>
          <button
            type="button"
            onClick={() => logout()}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

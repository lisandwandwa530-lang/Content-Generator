import React, { useState, useEffect } from 'react';
import { SocialPlatform, SocialAccount, SocialPublishItem, PlatformPublishResult } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { PlatformPreviewCard } from './PlatformPreviewCard.tsx';
import {
  Share2,
  Instagram,
  Linkedin,
  Facebook,
  CheckCircle2,
  AlertCircle,
  Key,
  Trash2,
  Send,
  ExternalLink,
  Plus,
  RefreshCw,
  Copy,
  Info,
  Calendar,
  Layers,
  X,
} from 'lucide-react';

interface SocialMediaViewProps {
  onOpenPublishModal?: (initialText?: string, initialImage?: string) => void;
}

export function SocialMediaView({ onOpenPublishModal }: SocialMediaViewProps) {
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'accounts' | 'compose' | 'history'>('accounts');

  // Accounts state
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Direct Token Connection Modal
  const [tokenModal, setTokenModal] = useState<{
    isOpen: boolean;
    platform: SocialPlatform;
    token: string;
    accountName: string;
    accountId: string;
    pageId: string;
  }>({
    isOpen: false,
    platform: 'instagram',
    token: '',
    accountName: '',
    accountId: '',
    pageId: '',
  });

  // Compose State
  const [composePlatforms, setComposePlatforms] = useState<SocialPlatform[]>(['linkedin']);
  const [composeText, setComposeText] = useState('');
  const [composeImageUrl, setComposeImageUrl] = useState('');
  const [composeHashtags, setComposeHashtags] = useState('');
  const [activePreviewPlatform, setActivePreviewPlatform] = useState<SocialPlatform>('linkedin');
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastResults, setLastResults] = useState<PlatformPublishResult[] | null>(null);

  // History State
  const [history, setHistory] = useState<SocialPublishItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // OAuth popup listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin &&
        !event.origin.endsWith('.run.app') &&
        !event.origin.includes('localhost') &&
        !event.origin.includes('127.0.0.1')
      ) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const platform = event.data?.platform;
        success(`Successfully connected ${platform ? platform.toUpperCase() : 'social'} account!`);
        loadAccounts();
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        error(`Connection failed: ${event.data.error || 'Authentication error'}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    loadAccounts();
    loadHistory();
  }, []);

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await api.getSocialAccounts();
      setAccounts(res.accounts || []);
    } catch {
      // ignore
    } finally {
      setLoadingAccounts(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getSocialHistory();
      setHistory(res.history || []);
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  // Connect via official OAuth Popup
  const handleConnectOAuth = async (platform: SocialPlatform) => {
    try {
      const { url } = await api.getSocialOAuthUrl(platform);
      const authWindow = window.open(
        url,
        `${platform}_oauth_popup`,
        'width=650,height=750,toolbar=no,menubar=no,location=no,status=no'
      );

      if (!authWindow) {
        error('Popup blocked by browser. Please allow popups for this site to connect your account.');
      } else {
        info(`Connecting to ${platform.toUpperCase()}... Please complete authorization in the popup window.`);
      }
    } catch (err: any) {
      error(err.message || `Failed to initiate ${platform} OAuth.`);
    }
  };

  // Connect via Direct Token
  const handleConnectDirectToken = async () => {
    if (!tokenModal.token.trim()) {
      error('Please enter an access token.');
      return;
    }

    try {
      await api.connectSocialAccount(tokenModal.platform, {
        accessToken: tokenModal.token.trim(),
        accountName: tokenModal.accountName.trim() || undefined,
        accountId: tokenModal.accountId.trim() || undefined,
        pageId: tokenModal.pageId.trim() || undefined,
      });

      success(`${tokenModal.platform.toUpperCase()} connected successfully!`);
      setTokenModal((prev) => ({ ...prev, isOpen: false, token: '' }));
      loadAccounts();
    } catch (err: any) {
      error(err.message || 'Failed to connect token.');
    }
  };

  // Disconnect account
  const handleDisconnect = async (platform: SocialPlatform) => {
    if (!confirm(`Are you sure you want to disconnect ${platform.toUpperCase()}?`)) return;
    try {
      await api.disconnectSocialAccount(platform);
      success(`${platform.toUpperCase()} disconnected.`);
      loadAccounts();
    } catch (err: any) {
      error(err.message || 'Failed to disconnect account.');
    }
  };

  // Publish from Compose Tab
  const handlePublishCompose = async () => {
    if (composePlatforms.length === 0) {
      error('Please select at least one social media platform.');
      return;
    }

    if (composePlatforms.includes('instagram') && !composeImageUrl) {
      error('Instagram Graph API strictly requires an image. Please attach an image.');
      setActivePreviewPlatform('instagram');
      return;
    }

    setIsPublishing(true);
    setLastResults(null);

    const parsedTags = composeHashtags
      .split(/[,\s]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    try {
      const res = await api.publishToSocial({
        platforms: composePlatforms,
        content: {
          text: composeText,
          caption: composeText,
          imageUrl: composeImageUrl || undefined,
          hashtags: parsedTags,
        },
      });

      setLastResults(res.results || []);
      const anySuccess = res.results.some((r) => r.status === 'success');
      if (anySuccess) {
        success('Published successfully!');
        loadHistory();
      } else {
        error('Publishing failed. Review individual platform statuses.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to publish.');
    } finally {
      setIsPublishing(false);
    }
  };

  const getAccount = (platform: SocialPlatform) => accounts.find((a) => a.platform === platform);

  const devCallbackUrl = 'https://ais-dev-ichtoclkgcxtoynnewp4pm-280010297224.europe-west2.run.app/auth/callback';
  const sharedCallbackUrl = 'https://ais-pre-ichtoclkgcxtoynnewp4pm-280010297224.europe-west2.run.app/auth/callback';

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-neutral-100">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Social Media Integration</h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Securely connect and distribute AI-crafted content to Instagram, LinkedIn, and Facebook
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'accounts'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Connected Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'compose'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Compose & Publish
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Publish History ({history.length})
          </button>
        </div>
      </div>

      {/* TAB 1: CONNECTED ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Instagram */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Instagram className="w-5 h-5" />
                  </div>
                  {getAccount('instagram') ? (
                    <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Connected
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-neutral-800 text-neutral-400">
                      Not Connected
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white">Instagram</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Meta Instagram Graph API for publishing feed photos, carousels & captions with hashtags.
                  </p>
                </div>

                {getAccount('instagram') && (
                  <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1 text-xs">
                    <div className="font-medium text-neutral-200 truncate">
                      {getAccount('instagram')?.accountName}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      ID: {getAccount('instagram')?.accountId}
                    </div>
                    <div className="text-[10px] text-neutral-500 flex items-center gap-1 pt-1">
                      <Calendar className="w-3 h-3" />
                      <span>Connected {new Date(getAccount('instagram')!.connectedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center gap-2">
                {getAccount('instagram') ? (
                  <button
                    onClick={() => handleDisconnect('instagram')}
                    className="w-full py-2 px-3 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleConnectOAuth('instagram')}
                      className="flex-1 py-2 px-3 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
                    <button
                      onClick={() =>
                        setTokenModal({
                          isOpen: true,
                          platform: 'instagram',
                          token: '',
                          accountName: '',
                          accountId: '',
                          pageId: '',
                        })
                      }
                      title="Connect with Direct Access Token"
                      className="p-2 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 2. LinkedIn */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Linkedin className="w-5 h-5" />
                  </div>
                  {getAccount('linkedin') ? (
                    <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Connected
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-neutral-800 text-neutral-400">
                      Not Connected
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white">LinkedIn</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    LinkedIn Member Social API for personal profiles & organization feed posts with media attachments.
                  </p>
                </div>

                {getAccount('linkedin') && (
                  <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1 text-xs">
                    <div className="font-medium text-neutral-200 truncate">
                      {getAccount('linkedin')?.accountName}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      ID: {getAccount('linkedin')?.accountId}
                    </div>
                    <div className="text-[10px] text-neutral-500 flex items-center gap-1 pt-1">
                      <Calendar className="w-3 h-3" />
                      <span>Connected {new Date(getAccount('linkedin')!.connectedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center gap-2">
                {getAccount('linkedin') ? (
                  <button
                    onClick={() => handleDisconnect('linkedin')}
                    className="w-full py-2 px-3 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleConnectOAuth('linkedin')}
                      className="flex-1 py-2 px-3 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
                    <button
                      onClick={() =>
                        setTokenModal({
                          isOpen: true,
                          platform: 'linkedin',
                          token: '',
                          accountName: '',
                          accountId: '',
                          pageId: '',
                        })
                      }
                      title="Connect with Direct Access Token"
                      className="p-2 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 3. Facebook */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Facebook className="w-5 h-5" />
                  </div>
                  {getAccount('facebook') ? (
                    <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Connected
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-neutral-800 text-neutral-400">
                      Not Connected
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white">Facebook</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Meta Facebook Graph API for Pages and profile feeds supporting text updates & photo uploads.
                  </p>
                </div>

                {getAccount('facebook') && (
                  <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-1 text-xs">
                    <div className="font-medium text-neutral-200 truncate">
                      {getAccount('facebook')?.accountName}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      ID: {getAccount('facebook')?.accountId}
                    </div>
                    <div className="text-[10px] text-neutral-500 flex items-center gap-1 pt-1">
                      <Calendar className="w-3 h-3" />
                      <span>Connected {new Date(getAccount('facebook')!.connectedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center gap-2">
                {getAccount('facebook') ? (
                  <button
                    onClick={() => handleDisconnect('facebook')}
                    className="w-full py-2 px-3 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleConnectOAuth('facebook')}
                      className="flex-1 py-2 px-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Facebook className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
                    <button
                      onClick={() =>
                        setTokenModal({
                          isOpen: true,
                          platform: 'facebook',
                          token: '',
                          accountName: '',
                          accountId: '',
                          pageId: '',
                        })
                      }
                      title="Connect with Direct Access Token"
                      className="p-2 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Setup & Documentation Card */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-neutral-200 font-semibold">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>OAuth & Developer Credentials Setup</span>
            </div>

            <p className="text-neutral-400 leading-relaxed">
              When configuring your app inside the Meta Developer Portal or LinkedIn Developer Portal, set these exact Redirect / Callback URLs:
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-[11px] text-neutral-300">
                <span className="truncate mr-2"><strong className="text-neutral-500 font-sans">Development Callback:</strong> {devCallbackUrl}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(devCallbackUrl);
                    success('Copied Development URL to clipboard');
                  }}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl font-mono text-[11px] text-neutral-300">
                <span className="truncate mr-2"><strong className="text-neutral-500 font-sans">Shared App Callback:</strong> {sharedCallbackUrl}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sharedCallbackUrl);
                    success('Copied Shared App URL to clipboard');
                  }}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px] text-neutral-400">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80">
                <span className="font-semibold text-neutral-200 block mb-1">Instagram Permissions:</span>
                <code>instagram_basic, instagram_content_publish, pages_show_list</code>
              </div>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80">
                <span className="font-semibold text-neutral-200 block mb-1">LinkedIn Permissions:</span>
                <code>openid, profile, w_member_social</code>
              </div>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80">
                <span className="font-semibold text-neutral-200 block mb-1">Facebook Permissions:</span>
                <code>pages_manage_posts, pages_read_engagement, public_profile</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPOSE & PUBLISH */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-5">
            {/* Multi-platform selection */}
            <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Select Platforms to Publish:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['instagram', 'linkedin', 'facebook'] as const).map((p) => {
                    const isSelected = composePlatforms.includes(p);
                    const isConnected = !!getAccount(p);

                    return (
                      <div
                        key={p}
                        onClick={() => {
                          setComposePlatforms((prev) =>
                            prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                          );
                          setActivePreviewPlatform(p);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          {p === 'instagram' && <Instagram className="w-4 h-4 text-rose-400" />}
                          {p === 'linkedin' && <Linkedin className="w-4 h-4 text-blue-400" />}
                          {p === 'facebook' && <Facebook className="w-4 h-4 text-indigo-400" />}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-medium capitalize">{p}</div>
                          <div className="text-[10px] text-neutral-500">
                            {isConnected ? 'Connected' : 'Not Connected'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Text / Caption */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-neutral-300">Post Text / Caption</label>
                  <span className="text-[11px] text-neutral-500">{composeText.length} characters</span>
                </div>
                <textarea
                  rows={6}
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  placeholder="Draft your social media message or caption..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Image URL / Asset */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Attached Image (Required for Instagram)
                </label>
                <input
                  type="text"
                  value={composeImageUrl}
                  onChange={(e) => setComposeImageUrl(e.target.value)}
                  placeholder="Paste image URL (https://...) or data URL..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                />
                {composeImageUrl && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-neutral-950 border border-neutral-800 rounded-xl">
                    <img src={composeImageUrl} alt="Preview" className="w-12 h-12 rounded object-cover" />
                    <span className="text-xs text-neutral-400 truncate flex-1">Image Loaded</span>
                    <button
                      onClick={() => setComposeImageUrl('')}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer px-2"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Optional Hashtags */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Optional Hashtags
                </label>
                <input
                  type="text"
                  value={composeHashtags}
                  onChange={(e) => setComposeHashtags(e.target.value)}
                  placeholder="e.g. AI, ContentCreation, Tech"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Publish Action */}
              <button
                type="button"
                onClick={handlePublishCompose}
                disabled={isPublishing || composePlatforms.length === 0}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Distributing to Social Platforms...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publish to {composePlatforms.length} Platform{composePlatforms.length > 1 ? 's' : ''}</span>
                  </>
                )}
              </button>
            </div>

            {/* Publish Results Feedback */}
            {lastResults && (
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Last Distribution Run
                </h4>
                {lastResults.map((r) => (
                  <div
                    key={r.platform}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      r.status === 'success'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {r.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span className="font-semibold capitalize">{r.platform}:</span>
                      <span>{r.status === 'success' ? 'Published' : r.error}</span>
                    </div>
                    {r.postUrl && (
                      <a href={r.postUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Platform Mockup Switcher */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Interactive Social Preview
              </span>
              <div className="flex items-center gap-1">
                {(['instagram', 'linkedin', 'facebook'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setActivePreviewPlatform(p)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      activePreviewPlatform === p
                        ? 'bg-neutral-800 text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-2xl min-h-[460px] flex items-center justify-center">
              <PlatformPreviewCard
                platform={activePreviewPlatform}
                account={getAccount(activePreviewPlatform)}
                text={composeText}
                caption={composeText}
                imageUrl={composeImageUrl}
                hashtags={composeHashtags.split(/[,\s]+/)}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PUBLISHING HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-400">
              Complete archive of previous social media distributions across Instagram, LinkedIn, and Facebook
            </p>
            <button
              onClick={loadHistory}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500 space-y-2">
              <Layers className="w-10 h-10 mx-auto opacity-30 text-indigo-400" />
              <h3 className="text-sm font-semibold text-neutral-300">No Publications Yet</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Generate text or images and click "Publish to Social Media" to start distributing your content.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-neutral-700 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.platforms.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md bg-neutral-800 text-neutral-300"
                        >
                          {p}
                        </span>
                      ))}
                      <span className="text-xs text-neutral-500">·</span>
                      <span className="text-xs text-neutral-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={async () => {
                        await api.deleteSocialHistoryItem(item.id);
                        loadHistory();
                        success('Publication item removed');
                      }}
                      className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed">
                    {item.content.text || item.content.caption}
                  </p>

                  {item.content.imageUrl && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-neutral-800">
                      <img src={item.content.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Individual platform results */}
                  <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center gap-3">
                    {item.results.map((r) => (
                      <div key={r.platform} className="flex items-center gap-1.5 text-[11px]">
                        <span className={`w-2 h-2 rounded-full ${
                          r.status === 'success' ? 'bg-emerald-400' : 'bg-rose-400'
                        }`} />
                        <span className="capitalize font-medium text-neutral-300">{r.platform}:</span>
                        <span className={r.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}>
                          {r.status === 'success' ? 'Delivered' : 'Failed'}
                        </span>
                        {r.postUrl && (
                          <a href={r.postUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline ml-1">
                            Link
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DIRECT ACCESS TOKEN CONNECTION MODAL */}
      {tokenModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white capitalize">
                  Connect {tokenModal.platform} Token
                </h3>
              </div>
              <button
                onClick={() => setTokenModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Paste your Meta Graph Access Token or LinkedIn Developer Bearer Token directly. This token is securely encrypted and stored only on your server.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Access Token (Required)
                </label>
                <textarea
                  rows={3}
                  value={tokenModal.token}
                  onChange={(e) => setTokenModal((prev) => ({ ...prev, token: e.target.value }))}
                  placeholder="EAA... or AQX..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Display Account Name / Handle
                </label>
                <input
                  type="text"
                  value={tokenModal.accountName}
                  onChange={(e) => setTokenModal((prev) => ({ ...prev, accountName: e.target.value }))}
                  placeholder={tokenModal.platform === 'instagram' ? '@my_brand' : 'Company or Personal Name'}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {tokenModal.platform === 'instagram' && (
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Instagram Business Account ID
                  </label>
                  <input
                    type="text"
                    value={tokenModal.accountId}
                    onChange={(e) => setTokenModal((prev) => ({ ...prev, accountId: e.target.value }))}
                    placeholder="17841400000000000"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              {tokenModal.platform === 'facebook' && (
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Facebook Page ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={tokenModal.pageId}
                    onChange={(e) => setTokenModal((prev) => ({ ...prev, pageId: e.target.value }))}
                    placeholder="100000000000000"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTokenModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConnectDirectToken}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors cursor-pointer"
              >
                Connect Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { SocialPlatform, SocialAccount, PlatformPublishResult } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { PlatformPreviewCard } from './PlatformPreviewCard.tsx';
import {
  X,
  Send,
  Instagram,
  Linkedin,
  Facebook,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Sliders,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  initialImageUrl?: string;
  originalPrompt?: string;
  onSuccess?: () => void;
  onNavigateToSocialSettings?: () => void;
}

export function PublishModal({
  isOpen,
  onClose,
  initialText = '',
  initialImageUrl,
  originalPrompt,
  onSuccess,
  onNavigateToSocialSettings,
}: PublishModalProps) {
  const { success, error, info } = useToast();

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Platform selection state
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['linkedin']);
  const [activePreviewTab, setActivePreviewTab] = useState<SocialPlatform>('linkedin');
  const [editPlatformTab, setEditPlatformTab] = useState<'all' | SocialPlatform>('all');

  // Content editing state
  const [commonText, setCommonText] = useState(initialText);
  const [commonImageUrl, setCommonImageUrl] = useState(initialImageUrl || '');

  // Platform-specific overrides
  const [igCaption, setIgCaption] = useState(initialText);
  const [igHashtags, setIgHashtags] = useState<string>('');

  const [liText, setLiText] = useState(initialText);
  const [liHashtags, setLiHashtags] = useState<string>('');

  const [fbText, setFbText] = useState(initialText);

  // Optional toggles (strictly optional per requirements)
  const [autoAddHashtags, setAutoAddHashtags] = useState(false);

  // Workflow states: 'draft' | 'preview_confirm' | 'publishing' | 'result'
  const [stage, setStage] = useState<'draft' | 'preview_confirm' | 'publishing' | 'result'>('draft');
  const [publishResults, setPublishResults] = useState<PlatformPublishResult[]>([]);

  // Load connected accounts
  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      setCommonText(initialText);
      setIgCaption(initialText);
      setLiText(initialText);
      setFbText(initialText);
      setCommonImageUrl(initialImageUrl || '');
      setStage('draft');
      setPublishResults([]);
    }
  }, [isOpen, initialText, initialImageUrl]);

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await api.getSocialAccounts();
      setAccounts(res.accounts || []);

      // Pre-select platforms that are connected
      const connected = res.accounts.filter((a) => a.status === 'connected').map((a) => a.platform);
      if (connected.length > 0) {
        setSelectedPlatforms(connected);
        setActivePreviewTab(connected[0]);
      } else {
        setSelectedPlatforms(['linkedin']);
        setActivePreviewTab('linkedin');
      }
    } catch {
      // Fallback
    } finally {
      setLoadingAccounts(false);
    }
  };

  if (!isOpen) return null;

  const togglePlatform = (p: SocialPlatform) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(p)) {
        const next = prev.filter((item) => item !== p);
        if (activePreviewTab === p && next.length > 0) {
          setActivePreviewTab(next[0]);
        }
        return next;
      } else {
        const next = [...prev, p];
        setActivePreviewTab(p);
        return next;
      }
    });
  };

  const getAccountForPlatform = (p: SocialPlatform) => accounts.find((a) => a.platform === p);

  // Validation before preview confirm
  const handleProceedToPreview = () => {
    if (selectedPlatforms.length === 0) {
      error('Please select at least one social media platform.');
      return;
    }

    // Verify Instagram requirement: MUST have an image
    if (selectedPlatforms.includes('instagram') && !commonImageUrl) {
      error('Instagram Graph API strictly requires an image attachment. Please attach or generate an image.');
      setActivePreviewTab('instagram');
      return;
    }

    setStage('preview_confirm');
  };

  // Perform publishing
  const handleExecutePublish = async () => {
    setStage('publishing');

    // Parse hashtags
    const parsedIgTags = igHashtags
      .split(/[,\s]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const parsedLiTags = liHashtags
      .split(/[,\s]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    try {
      const res = await api.publishToSocial({
        platforms: selectedPlatforms,
        content: {
          text: commonText,
          caption: commonText,
          imageUrl: commonImageUrl || undefined,
          platformOverrides: {
            instagram: {
              caption: igCaption || commonText,
              imageUrl: commonImageUrl || undefined,
              hashtags: parsedIgTags,
            },
            linkedin: {
              text: liText || commonText,
              imageUrl: commonImageUrl || undefined,
              hashtags: parsedLiTags,
            },
            facebook: {
              text: fbText || commonText,
              imageUrl: commonImageUrl || undefined,
            },
          },
        },
        originalPrompt,
      });

      setPublishResults(res.results || []);
      setStage('result');

      const allSuccess = res.results.every((r) => r.status === 'success');
      const anySuccess = res.results.some((r) => r.status === 'success');

      if (allSuccess) {
        success('Published successfully to all selected platforms!');
        onSuccess?.();
      } else if (anySuccess) {
        info('Published to some platforms with warnings.');
        onSuccess?.();
      } else {
        error('Publishing failed. Please check platform error messages below.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to publish to social media.');
      setStage('preview_confirm');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Publish to Social Media</h2>
              <p className="text-xs text-neutral-400">
                Instagram · LinkedIn · Facebook
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Progress Steps */}
        <div className="px-6 py-2.5 bg-neutral-950/40 border-b border-neutral-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              stage === 'draft' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}>1</span>
            <span className={stage === 'draft' ? 'text-white font-medium' : 'text-neutral-400'}>Select & Edit</span>
          </div>
          <span className="text-neutral-700">→</span>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              stage === 'preview_confirm' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}>2</span>
            <span className={stage === 'preview_confirm' ? 'text-white font-medium' : 'text-neutral-400'}>Preview & Confirm</span>
          </div>
          <span className="text-neutral-700">→</span>
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              stage === 'result' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'
            }`}>3</span>
            <span className={stage === 'result' ? 'text-emerald-400 font-medium' : 'text-neutral-400'}>Status Results</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STAGE 1: DRAFT & PLATFORM SELECTION */}
          {stage === 'draft' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Platform Selector & Common Content */}
              <div className="lg:col-span-6 space-y-5">
                {/* Platform Toggles */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Publish To:
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Instagram */}
                    <div
                      onClick={() => togglePlatform('instagram')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                        selectedPlatforms.includes('instagram')
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Instagram className="w-5 h-5" />
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes('instagram')}
                          onChange={() => {}}
                          className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-medium">Instagram</div>
                        <div className="text-[10px] text-neutral-500 truncate">
                          {getAccountForPlatform('instagram')?.accountName || 'Needs connection'}
                        </div>
                      </div>
                    </div>

                    {/* LinkedIn */}
                    <div
                      onClick={() => togglePlatform('linkedin')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                        selectedPlatforms.includes('linkedin')
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Linkedin className="w-5 h-5" />
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes('linkedin')}
                          onChange={() => {}}
                          className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-medium">LinkedIn</div>
                        <div className="text-[10px] text-neutral-500 truncate">
                          {getAccountForPlatform('linkedin')?.accountName || 'Needs connection'}
                        </div>
                      </div>
                    </div>

                    {/* Facebook */}
                    <div
                      onClick={() => togglePlatform('facebook')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                        selectedPlatforms.includes('facebook')
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Facebook className="w-5 h-5" />
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes('facebook')}
                          onChange={() => {}}
                          className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-medium">Facebook</div>
                        <div className="text-[10px] text-neutral-500 truncate">
                          {getAccountForPlatform('facebook')?.accountName || 'Needs connection'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Editor with Platform Specific Fields */}
                <div className="space-y-4">
                  {/* Platform Sub-tabs for content customization */}
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Edit Content:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditPlatformTab('all')}
                        className={`px-2 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                          editPlatformTab === 'all'
                            ? 'bg-neutral-800 text-white'
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        All Platforms
                      </button>
                      {(['instagram', 'linkedin', 'facebook'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setEditPlatformTab(p);
                            setActivePreviewTab(p);
                          }}
                          className={`px-2 py-1 text-xs rounded-md font-medium capitalize transition-colors cursor-pointer ${
                            editPlatformTab === p
                              ? 'bg-indigo-600 text-white'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mode: ALL PLATFORMS */}
                  {editPlatformTab === 'all' && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-medium text-neutral-300">
                            Base Content (Applies to all networks)
                          </label>
                          <span className="text-[11px] text-neutral-500">
                            {commonText.length} characters
                          </span>
                        </div>
                        <textarea
                          rows={5}
                          value={commonText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCommonText(val);
                            setIgCaption(val);
                            setLiText(val);
                            setFbText(val);
                          }}
                          placeholder="Write or review your post content..."
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                        />
                      </div>
                    </div>
                  )}

                  {/* Mode: INSTAGRAM SPECIFIC */}
                  {editPlatformTab === 'instagram' && (
                    <div className="space-y-3 bg-rose-950/10 border border-rose-500/20 p-3.5 rounded-xl">
                      <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                        <Instagram className="w-4 h-4" />
                        <span>Instagram Post Fields</span>
                      </div>

                      {/* Instagram Caption */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-neutral-300">
                            Caption *
                          </label>
                          <span className="text-[11px] text-neutral-500">
                            {igCaption.length} / 2200 characters
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          value={igCaption}
                          onChange={(e) => setIgCaption(e.target.value)}
                          placeholder="Enter Instagram caption..."
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-rose-500 resize-none font-sans"
                        />
                      </div>

                      {/* Instagram Hashtags */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Hashtags (Optional, separated by spaces or commas)
                        </label>
                        <input
                          type="text"
                          value={igHashtags}
                          onChange={(e) => setIgHashtags(e.target.value)}
                          placeholder="e.g. AI PromptEngineering Design"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-rose-500"
                        />
                        <p className="text-[10px] text-neutral-500 mt-1">
                          No automatic hashtags added unless explicitly typed above.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mode: LINKEDIN SPECIFIC */}
                  {editPlatformTab === 'linkedin' && (
                    <div className="space-y-3 bg-blue-950/10 border border-blue-500/20 p-3.5 rounded-xl">
                      <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                        <Linkedin className="w-4 h-4" />
                        <span>LinkedIn Post Fields</span>
                      </div>

                      {/* LinkedIn Post Text */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-neutral-300">
                            Post Text *
                          </label>
                          <span className="text-[11px] text-neutral-500">
                            {liText.length} / 3000 characters
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          value={liText}
                          onChange={(e) => setLiText(e.target.value)}
                          placeholder="Enter LinkedIn post text..."
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500 resize-none font-sans"
                        />
                      </div>

                      {/* LinkedIn Optional Hashtags */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Optional Hashtags (separated by spaces or commas)
                        </label>
                        <input
                          type="text"
                          value={liHashtags}
                          onChange={(e) => setLiHashtags(e.target.value)}
                          placeholder="e.g. Innovation Leadership Tech"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-[10px] text-neutral-500 mt-1">
                          Optional. Only added if specified.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mode: FACEBOOK SPECIFIC */}
                  {editPlatformTab === 'facebook' && (
                    <div className="space-y-3 bg-indigo-950/10 border border-indigo-500/20 p-3.5 rounded-xl">
                      <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                        <Facebook className="w-4 h-4" />
                        <span>Facebook Post Fields</span>
                      </div>

                      {/* Facebook Post Text */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-neutral-300">
                            Post Text *
                          </label>
                          <span className="text-[11px] text-neutral-500">
                            {fbText.length} characters
                          </span>
                        </div>
                        <textarea
                          rows={5}
                          value={fbText}
                          onChange={(e) => setFbText(e.target.value)}
                          placeholder="Enter Facebook post update..."
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                        />
                      </div>
                    </div>
                  )}

                  {/* Image Attachment (Common across all tabs) */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Attached Image Asset
                    </label>
                    {commonImageUrl ? (
                      <div className="flex items-center gap-3 p-2 bg-neutral-950 border border-neutral-800 rounded-xl">
                        <img
                          src={commonImageUrl}
                          alt="Attachment"
                          className="w-14 h-14 object-cover rounded-lg border border-neutral-800"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-neutral-200 truncate">Media Asset Attached</p>
                          <p className="text-[11px] text-neutral-500">Supported by Instagram, LinkedIn & Facebook</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCommonImageUrl('')}
                          className="text-xs text-rose-400 hover:text-rose-300 p-1.5 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-neutral-950/60 border border-dashed border-neutral-800 rounded-xl text-center space-y-1">
                        <ImageIcon className="w-5 h-5 text-neutral-500 mx-auto" />
                        <p className="text-xs text-neutral-400">No image attached</p>
                        <p className="text-[10px] text-neutral-500">
                          {selectedPlatforms.includes('instagram') ? (
                            <span className="text-amber-400 font-medium">
                              ⚠️ Instagram requires an image attachment for feed publishing.
                            </span>
                          ) : (
                            'Optional for LinkedIn and Facebook feed posts.'
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Mockup Preview */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Live Platform Preview
                  </span>
                  {selectedPlatforms.length > 1 && (
                    <div className="flex items-center gap-1">
                      {selectedPlatforms.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setActivePreviewTab(p)}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                            activePreviewTab === p
                              ? 'bg-neutral-800 text-white'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-xl min-h-[380px] flex items-center justify-center">
                  <PlatformPreviewCard
                    platform={activePreviewTab}
                    account={getAccountForPlatform(activePreviewTab)}
                    text={activePreviewTab === 'linkedin' ? liText || commonText : fbText || commonText}
                    caption={igCaption || commonText}
                    imageUrl={commonImageUrl}
                    hashtags={
                      activePreviewTab === 'instagram'
                        ? igHashtags.split(/[,\s]+/)
                        : liHashtags.split(/[,\s]+/)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: PREVIEW CONFIRMATION BEFORE PUBLISHING */}
          {stage === 'preview_confirm' && (
            <div className="space-y-6">
              <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
                <Sliders className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-semibold text-white">Review Before Publishing</h4>
                  <p className="text-neutral-300 mt-0.5 leading-relaxed">
                    Check the exact layout for each selected platform. Content will be published simultaneously to all checked networks.
                  </p>
                </div>
              </div>

              {/* Multi-Platform Previews Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {selectedPlatforms.map((platform) => (
                  <div key={platform} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold capitalize text-neutral-300">
                      <span>{platform}</span>
                      <span className="text-[10px] text-neutral-500 font-normal">
                        {getAccountForPlatform(platform)?.accountName || 'Connected'}
                      </span>
                    </div>
                    <PlatformPreviewCard
                      platform={platform}
                      account={getAccountForPlatform(platform)}
                      text={platform === 'linkedin' ? liText || commonText : fbText || commonText}
                      caption={igCaption || commonText}
                      imageUrl={commonImageUrl}
                      hashtags={
                        platform === 'instagram'
                          ? igHashtags.split(/[,\s]+/)
                          : liHashtags.split(/[,\s]+/)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAGE 3: PUBLISHING IN PROGRESS */}
          {stage === 'publishing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-3 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              <div>
                <h3 className="text-base font-semibold text-white">Publishing across selected platforms...</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                  Connecting to platform APIs (Instagram, LinkedIn, Facebook) and verifying container statuses.
                </p>
              </div>
            </div>
          )}

          {/* STAGE 4: PUBLISHING RESULTS */}
          {stage === 'result' && (
            <div className="space-y-6">
              <div className="text-center space-y-1 py-2">
                <h3 className="text-lg font-bold text-white">Publishing Summary</h3>
                <p className="text-xs text-neutral-400">
                  Individual platform status results for this distribution run
                </p>
              </div>

              <div className="space-y-3 max-w-2xl mx-auto">
                {publishResults.map((res) => {
                  const isSuccess = res.status === 'success';
                  const isReconnect = res.status === 'needs_reconnection';

                  return (
                    <div
                      key={res.platform}
                      className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                        isSuccess
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                          : isReconnect
                          ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                          : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isSuccess ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : isReconnect ? (
                          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold capitalize text-white">
                              {res.platform}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              isSuccess ? 'bg-emerald-500/20 text-emerald-300' :
                              isReconnect ? 'bg-amber-500/20 text-amber-300' :
                              'bg-rose-500/20 text-rose-300'
                            }`}>
                              {isSuccess ? 'Published' : isReconnect ? 'Needs Reconnection' : 'Failed'}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300 mt-1">
                            {isSuccess
                              ? `Post successfully distributed to ${res.accountName || res.platform}.`
                              : res.error || 'Failed to publish to platform.'}
                          </p>
                          {res.postId && (
                            <p className="text-[11px] font-mono text-neutral-500 mt-1">
                              ID: {res.postId}
                            </p>
                          )}
                        </div>
                      </div>

                      {res.postUrl && (
                        <a
                          href={res.postUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
                        >
                          <span>View Post</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          {stage === 'draft' && (
            <>
              <button
                type="button"
                onClick={onNavigateToSocialSettings}
                className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Manage Social Accounts
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPreview}
                  disabled={selectedPlatforms.length === 0}
                  className="px-5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>Review Preview</span>
                  <span>→</span>
                </button>
              </div>
            </>
          )}

          {stage === 'preview_confirm' && (
            <>
              <button
                type="button"
                onClick={() => setStage('draft')}
                className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
              >
                ← Back to Edit
              </button>
              <button
                type="button"
                onClick={handleExecutePublish}
                className="px-6 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish to {selectedPlatforms.length} Platform{selectedPlatforms.length > 1 ? 's' : ''}</span>
              </button>
            </>
          )}

          {stage === 'result' && (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStage('draft');
                  setPublishResults([]);
                }}
                className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
              >
                Publish Another Post
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

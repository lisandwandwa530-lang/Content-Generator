import React, { useEffect, useState } from 'react';
import { NavView, PromptItem, GenerationItem, SocialAccount, SocialPublishItem } from '../../types.ts';
import { api } from '../../services/api.ts';
import {
  FileText,
  Image as ImageIcon,
  Code2,
  Bookmark,
  ArrowRight,
  Sparkles,
  History,
  Star,
  Play,
  Share2,
  Instagram,
  Linkedin,
  Facebook,
  CheckCircle2,
  ExternalLink,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface DashboardViewProps {
  onNavigate: (view: NavView) => void;
  onUsePrompt: (promptText: string, category: 'text' | 'image' | 'code') => void;
  onOpenPublishModal?: (text?: string, image?: string) => void;
}

export function DashboardView({ onNavigate, onUsePrompt, onOpenPublishModal }: DashboardViewProps) {
  const { user } = useAuth();
  const [recentGenerations, setRecentGenerations] = useState<GenerationItem[]>([]);
  const [featuredPrompts, setFeaturedPrompts] = useState<PromptItem[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [recentPublishes, setRecentPublishes] = useState<SocialPublishItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [historyRes, promptsRes, accountsRes, socialHistoryRes] = await Promise.all([
          api.getHistory(),
          api.getPrompts(),
          api.getSocialAccounts().catch(() => ({ accounts: [] })),
          api.getSocialHistory().catch(() => ({ history: [] })),
        ]);
        setRecentGenerations(historyRes.history.slice(0, 4));
        setFeaturedPrompts(promptsRes.prompts.filter((p) => p.isFavorite).slice(0, 3));
        setSocialAccounts(accountsRes.accounts || []);
        setRecentPublishes((socialHistoryRes.history || []).slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getAccount = (platform: 'instagram' | 'linkedin' | 'facebook') =>
    socialAccounts.find((a) => a.platform === platform);

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans text-neutral-100">
      {/* Hero Section */}
      <div className="space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Full-Stack AI Studio & Distribution Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-100 max-w-2xl leading-tight">
          Create anything with AI.
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
          High-precision text, imagery, and code generator with persistent prompt memory and direct one-click publishing to Instagram, LinkedIn, and Facebook.
        </p>
      </div>

      {/* Primary Action Generators & Social Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Text Generator */}
        <div
          onClick={() => onNavigate('text')}
          className="group p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-100 group-hover:text-indigo-300 transition-colors">
              Text Generator
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Articles, briefs, and emails with exact count, tone, and negative exclusions.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-medium text-neutral-300 group-hover:text-white">
            <span>Open Generator</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. Image Generator */}
        <div
          onClick={() => onNavigate('image')}
          className="group p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-100 group-hover:text-indigo-300 transition-colors">
              Image Generator
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Open-ended visual generator for any scene, subject, or architectural concept.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-medium text-neutral-300 group-hover:text-white">
            <span>Open Generator</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3. Code Generator */}
        <div
          onClick={() => onNavigate('code')}
          className="group p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
              <Code2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-100 group-hover:text-indigo-300 transition-colors">
              Code Generator
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Synthesize production-grade software with syntax lines and code explain.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-medium text-neutral-300 group-hover:text-white">
            <span>Open Generator</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 4. Social Media Hub */}
        <div
          onClick={() => onNavigate('social')}
          className="group p-5 rounded-2xl bg-neutral-900 border border-indigo-500/30 hover:border-indigo-500/70 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
              Social Media
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Publish directly to Instagram, LinkedIn, and Facebook with live mockups.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-medium text-indigo-300 group-hover:text-white">
            <span>Social Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Social Media Dashboard Section: Connected Accounts & Recent Publications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connected Accounts */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-neutral-100">Connected Accounts</h2>
            </div>
            <button
              onClick={() => onNavigate('social')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Manage Accounts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            {/* Instagram */}
            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Instagram className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-200">Instagram</span>
                  <p className="text-[11px] text-neutral-400 truncate max-w-[180px]">
                    {getAccount('instagram') ? getAccount('instagram')?.accountName : 'Not Connected'}
                  </p>
                </div>
              </div>
              {getAccount('instagram') ? (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Connected
                </span>
              ) : (
                <button
                  onClick={() => onNavigate('social')}
                  className="px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors cursor-pointer"
                >
                  Connect
                </button>
              )}
            </div>

            {/* LinkedIn */}
            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Linkedin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-200">LinkedIn</span>
                  <p className="text-[11px] text-neutral-400 truncate max-w-[180px]">
                    {getAccount('linkedin') ? getAccount('linkedin')?.accountName : 'Not Connected'}
                  </p>
                </div>
              </div>
              {getAccount('linkedin') ? (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Connected
                </span>
              ) : (
                <button
                  onClick={() => onNavigate('social')}
                  className="px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors cursor-pointer"
                >
                  Connect
                </button>
              )}
            </div>

            {/* Facebook */}
            <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Facebook className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-200">Facebook</span>
                  <p className="text-[11px] text-neutral-400 truncate max-w-[180px]">
                    {getAccount('facebook') ? getAccount('facebook')?.accountName : 'Not Connected'}
                  </p>
                </div>
              </div>
              {getAccount('facebook') ? (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Connected
                </span>
              ) : (
                <button
                  onClick={() => onNavigate('social')}
                  className="px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors cursor-pointer"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recent Publications */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-neutral-100">Recent Publications</h2>
            </div>
            <button
              onClick={() => onNavigate('social')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            {recentPublishes.length > 0 ? (
              recentPublishes.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {item.platforms.map((p) => (
                        <span
                          key={p}
                          className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-neutral-800 text-neutral-300"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-neutral-500">
                      {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <p className="text-neutral-300 line-clamp-2 leading-relaxed">
                    {item.content.text || item.content.caption}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-900">
                    <div className="flex items-center gap-2">
                      {item.results.map((r) => (
                        <span
                          key={r.platform}
                          className={`flex items-center gap-1 ${
                            r.status === 'success' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span className="capitalize">{r.platform}</span>
                        </span>
                      ))}
                    </div>
                    {item.results.find((r) => r.postUrl) && (
                      <a
                        href={item.results.find((r) => r.postUrl)?.postUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <span>Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-neutral-500 text-xs space-y-2">
                <p>No social media publications recorded yet.</p>
                <button
                  onClick={() => onOpenPublishModal ? onOpenPublishModal('Check out our latest update!') : onNavigate('social')}
                  className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Create First Social Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two-Column Section: Featured Prompt Templates & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Starred / Recommended Prompts */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-neutral-100">Featured Prompt Templates</h2>
            </div>
            <button
              onClick={() => onNavigate('library')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>View All Templates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {featuredPrompts.length > 0 ? (
              featuredPrompts.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                      <span className="capitalize font-medium text-neutral-300">{p.category}</span>
                      <span aria-hidden="true" className="text-neutral-600">·</span>
                      <span className="text-indigo-400/90 text-[11px] font-mono">[Variables Ready]</span>
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-100 line-clamp-1">{p.title}</h3>
                    <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{p.description}</p>
                  </div>
                  <button
                    onClick={() => onUsePrompt(p.content, p.category)}
                    className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-indigo-600 hover:text-white text-neutral-200 rounded-md transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Use</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-500 text-xs">
                Browse the Prompt Library to favorite and customize reusable templates.
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Generation Activity */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-neutral-100">Recent Studio Activity</h2>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
            {recentGenerations.length > 0 ? (
              recentGenerations.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('history')}
                  className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center shrink-0">
                      {item.type === 'text' && <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                      {item.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />}
                      {item.type === 'code' && <Code2 className="w-3.5 h-3.5 text-indigo-400" />}
                      {item.type === 'social' && <Share2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-neutral-200 font-medium truncate">"{item.prompt}"</p>
                      <span className="text-[11px] text-neutral-500 tabular-nums">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-neutral-500 text-xs">
                No recent generations. Select a generator above to begin!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

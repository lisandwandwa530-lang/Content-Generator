import React from 'react';
import { SocialPlatform, SocialAccount } from '../../types.ts';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ThumbsUp,
  Share2,
  Globe,
  MoreHorizontal,
  Instagram,
  Linkedin,
  Facebook,
  AlertCircle,
} from 'lucide-react';

interface PlatformPreviewCardProps {
  platform: SocialPlatform;
  account?: SocialAccount;
  text?: string;
  caption?: string;
  imageUrl?: string;
  hashtags?: string[];
}

export function PlatformPreviewCard({
  platform,
  account,
  text = '',
  caption = '',
  imageUrl,
  hashtags = [],
}: PlatformPreviewCardProps) {
  const accountName = account?.accountName || (
    platform === 'instagram' ? '@your_instagram' :
    platform === 'linkedin' ? 'Your LinkedIn Profile' :
    'Your Facebook Page'
  );

  const initialLetter = accountName.replace(/^@/, '').charAt(0).toUpperCase() || 'U';

  const formattedHashtags = hashtags
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`));

  // --- INSTAGRAM PREVIEW ---
  if (platform === 'instagram') {
    const igCaption = (caption || text).trim();

    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-md max-w-sm mx-auto w-full text-neutral-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px] shrink-0">
              <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-neutral-200">
                {account?.avatarUrl ? (
                  <img src={account.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  initialLetter
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-neutral-200 leading-tight">
                {accountName.replace(/^@/, '')}
              </span>
              <span className="text-[10px] text-neutral-400">Original audio</span>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-neutral-400" />
        </div>

        {/* Media Preview */}
        <div className="relative aspect-square bg-neutral-950 flex items-center justify-center overflow-hidden border-y border-neutral-800/40">
          {imageUrl ? (
            <img src={imageUrl} alt="Instagram Post" className="w-full h-full object-cover" />
          ) : (
            <div className="p-6 text-center space-y-2">
              <Instagram className="w-8 h-8 text-neutral-600 mx-auto" />
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Image Required for Instagram</span>
              </div>
              <p className="text-[11px] text-neutral-500 max-w-[220px]">
                Feed posts via Instagram Graph API require an attached photo or generated image.
              </p>
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="px-3.5 pt-2.5 pb-1.5 flex items-center justify-between text-neutral-300">
          <div className="flex items-center gap-3.5">
            <Heart className="w-5 h-5 hover:text-rose-500 cursor-pointer transition-colors" />
            <MessageCircle className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
            <Send className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
          </div>
          <Bookmark className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
        </div>

        {/* Likes & Caption */}
        <div className="px-3.5 pb-3 text-xs space-y-1">
          <div className="font-semibold text-neutral-200 text-[11px]">84 likes</div>
          <div className="leading-snug text-neutral-300 break-words whitespace-pre-line text-[11px]">
            <span className="font-semibold text-neutral-100 mr-1.5">{accountName.replace(/^@/, '')}</span>
            {igCaption || <span className="text-neutral-500 italic">No caption drafted yet...</span>}
            {formattedHashtags.length > 0 && (
              <span className="text-indigo-400 font-medium block mt-1">
                {formattedHashtags.join(' ')}
              </span>
            )}
          </div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider pt-1">Just now</div>
        </div>
      </div>
    );
  }

  // --- LINKEDIN PREVIEW ---
  if (platform === 'linkedin') {
    const postBody = (text || caption).trim();

    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-md max-w-sm mx-auto w-full text-neutral-100 font-sans">
        {/* Header */}
        <div className="flex items-start justify-between p-3.5 border-b border-neutral-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-sm text-neutral-300 shrink-0">
              {account?.avatarUrl ? (
                <img src={account.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                initialLetter
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-neutral-200">{accountName}</span>
                <span className="text-[10px] text-neutral-400">· 1st</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-tight">Prompt Engineer & Content Creator</p>
              <div className="flex items-center gap-1 text-[10px] text-neutral-500 mt-0.5">
                <span>Just now</span>
                <span>·</span>
                <Globe className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-neutral-400" />
        </div>

        {/* Post Text */}
        <div className="p-3.5 text-xs text-neutral-300 leading-relaxed whitespace-pre-line break-words">
          {postBody || <span className="text-neutral-500 italic">No post text drafted yet...</span>}
          {formattedHashtags.length > 0 && (
            <span className="text-indigo-400 font-medium block mt-2">
              {formattedHashtags.join(' ')}
            </span>
          )}
        </div>

        {/* Media Preview (Optional for LinkedIn) */}
        {imageUrl && (
          <div className="border-t border-neutral-800 bg-neutral-950 aspect-video flex items-center justify-center overflow-hidden">
            <img src={imageUrl} alt="LinkedIn Post Media" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Reactions Counter */}
        <div className="px-3.5 py-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-[9px] text-white">👍</span>
            <span>42</span>
          </div>
          <span>3 comments</span>
        </div>

        {/* Action Buttons */}
        <div className="px-2 py-1.5 border-t border-neutral-800 grid grid-cols-4 gap-1 text-center text-xs text-neutral-400 font-medium">
          <button className="py-1.5 rounded hover:bg-neutral-800 flex items-center justify-center gap-1 text-neutral-300 hover:text-white transition-colors cursor-pointer">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="text-[11px]">Like</span>
          </button>
          <button className="py-1.5 rounded hover:bg-neutral-800 flex items-center justify-center gap-1 text-neutral-300 hover:text-white transition-colors cursor-pointer">
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="text-[11px]">Comment</span>
          </button>
          <button className="py-1.5 rounded hover:bg-neutral-800 flex items-center justify-center gap-1 text-neutral-300 hover:text-white transition-colors cursor-pointer">
            <Share2 className="w-3.5 h-3.5" />
            <span className="text-[11px]">Repost</span>
          </button>
          <button className="py-1.5 rounded hover:bg-neutral-800 flex items-center justify-center gap-1 text-neutral-300 hover:text-white transition-colors cursor-pointer">
            <Send className="w-3.5 h-3.5" />
            <span className="text-[11px]">Send</span>
          </button>
        </div>
      </div>
    );
  }

  // --- FACEBOOK PREVIEW ---
  const fbText = (text || caption).trim();
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-md max-w-sm mx-auto w-full text-neutral-100 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between p-3.5 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
            {account?.avatarUrl ? (
              <img src={account.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initialLetter
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-neutral-200">{accountName}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-neutral-500 mt-0.5">
              <span>Just now</span>
              <span>·</span>
              <Globe className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>
        <MoreHorizontal className="w-4 h-4 text-neutral-400" />
      </div>

      {/* Post Text */}
      <div className="p-3.5 text-xs text-neutral-200 leading-relaxed whitespace-pre-line break-words">
        {fbText || <span className="text-neutral-500 italic">No message drafted yet...</span>}
      </div>

      {/* Media Preview (Optional for Facebook) */}
      {imageUrl && (
        <div className="border-t border-neutral-800 bg-neutral-950 aspect-video flex items-center justify-center overflow-hidden">
          <img src={imageUrl} alt="Facebook Post Media" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Engagement Counter */}
      <div className="px-3.5 py-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400">
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-[9px] text-white">👍</span>
          <span>19</span>
        </div>
        <div className="flex items-center gap-2">
          <span>2 comments</span>
          <span>1 share</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-2 py-1.5 border-t border-neutral-800 grid grid-cols-3 gap-1 text-center text-xs text-neutral-400 font-medium">
        <button className="py-1.5 rounded hover:bg-neutral-800 flex items-center justify-center gap-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer">
          <ThumbsUp className="w-3.5 h-3.5" />
          <span className="text-[11px]">Like</span>
        </button>
        <button className="py-1.5 rounded hover:bg-neutral-800 flex items-center justify-center gap-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer">
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="text-[11px]">Comment</span>
        </button>
        <button className="py-1.5 rounded hover:bg-neutral-800 flex items-center justify-center gap-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer">
          <Share2 className="w-3.5 h-3.5" />
          <span className="text-[11px]">Share</span>
        </button>
      </div>
    </div>
  );
}

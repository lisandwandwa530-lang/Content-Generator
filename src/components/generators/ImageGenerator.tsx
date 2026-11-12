import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  Edit2,
  BookmarkPlus,
  Maximize2,
  X,
  Compass,
  AlertTriangle,
  Info,
  Share2,
} from 'lucide-react';

interface ImageGeneratorProps {
  initialPrompt?: string;
  onSaveToLibrary?: (data: { title: string; content: string; category: 'image'; tags: string[] }) => void;
  onPublishToSocial?: (data: { imageUrl: string; text?: string; originalPrompt?: string }) => void;
}

export function ImageGenerator({
  initialPrompt = '',
  onSaveToLibrary,
  onPublishToSocial,
}: ImageGeneratorProps) {
  const { success, error, info } = useToast();

  const [prompt, setPrompt] = useState(initialPrompt);
  const [style, setStyle] = useState('None');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState('');
  const [isDemoFallback, setIsDemoFallback] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | undefined>();
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const handleGenerate = async (overridePrompt?: string) => {
    const textToRun = overridePrompt || prompt;
    if (!textToRun.trim()) {
      error('Please enter an image prompt description.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setActivePrompt(textToRun);

    try {
      const res = await api.generateImage({
        prompt: textToRun.trim(),
        style: style !== 'None' ? style : undefined,
        aspectRatio,
        saveToHistory: true,
      });

      setCurrentImage(res.imageUrl);
      setIsDemoFallback(res.isDemoFallback);
      setWarningMessage(res.warning);
      setGenerationError(null);
      success('Image synthesized according to prompt specifications.');
    } catch (err: any) {
      const msg = err.message || 'Image generation failed. Please try again.';
      setGenerationError(msg);
      error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = async () => {
    const text = activePrompt || prompt;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setHasCopiedPrompt(true);
      success('Prompt copied to clipboard');
      setTimeout(() => setHasCopiedPrompt(false), 2000);
    } catch {
      error('Failed to copy prompt');
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    try {
      const link = document.createElement('a');
      link.href = currentImage;
      const sanitized = (activePrompt || 'generated-image')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 32);
      const isSvg = currentImage.startsWith('data:image/svg');
      const isJpg = currentImage.startsWith('data:image/jpeg');
      const ext = isSvg ? 'svg' : isJpg ? 'jpg' : 'png';
      link.download = `promptstudio-${sanitized}-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      success('Image downloaded successfully');
    } catch {
      error('Download failed');
    }
  };

  const handleSaveToLibrary = () => {
    if (!prompt.trim()) return;
    if (onSaveToLibrary) {
      onSaveToLibrary({
        title: prompt.slice(0, 32).trim() + (prompt.length > 32 ? '...' : ''),
        content: prompt.trim(),
        category: 'image',
        tags: [style !== 'None' ? style : 'Image', aspectRatio].filter(Boolean),
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Strict Image Prompt Accuracy Notice */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Open-Ended Prompt Precision</h2>
            <p className="text-xs text-neutral-400">
              Generate any image from any prompt. Strict adherence to subject counts, background exclusions, lighting, and colors.
            </p>
          </div>
        </div>
        <div className="text-xs text-neutral-400">
          Primary: <span className="font-medium text-neutral-200">User's verbatim prompt</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Image Description *
              </label>
              <button
                type="button"
                onClick={handleSaveToLibrary}
                disabled={!prompt.trim()}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save to Library</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe any scene, object, composition, or style in full detail. Example: 'One matte black smartphone lying flat on a pure white seamless background, soft studio lighting, zero text or other objects.'"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors resize-y leading-relaxed font-normal"
            />

            {/* Aspect Ratio Selector */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-lg">
                {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 text-xs font-medium rounded-md transition-colors text-center cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-neutral-800 text-white shadow-xs'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Style (does not override prompt) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-neutral-400">
                  Optional Style Modifier
                </label>
                <span className="text-[10px] text-neutral-500">Secondary to prompt</span>
              </div>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="None">None (Prompt defined only)</option>
                <option value="Photorealistic">Photorealistic</option>
                <option value="Minimalist Studio">Minimalist Studio</option>
                <option value="Cinematic Architectural">Cinematic Architectural</option>
                <option value="Isometric 3D">Isometric 3D</option>
                <option value="Digital Art">Digital Art</option>
                <option value="Vector Illustration">Vector Illustration</option>
                <option value="Anime / Manga">Anime</option>
                <option value="Watercolor">Watercolor</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Image</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex-1 min-h-[460px] p-5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col shadow-sm">
            {/* Header / Actions Bar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Image Preview
                </span>
                {isDemoFallback && (
                  <>
                    <span className="text-neutral-500 text-xs">·</span>
                    <span className="text-xs text-amber-400/90 font-medium">Precision Vector Mode</span>
                  </>
                )}
              </div>

              {currentImage && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    title="Copy active prompt"
                    className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {hasCopiedPrompt ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerate(activePrompt)}
                    disabled={isGenerating}
                    title="Generate Again"
                    className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Generate Again</span>
                  </button>

                  {currentImage && onPublishToSocial && (
                    <button
                      type="button"
                      onClick={() =>
                        onPublishToSocial({
                          imageUrl: currentImage,
                          text: activePrompt || prompt,
                          originalPrompt: activePrompt || prompt,
                        })
                      }
                      title="Publish to Social Media (Instagram, LinkedIn, Facebook)"
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Publish to Social</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownload}
                    title="Download Image"
                    className="px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    title="Enlarge preview"
                    className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Image Canvas / Area */}
            <div className="flex-1 flex items-center justify-center relative bg-neutral-950/70 rounded-lg border border-neutral-800/80 overflow-hidden min-h-[360px]">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-9 h-9 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <p className="text-sm font-medium text-neutral-200">Rendering visual composition...</p>
                  <p className="text-xs text-neutral-500 max-w-sm">Applying subject constraints, style, and lighting</p>
                </div>
              ) : generationError ? (
                <div className="flex flex-col items-center justify-center text-center p-8 space-y-3 max-w-md">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-200">Generation Interrupted</h3>
                    <p className="text-xs text-neutral-400 mt-1">{generationError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    className="px-3.5 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer mt-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              ) : currentImage ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={currentImage}
                    alt={activePrompt || 'AI generated image'}
                    className="max-h-[460px] max-w-full w-auto object-contain rounded-md shadow-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 text-neutral-500">
                  <ImageIcon className="w-12 h-12 mb-3 opacity-30 text-indigo-400" />
                  <p className="text-sm font-medium text-neutral-300">No Image Generated Yet</p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                    Enter an open-ended description of any scene or subject. Your prompt remains the primary instruction.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Status / Edit Prompt Bar */}
            {currentImage && (
              <div className="mt-3 pt-3 border-t border-neutral-800 space-y-2">
                <div className="flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1 overflow-hidden">
                    <span className="text-[11px] font-medium text-neutral-400 block">Active Prompt:</span>
                    <p className="text-neutral-300 font-mono text-[11px] leading-relaxed truncate">
                      "{activePrompt}"
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPrompt(activePrompt);
                      info('Prompt loaded into input editor for refinement.');
                    }}
                    className="shrink-0 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer mt-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Prompt</span>
                  </button>
                </div>

                {warningMessage && (
                  <p className="text-[11px] text-amber-400/80 leading-snug">
                    · {warningMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && currentImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute -top-10 right-0 text-neutral-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={currentImage}
              alt={activePrompt}
              className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl border border-neutral-800"
            />
            <p className="text-xs text-neutral-400 mt-3 text-center max-w-2xl font-mono">
              "{activePrompt}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

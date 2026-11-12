import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { PromptItem } from '../../types.ts';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  BookmarkPlus,
  Trash2,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  Edit3,
  AlignLeft,
  BookOpen,
  Share2,
} from 'lucide-react';

interface TextGeneratorProps {
  initialPrompt?: string;
  onSaveToLibrary?: (data: { title: string; content: string; category: 'text'; tags: string[] }) => void;
  onNavigateToHistory?: () => void;
  onPublishToSocial?: (data: { text: string; originalPrompt?: string }) => void;
}

export function TextGenerator({
  initialPrompt = '',
  onSaveToLibrary,
  onNavigateToHistory,
  onPublishToSocial,
}: TextGeneratorProps) {
  const { success, error, info } = useToast();

  const [prompt, setPrompt] = useState(initialPrompt);
  const [contentType, setContentType] = useState('General');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Medium (~300 words)');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [lastPromptUsed, setLastPromptUsed] = useState('');
  const [stats, setStats] = useState({ words: 0, chars: 0 });

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Update live word & character stats whenever output changes
  useEffect(() => {
    const trimmed = output.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const chars = output.length;
    setStats({ words, chars });
  }, [output]);

  const handleGenerate = async (overridePrompt?: string) => {
    const promptToRun = overridePrompt || prompt;
    if (!promptToRun.trim()) {
      error('Please enter a prompt to generate text.');
      return;
    }

    setIsGenerating(true);
    setLastPromptUsed(promptToRun);

    try {
      const res = await api.generateText({
        prompt: promptToRun.trim(),
        contentType: contentType !== 'General' ? contentType : undefined,
        tone: tone !== 'Neutral' ? tone : undefined,
        length,
        additionalInstructions: additionalInstructions.trim() || undefined,
        saveToHistory: true,
      });

      setOutput(res.text);
      success('Text generated strictly according to prompt constraints.');
    } catch (err: any) {
      error(err.message || 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setHasCopied(true);
      success('Copied generated text to clipboard');
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      error('Failed to copy to clipboard');
    }
  };

  const handleRegenerate = () => {
    if (!lastPromptUsed && !prompt) return;
    handleGenerate(lastPromptUsed || prompt);
  };

  const handleClearOutput = () => {
    setOutput('');
    info('Output cleared');
  };

  const handleSavePrompt = () => {
    if (!prompt.trim()) return;
    if (onSaveToLibrary) {
      onSaveToLibrary({
        title: prompt.slice(0, 32).trim() + (prompt.length > 32 ? '...' : ''),
        content: prompt.trim(),
        category: 'text',
        tags: [contentType !== 'General' ? contentType : 'Text', tone].filter(Boolean),
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner / Strict Prompt Accuracy Notice */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Strict Prompt Accuracy Protocol</h2>
            <p className="text-xs text-neutral-400">
              Outputs adhere strictly to requested bullet counts, formats, lengths, and exclusions with zero unprompted filler.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-neutral-400">
          <span>Target Model:</span>
          <span className="font-mono text-neutral-200">Gemini 3.8 Flash</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Prompt Instructions *
              </label>
              <button
                type="button"
                onClick={handleSavePrompt}
                disabled={!prompt.trim()}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save to Library</span>
              </button>
            </div>

            <textarea
              rows={7}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe any type of text you need in detail. e.g. 'Draft an executive briefing on supply chain resilience with exactly 3 bullet points, zero introductory greeting, professional tone.'"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors resize-y leading-relaxed font-normal"
            />

            {/* Quick Config Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Content Format
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="General">General Prose</option>
                  <option value="Technical Documentation">Technical Spec</option>
                  <option value="Executive Briefing">Executive Briefing</option>
                  <option value="Blog Post">Blog Article</option>
                  <option value="Professional Email">Email Draft</option>
                  <option value="Bullet Summary">Bullet Point Summary</option>
                  <option value="Tutorial Guide">Step-by-Step Tutorial</option>
                  <option value="Press Release">Press Release</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Professional">Professional</option>
                  <option value="Concise & Direct">Concise & Direct</option>
                  <option value="Technical & Authoritative">Technical</option>
                  <option value="Academic">Academic</option>
                  <option value="Persuasive">Persuasive</option>
                  <option value="Conversational">Conversational</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </div>
            </div>

            {/* Length Settings */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Target Length
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Short (~100 words)">Short (~100 words)</option>
                <option value="Medium (~300 words)">Medium (~300 words)</option>
                <option value="Long (~600 words)">Long (~600 words)</option>
                <option value="Comprehensive (~1000 words)">Comprehensive (~1000+ words)</option>
                <option value="Custom constraint in prompt">Specified in prompt</option>
              </select>
            </div>

            {/* Toggle Additional Instructions */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showAdvanced ? 'Hide additional constraints' : 'Add negative exclusions & instructions'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-2.5 animate-in fade-in duration-150">
                  <textarea
                    rows={3}
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    placeholder="e.g. 'Do not mention competitors. Never use the word revolutionize. Exclude introductory remarks.'"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Text...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Text</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Editable Output & Live Metrics */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex-1 min-h-[460px] p-5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col shadow-sm">
            {/* Output Bar Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Editable Result
                </span>
                <span className="text-neutral-500 text-xs">·</span>
                <span className="text-xs text-neutral-400">Click to edit directly</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                {output && onPublishToSocial && (
                  <button
                    type="button"
                    onClick={() => onPublishToSocial({ text: output, originalPrompt: lastPromptUsed || prompt })}
                    title="Publish to Social Media (Instagram, LinkedIn, Facebook)"
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Publish to Social</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!output}
                  title="Copy output"
                  className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-30"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isGenerating || (!lastPromptUsed && !prompt)}
                  title="Regenerate from prompt"
                  className="p-1.5 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors cursor-pointer disabled:opacity-30"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleClearOutput}
                  disabled={!output}
                  title="Clear output"
                  className="p-1.5 text-neutral-400 hover:text-rose-400 bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors cursor-pointer disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Editable Content Area */}
            <div className="flex-1 relative">
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <p className="text-sm font-medium text-neutral-300">Evaluating requirements & synthesizing output...</p>
                  <p className="text-xs text-neutral-500 max-w-sm">Strict accuracy filter active</p>
                </div>
              ) : output ? (
                <textarea
                  value={output}
                  onChange={(e) => setOutput(e.target.value)}
                  placeholder="Output appears here..."
                  className="w-full h-full min-h-[380px] bg-transparent text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none resize-none leading-relaxed font-normal"
                />
              ) : (
                <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 text-neutral-500 border border-dashed border-neutral-800/80 rounded-lg">
                  <FileText className="w-10 h-10 mb-2.5 opacity-30 text-indigo-400" />
                  <p className="text-sm font-medium text-neutral-300">Ready to Generate</p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                    Enter your prompt instructions on the left. The output will be directly editable and saved to your history.
                  </p>
                </div>
              )}
            </div>

            {/* Output Footer & Metrics */}
            <div className="pt-3 mt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-3">
                <span className="tabular-nums">
                  <strong className="text-neutral-200 font-medium">{stats.words}</strong> words
                </span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="tabular-nums">
                  <strong className="text-neutral-200 font-medium">{stats.chars}</strong> characters
                </span>
              </div>

              {output && (
                <span className="text-[11px] text-neutral-500">Auto-saved to history</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

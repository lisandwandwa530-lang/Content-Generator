import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import {
  Code2,
  Sparkles,
  Copy,
  Check,
  Download,
  RotateCcw,
  Trash2,
  BookmarkPlus,
  HelpCircle,
  Zap,
  SlidersHorizontal,
  Compass,
  FileCode,
  X
} from 'lucide-react';

interface CodeGeneratorProps {
  initialPrompt?: string;
  onSaveToLibrary?: (data: { title: string; content: string; category: 'code'; tags: string[] }) => void;
}

export function CodeGenerator({
  initialPrompt = '',
  onSaveToLibrary,
}: CodeGeneratorProps) {
  const { success, error, info } = useToast();

  const [prompt, setPrompt] = useState(initialPrompt);
  const [language, setLanguage] = useState('TypeScript');
  const [framework, setFramework] = useState('React');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [lastPromptUsed, setLastPromptUsed] = useState('');

  // Explain & Improve Modals
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [improvementModalOpen, setImprovementModalOpen] = useState(false);
  const [improvementInstruction, setImprovementInstruction] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [improvedResult, setImprovedResult] = useState<{ improvedCode: string; summary: string } | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const handleGenerate = async (overridePrompt?: string) => {
    const textToRun = overridePrompt || prompt;
    if (!textToRun.trim()) {
      error('Please enter a coding prompt.');
      return;
    }

    setIsGenerating(true);
    setLastPromptUsed(textToRun);

    try {
      const res = await api.generateCode({
        prompt: textToRun.trim(),
        language,
        framework: framework !== 'None' ? framework : undefined,
        additionalRequirements: additionalRequirements.trim() || undefined,
        saveToHistory: true,
      });

      setCode(res.code);
      success(`Generated ${language} code with strict prompt accuracy.`);
    } catch (err: any) {
      error(err.message || 'Code generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setHasCopied(true);
      success('Code copied to clipboard');
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      error('Failed to copy code');
    }
  };

  const handleDownload = () => {
    if (!code) return;
    try {
      const extMap: Record<string, string> = {
        TypeScript: 'ts',
        JavaScript: 'js',
        Python: 'py',
        Rust: 'rs',
        Go: 'go',
        SQL: 'sql',
        'HTML/CSS': 'html',
        'C++': 'cpp',
        Java: 'java',
        Shell: 'sh',
        PHP: 'php',
      };
      const ext = extMap[language] || 'txt';
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `promptstudio-code.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success(`Downloaded as promptstudio-code.${ext}`);
    } catch {
      error('Download failed');
    }
  };

  const handleClear = () => {
    setCode('');
    setExplanation(null);
    setImprovedResult(null);
    info('Editor cleared');
  };

  const handleExplain = async () => {
    if (!code.trim()) return;
    setIsExplaining(true);
    try {
      const res = await api.explainCode(code, language);
      setExplanation(res.explanation);
      success('Code analysis complete');
    } catch (err: any) {
      error(err.message || 'Failed to explain code');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleImprove = async () => {
    if (!code.trim()) return;
    setIsImproving(true);
    try {
      const res = await api.improveCode(code, language, improvementInstruction || undefined);
      setImprovedResult(res);
      success('Code refactored and optimized');
    } catch (err: any) {
      error(err.message || 'Failed to improve code');
    } finally {
      setIsImproving(false);
    }
  };

  const handleApplyImprovement = () => {
    if (improvedResult?.improvedCode) {
      setCode(improvedResult.improvedCode);
      setImprovedResult(null);
      setImprovementModalOpen(false);
      success('Applied optimized code to editor');
    }
  };

  const handleSaveToLibrary = () => {
    if (!prompt.trim()) return;
    if (onSaveToLibrary) {
      onSaveToLibrary({
        title: prompt.slice(0, 32).trim() + (prompt.length > 32 ? '...' : ''),
        content: prompt.trim(),
        category: 'code',
        tags: [language, framework !== 'None' ? framework : ''].filter(Boolean),
      });
    }
  };

  // Render code with numbered lines
  const lines = code ? code.split('\n') : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Accuracy Protocol Banner */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Production Code Integrity</h2>
            <p className="text-xs text-neutral-400">
              Generates only the requested logic and architecture. No unnecessary dependencies or conversational boilerplate.
            </p>
          </div>
        </div>
        <div className="text-xs text-neutral-400">
          Selected Runtime: <span className="font-mono text-neutral-200">{language}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Coding Task Prompt *
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
              placeholder="Describe the function, endpoint, component, or algorithm. e.g. 'Create an in-memory rate limiter using a sliding window log with thread safety and O(1) checks.'"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors resize-y leading-relaxed font-normal"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Language *
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="TypeScript">TypeScript</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="Python">Python</option>
                  <option value="Rust">Rust</option>
                  <option value="Go">Go</option>
                  <option value="SQL">SQL</option>
                  <option value="HTML/CSS">HTML / CSS</option>
                  <option value="C++">C++</option>
                  <option value="Java">Java</option>
                  <option value="Shell">Bash / Shell</option>
                  <option value="PHP">PHP</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Framework (Optional)
                </label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="None">None (Standard Lib)</option>
                  <option value="React">React</option>
                  <option value="Next.js">Next.js</option>
                  <option value="Express">Express</option>
                  <option value="Tailwind CSS">Tailwind CSS</option>
                  <option value="FastAPI">FastAPI</option>
                  <option value="Django">Django</option>
                  <option value="Flask">Flask</option>
                  <option value="Spring Boot">Spring Boot</option>
                  <option value="Vue">Vue</option>
                </select>
              </div>
            </div>

            {/* Additional Requirements Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showAdvanced ? 'Hide additional constraints' : 'Add constraints & architecture rules'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-2.5 animate-in fade-in duration-150">
                  <textarea
                    rows={3}
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    placeholder="e.g. 'Must have strict null checks, no lodash, include JSDoc comments, handle out-of-memory gracefully.'"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              )}
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
                  <span>Synthesizing Code...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Code Editor & Output */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex-1 min-h-[480px] p-5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col shadow-sm">
            {/* Header Actions */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  {language} Editor
                </span>
                <span className="text-neutral-500 text-xs">·</span>
                <span className="text-xs text-neutral-400 tabular-nums">
                  {lines.length} lines
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {code && (
                  <>
                    <button
                      type="button"
                      onClick={handleExplain}
                      disabled={isExplaining}
                      className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isExplaining ? 'Analyzing...' : 'Explain'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImprovementModalOpen(true)}
                      className="px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Improve</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!code}
                  title="Copy code"
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
                  onClick={handleDownload}
                  disabled={!code}
                  title="Download file"
                  className="p-1.5 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors cursor-pointer disabled:opacity-30"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerate(lastPromptUsed || prompt)}
                  disabled={isGenerating || (!lastPromptUsed && !prompt)}
                  title="Regenerate"
                  className="p-1.5 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors cursor-pointer disabled:opacity-30"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!code}
                  title="Clear editor"
                  className="p-1.5 text-neutral-400 hover:text-rose-400 bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors cursor-pointer disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Code Body Area with Line Numbers */}
            <div className="flex-1 bg-neutral-950 rounded-lg border border-neutral-800/80 overflow-hidden flex flex-col relative font-mono text-xs">
              {isGenerating ? (
                <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <p className="text-sm font-medium text-neutral-300 font-sans">Compiling {language} implementation...</p>
                  <p className="text-xs text-neutral-500 font-sans max-w-sm">Respecting strict type constraints & framework idioms</p>
                </div>
              ) : code ? (
                <div className="flex-1 overflow-auto flex max-h-[460px]">
                  {/* Line numbers gutter */}
                  <div className="select-none py-3 px-3 text-right text-neutral-600 bg-neutral-950/60 border-r border-neutral-800/60 font-mono text-[11px] leading-relaxed shrink-0">
                    {lines.map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  {/* Code editor textarea */}
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 p-3 bg-transparent text-neutral-200 placeholder-neutral-600 focus:outline-none resize-none leading-relaxed font-mono text-xs whitespace-pre"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center p-6 text-neutral-500 font-sans">
                  <Code2 className="w-10 h-10 mb-2.5 opacity-30 text-indigo-400" />
                  <p className="text-sm font-medium text-neutral-300">Ready to Code</p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                    Select language and enter prompt. Output will be generated cleanly without markdown greetings.
                  </p>
                </div>
              )}
            </div>

            {/* Explanation Drawer if open */}
            {explanation && (
              <div className="mt-4 p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                  <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[11px]">
                    Code Architecture & Logic Breakdown
                  </span>
                  <button
                    onClick={() => setExplanation(null)}
                    className="text-neutral-400 hover:text-white p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                  {explanation}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Improve Code Modal */}
      {improvementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-semibold text-neutral-100">Improve & Refactor Code</h3>
              </div>
              <button
                onClick={() => setImprovementModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Specific Optimization Goal (Optional)
                </label>
                <input
                  type="text"
                  value={improvementInstruction}
                  onChange={(e) => setImprovementInstruction(e.target.value)}
                  placeholder="e.g. 'Optimize time complexity to O(n)', 'Add comprehensive input boundary validation'"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {improvedResult ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs">
                    <span className="font-semibold text-emerald-400 block mb-1">
                      Summary of Improvements:
                    </span>
                    <p className="text-neutral-300 whitespace-pre-wrap">{improvedResult.summary}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                      Refactored Code Preview:
                    </span>
                    <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] text-neutral-200 overflow-x-auto max-h-48 font-mono">
                      {improvedResult.improvedCode}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setImprovementModalOpen(false)}
                className="px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Cancel
              </button>
              {improvedResult ? (
                <button
                  type="button"
                  onClick={handleApplyImprovement}
                  className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply to Editor</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleImprove}
                  disabled={isImproving}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isImproving ? 'Refactoring...' : 'Analyze & Optimize'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { GenerationItem } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import {
  History,
  FileText,
  Image as ImageIcon,
  Code2,
  Trash2,
  Copy,
  Check,
  Download,
  RotateCcw,
  Search,
  ExternalLink,
  X,
  Eye,
  AlertTriangle,
  Share2,
} from 'lucide-react';

interface GenerationHistoryViewProps {
  onRegenerate: (prompt: string, type: 'text' | 'image' | 'code', parameters?: Record<string, any>) => void;
}

export function GenerationHistoryView({ onRegenerate }: GenerationHistoryViewProps) {
  const { success, error, info } = useToast();

  const [history, setHistory] = useState<GenerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'text' | 'image' | 'code' | 'social'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Detail Modal
  const [activeItem, setActiveItem] = useState<GenerationItem | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getHistory();
      setHistory(res.history);
    } catch (err: any) {
      error(err.message || 'Failed to load generation history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this generation record?')) return;
    try {
      await api.deleteHistoryItem(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (activeItem?.id === id) setActiveItem(null);
      success('History item deleted');
    } catch (err: any) {
      error('Failed to delete item');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all previous generations from history? This cannot be undone.')) return;
    try {
      await api.clearHistory();
      setHistory([]);
      setActiveItem(null);
      success('Generation history cleared');
    } catch (err: any) {
      error('Failed to clear history');
    }
  };

  const handleCopyOutput = async (item: GenerationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.output);
      setCopiedId(item.id);
      success('Copied output to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      error('Failed to copy');
    }
  };

  const handleDownload = (item: GenerationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (item.type === 'image') {
        const link = document.createElement('a');
        link.href = item.output;
        const isSvg = item.output.startsWith('data:image/svg');
        const isJpg = item.output.startsWith('data:image/jpeg');
        const ext = isSvg ? 'svg' : isJpg ? 'jpg' : 'png';
        link.download = `generation-${item.id}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const ext = item.type === 'code' ? 'txt' : 'md';
        const blob = new Blob([item.output], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `generation-${item.id}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      success('Downloaded generation output');
    } catch {
      error('Failed to download');
    }
  };

  const handleTriggerRegenerate = (item: GenerationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (item.type === 'social') {
      info('Social publications can be re-shared from the Social Media tab.');
      return;
    }
    onRegenerate(item.prompt, item.type, item.parameters);
  };

  // Filter items
  const filtered = history.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPrompt = item.prompt.toLowerCase().includes(q);
      const matchOutput = typeof item.output === 'string' && item.output.toLowerCase().includes(q);
      if (!matchPrompt && !matchOutput) return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Controls */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previous generations by prompt or output text..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Clear history button */}
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-2 text-xs font-medium text-neutral-400 hover:text-rose-400 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800/80 w-fit overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All Activity' },
              { id: 'text', label: 'Text' },
              { id: 'image', label: 'Images' },
              { id: 'code', label: 'Code' },
              { id: 'social', label: 'Social Media' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer shrink-0 ${
                filterType === tab.id
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse p-4" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-500">
          <History className="w-10 h-10 mb-3 mx-auto opacity-30 text-indigo-400" />
          <p className="text-sm font-medium text-neutral-300">No Generations Recorded</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Outputs from the Text, Image, Code, and Social Media publishers are automatically saved here for review and reuse.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const formattedDate = new Date(item.createdAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                onClick={() => setActiveItem(item)}
                className="group p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer shadow-sm"
              >
                {/* Left Info & Prompt */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                    {item.type === 'text' && <FileText className="w-4 h-4 text-indigo-400" />}
                    {item.type === 'image' && <ImageIcon className="w-4 h-4 text-indigo-400" />}
                    {item.type === 'code' && <Code2 className="w-4 h-4 text-indigo-400" />}
                    {item.type === 'social' && <Share2 className="w-4 h-4 text-indigo-400" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Unboxed Metadata Header (Zero-Pill discipline) */}
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                      <span className="capitalize font-medium text-neutral-300">{item.type}</span>
                      <span aria-hidden="true" className="text-neutral-600">·</span>
                      <span className="tabular-nums">{formattedDate}</span>
                      {item.isDemoFallback && (
                        <>
                          <span aria-hidden="true" className="text-neutral-600">·</span>
                          <span className="text-amber-400/90 text-[11px]">Precision Vector Preview</span>
                        </>
                      )}
                    </div>

                    <p className="text-sm font-medium text-neutral-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                      "{item.prompt}"
                    </p>

                    <div className="text-xs text-neutral-500 font-mono line-clamp-1 mt-1">
                      {item.type === 'image' ? (
                        <span>[Visual Image Data · Click to inspect]</span>
                      ) : (
                        <span>{item.output.slice(0, 140)}...</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopyOutput(item, e)}
                    title="Copy output"
                    className="p-2 text-neutral-400 hover:text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDownload(item, e)}
                    title="Download output"
                    className="p-2 text-neutral-400 hover:text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleTriggerRegenerate(item, e)}
                    title="Regenerate without overwriting"
                    className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Regenerate</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    title="Delete generation"
                    className="p-2 text-neutral-500 hover:text-rose-400 bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Detail Drawer / Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  {activeItem.type} Generation Details
                </span>
                <span className="text-neutral-500 text-xs">·</span>
                <span className="text-xs text-neutral-400 tabular-nums">
                  {new Date(activeItem.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div>
                <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Original User Prompt:
                </span>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200">
                  {activeItem.prompt}
                </div>
              </div>

              {activeItem.type === 'social' && activeItem.parameters?.results && (
                <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
                    Distribution Platforms & Status:
                  </span>
                  <div className="space-y-2">
                    {activeItem.parameters.results.map((r: any) => (
                      <div
                        key={r.platform}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-900 border border-neutral-800"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            r.status === 'success' ? 'bg-emerald-400' : 'bg-rose-400'
                          }`} />
                          <span className="font-semibold uppercase text-neutral-200">{r.platform}</span>
                          <span className="text-neutral-500">·</span>
                          <span className={r.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}>
                            {r.status === 'success' ? 'Published' : (r.error || 'Failed')}
                          </span>
                        </div>
                        {r.postUrl && (
                          <a
                            href={r.postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <span>View Live Post</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Generation Output:
                </span>
                {activeItem.type === 'image' ? (
                  <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col items-center justify-center">
                    <img
                      src={activeItem.output}
                      alt={activeItem.prompt}
                      className="max-h-80 w-auto object-contain rounded-md"
                    />
                  </div>
                ) : (
                  <pre className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {activeItem.output}
                  </pre>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDelete(activeItem.id)}
                className="text-xs text-neutral-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyOutput(activeItem)}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(activeItem)}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleTriggerRegenerate(activeItem);
                    setActiveItem(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

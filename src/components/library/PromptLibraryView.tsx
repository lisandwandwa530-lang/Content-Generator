import React, { useState, useEffect } from 'react';
import { PromptItem, NavView } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import {
  Search,
  Star,
  Plus,
  Play,
  Edit2,
  Trash2,
  Tag,
  Copy,
  Check,
  Bookmark,
  FileText,
  Image as ImageIcon,
  Code2,
  SlidersHorizontal
} from 'lucide-react';
import { VariableFillerModal } from './VariableFillerModal.tsx';
import { PromptModal } from './PromptModal.tsx';

interface PromptLibraryViewProps {
  onUsePrompt: (promptText: string, category: 'text' | 'image' | 'code') => void;
  openCreateModal?: boolean;
  onResetCreateModalFlag?: () => void;
}

export function PromptLibraryView({
  onUsePrompt,
  openCreateModal,
  onResetCreateModalFlag,
}: PromptLibraryViewProps) {
  const { success, error, info } = useToast();

  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'text' | 'image' | 'code'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals state
  const [variableModalPrompt, setVariableModalPrompt] = useState<PromptItem | null>(null);
  const [editModalPrompt, setEditModalPrompt] = useState<PromptItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  useEffect(() => {
    if (openCreateModal) {
      setIsCreateModalOpen(true);
      onResetCreateModalFlag?.();
    }
  }, [openCreateModal, onResetCreateModalFlag]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const res = await api.getPrompts();
      setPrompts(res.prompts);
    } catch (err: any) {
      error(err.message || 'Failed to load prompt library');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.toggleFavoritePrompt(id);
      setPrompts((prev) => prev.map((p) => (p.id === id ? res.prompt : p)));
      success(res.prompt.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (err: any) {
      error('Could not update favorite status');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this prompt template?')) return;
    try {
      await api.deletePrompt(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      success('Prompt deleted');
    } catch (err: any) {
      error('Failed to delete prompt');
    }
  };

  const handleCopyPrompt = async (prompt: PromptItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopiedId(prompt.id);
      success('Prompt copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      error('Failed to copy');
    }
  };

  const handleSelectToUse = (prompt: PromptItem) => {
    // Check if prompt has [VARIABLE] brackets
    const hasVariables = /\[([A-Z0-9_]+)\]/.test(prompt.content);
    if (hasVariables) {
      setVariableModalPrompt(prompt);
    } else {
      onUsePrompt(prompt.content, prompt.category);
    }
  };

  const handleSavePrompt = async (data: {
    id?: string;
    title: string;
    description: string;
    category: 'text' | 'image' | 'code';
    content: string;
    tags: string[];
    isFavorite?: boolean;
  }) => {
    if (data.id) {
      const res = await api.updatePrompt(data.id, data);
      setPrompts((prev) => prev.map((p) => (p.id === data.id ? res.prompt : p)));
      success('Prompt updated');
    } else {
      const res = await api.createPrompt(data);
      setPrompts((prev) => [res.prompt, ...prev]);
      success('New prompt saved to library');
    }
  };

  // Compute all unique tags
  const allTags = Array.from(new Set(prompts.flatMap((p) => p.tags || [])));

  // Filtered prompts
  const filteredPrompts = prompts.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (onlyFavorites && !p.isFavorite) return false;
    if (selectedTag && !p.tags?.includes(selectedTag)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchContent = p.content.toLowerCase().includes(q);
      const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchContent && !matchTags) return false;
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Controls & Search Bar */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts by title, keyword, or variables..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                onlyFavorites
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Favorites</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Prompt</span>
            </button>
          </div>
        </div>

        {/* Category Tabs (Interactive Segmented Control) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/80">
          <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800/80">
            {(
              [
                { id: 'all', label: 'All Prompts' },
                { id: 'text', label: 'Text' },
                { id: 'image', label: 'Image' },
                { id: 'code', label: 'Code' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedTag(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Tag Badges */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-md">
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium mr-1 cursor-pointer"
                >
                  Clear tag filter
                </button>
              )}
              {allTags.slice(0, 5).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                  className={`text-[11px] px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    selectedTag === t
                      ? 'bg-indigo-900/40 text-indigo-200 border border-indigo-500/30'
                      : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400 border border-neutral-800'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prompts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse p-5" />
          ))}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-500">
          <Bookmark className="w-10 h-10 mb-3 mx-auto opacity-30 text-indigo-400" />
          <p className="text-sm font-medium text-neutral-300">No prompts match your filter</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or create a brand new template.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setOnlyFavorites(false);
              setSelectedTag(null);
            }}
            className="mt-4 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:underline cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((p) => {
            const hasVariables = /\[([A-Z0-9_]+)\]/.test(p.content);
            return (
              <div
                key={p.id}
                className="group p-5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between shadow-sm relative"
              >
                <div>
                  {/* Card Header (Zero-Pill: Clean unboxed metadata with typographic separators) */}
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                    <div className="flex items-center gap-1.5">
                      {p.category === 'text' && <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                      {p.category === 'image' && <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />}
                      {p.category === 'code' && <Code2 className="w-3.5 h-3.5 text-indigo-400" />}
                      <span className="capitalize font-medium text-neutral-300">{p.category}</span>
                      {hasVariables && (
                        <>
                          <span aria-hidden="true" className="text-neutral-600">·</span>
                          <span className="text-indigo-400/90 text-[11px] font-mono">Dynamic [vars]</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(p.id, e)}
                        title="Toggle favorite"
                        className="p-1 text-neutral-500 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            p.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCopyPrompt(p, e)}
                        title="Copy prompt text"
                        className="p-1 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
                      >
                        {copiedId === p.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditModalPrompt(p)}
                        title="Edit prompt"
                        className="p-1 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(p.id, e)}
                        title="Delete prompt"
                        className="p-1 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-semibold text-neutral-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  {/* Prompt Text Preview Box */}
                  <div className="mt-3 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80 font-mono text-[11px] text-neutral-300 line-clamp-3 leading-relaxed">
                    {p.content}
                  </div>
                </div>

                {/* Footer with Unboxed Tags & Use Button */}
                <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-hidden text-[11px] text-neutral-500 truncate">
                    {p.tags?.length > 0 ? (
                      p.tags.map((t, idx) => (
                        <span key={t} className="truncate">
                          #{t}{idx < p.tags.length - 1 ? ' ·' : ''}
                        </span>
                      ))
                    ) : (
                      <span>Template</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectToUse(p)}
                    className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-indigo-600 hover:text-white text-neutral-200 rounded-md transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Use Prompt</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Variable Modal */}
      {variableModalPrompt && (
        <VariableFillerModal
          prompt={variableModalPrompt}
          isOpen={!!variableModalPrompt}
          onClose={() => setVariableModalPrompt(null)}
          onApplyPrompt={onUsePrompt}
        />
      )}

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || editModalPrompt) && (
        <PromptModal
          isOpen={isCreateModalOpen || !!editModalPrompt}
          initialPrompt={editModalPrompt}
          defaultCategory={selectedCategory !== 'all' ? selectedCategory : 'text'}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditModalPrompt(null);
          }}
          onSave={handleSavePrompt}
        />
      )}
    </div>
  );
}

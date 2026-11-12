import React, { useState, useEffect } from 'react';
import { PromptItem } from '../../types.ts';
import { X, Plus, Trash2 } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    title: string;
    description: string;
    category: 'text' | 'image' | 'code';
    content: string;
    tags: string[];
    isFavorite?: boolean;
  }) => Promise<void>;
  initialPrompt?: PromptItem | null;
  defaultCategory?: 'text' | 'image' | 'code';
}

export function PromptModal({
  isOpen,
  onClose,
  onSave,
  initialPrompt,
  defaultCategory = 'text',
}: PromptModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'text' | 'image' | 'code'>(defaultCategory);
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialPrompt) {
      setTitle(initialPrompt.title);
      setDescription(initialPrompt.description);
      setCategory(initialPrompt.category);
      setContent(initialPrompt.content);
      setTagsInput(initialPrompt.tags.join(', '));
      setIsFavorite(initialPrompt.isFavorite);
    } else {
      setTitle('');
      setDescription('');
      setCategory(defaultCategory);
      setContent('');
      setTagsInput('');
      setIsFavorite(false);
    }
  }, [initialPrompt, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await onSave({
        id: initialPrompt?.id,
        title: title.trim(),
        description: description.trim(),
        category,
        content: content.trim(),
        tags,
        isFavorite,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <h3 className="text-lg font-semibold text-neutral-100">
            {initialPrompt ? 'Edit Saved Prompt' : 'Create New Prompt Template'}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Prompt Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Executive Strategy Brief"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="code">Code</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Short Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Produces structured executive bullet points with zero preamble"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-neutral-300">
                Prompt Content *
              </label>
              <span className="text-[11px] text-neutral-400">
                Tip: Use [BRACKETS] for variables like [TOPIC], [TONE]
              </span>
            </div>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Generate high-precision documentation for [TOPIC]. Tone: [TONE]. Exclude all conversational introductions."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono leading-relaxed resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Architecture, Security, Backend"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="fav-check"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="rounded bg-neutral-950 border-neutral-700 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="fav-check" className="text-xs text-neutral-300 cursor-pointer">
              Mark as Favorite Prompt
            </label>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : initialPrompt ? 'Update Prompt' : 'Create Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

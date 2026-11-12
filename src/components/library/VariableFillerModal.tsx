import React, { useState, useEffect } from 'react';
import { PromptItem, NavView } from '../../types.ts';
import { ArrowRight, X, Sparkles } from 'lucide-react';

interface VariableFillerModalProps {
  prompt: PromptItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyPrompt: (finalPromptText: string, category: 'text' | 'image' | 'code') => void;
}

export function VariableFillerModal({
  prompt,
  isOpen,
  onClose,
  onApplyPrompt,
}: VariableFillerModalProps) {
  const [variables, setVariables] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!prompt) return;
    // Extract unique bracketed tokens like [TOPIC], [TONE]
    const matches = prompt.content.match(/\[([A-Z0-9_]+)\]/g) || [];
    const uniqueVars = Array.from(new Set(matches.map((m) => m.slice(1, -1))));
    setVariables(uniqueVars);

    // Initial placeholder values
    const initial: Record<string, string> = {};
    uniqueVars.forEach((v) => {
      initial[v] = '';
    });
    setValues(initial);
  }, [prompt]);

  if (!isOpen || !prompt) return null;

  const handleChange = (varName: string, val: string) => {
    setValues((prev) => ({ ...prev, [varName]: val }));
  };

  const getPopulatedContent = () => {
    let text = prompt.content;
    variables.forEach((v) => {
      const val = values[v]?.trim();
      if (val) {
        text = text.replaceAll(`[${v}]`, val);
      }
    });
    return text;
  };

  const handleApply = () => {
    const finalContent = getPopulatedContent();
    onApplyPrompt(finalContent, prompt.category);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                {prompt.category} Prompt Template
              </span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-100 mt-1">{prompt.title}</h3>
            <p className="text-xs text-neutral-400 mt-0.5">{prompt.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {variables.length > 0 ? (
          <div className="py-4 space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
            <p className="text-xs text-neutral-400">
              Fill in the parameters below. Variables will be automatically injected into your generator.
            </p>
            {variables.map((v) => (
              <div key={v} className="space-y-1">
                <label className="block text-xs font-medium text-neutral-300">
                  {v.replace(/_/g, ' ')}
                </label>
                <input
                  type="text"
                  value={values[v] || ''}
                  onChange={(e) => handleChange(v, e.target.value)}
                  placeholder={`e.g. ${
                    v === 'TOPIC'
                      ? 'Distributed Caching'
                      : v === 'TONE'
                      ? 'Authoritative & direct'
                      : v === 'AUDIENCE'
                      ? 'Senior Backend Architects'
                      : v === 'LANGUAGE'
                      ? 'TypeScript'
                      : v === 'FRAMEWORK'
                      ? 'Express'
                      : v === 'SUBJECT'
                      ? 'matte black titanium headphones'
                      : 'enter value'
                  }`}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-xs text-neutral-400">
            This prompt does not contain dynamic variables. It will be loaded directly into the {prompt.category} generator.
          </div>
        )}

        {/* Live Preview Box */}
        <div className="mt-2 p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
          <span className="text-[11px] font-medium text-neutral-400 block mb-1.5">Prompt Preview</span>
          <p className="text-neutral-300 leading-relaxed max-h-24 overflow-y-auto font-mono text-[11px]">
            {getPopulatedContent()}
          </p>
        </div>

        <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Open in {prompt.category.charAt(0).toUpperCase() + prompt.category.slice(1)} Generator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

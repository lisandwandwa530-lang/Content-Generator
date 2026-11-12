import React from 'react';
import { NavView } from '../../types.ts';
import { Menu, Plus, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface HeaderProps {
  currentView: NavView;
  onOpenMobileSidebar: () => void;
  onNavigate: (view: NavView) => void;
  onOpenCreatePrompt?: () => void;
}

export function Header({ currentView, onOpenMobileSidebar, onNavigate, onOpenCreatePrompt }: HeaderProps) {
  const { user } = useAuth();

  const viewTitles: Record<NavView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Studio Overview',
      subtitle: 'Orchestrate high-precision AI prompts for text, visual art, and code',
    },
    text: {
      title: 'Text Generator',
      subtitle: 'Direct prompt execution with exact formatting, tone, and exclusion control',
    },
    image: {
      title: 'Image Generator',
      subtitle: 'Open-ended generation for any subject, aspect ratio, and composition',
    },
    code: {
      title: 'Code Generator',
      subtitle: 'Production-ready code with syntax highlighting, explanation, and optimization',
    },
    social: {
      title: 'Social Media Distribution',
      subtitle: 'Connect and publish content directly to Instagram, LinkedIn, and Facebook',
    },
    library: {
      title: 'Prompt Library',
      subtitle: 'Curate, parameterize, and reuse modular prompts across your workflows',
    },
    history: {
      title: 'Generation History',
      subtitle: 'Search, review, copy, and regenerate previous studio outputs',
    },
    settings: {
      title: 'Settings & Preferences',
      subtitle: 'Configure default models, code preferences, and workspace parameters',
    },
  };

  const currentInfo = viewTitles[currentView] || viewTitles.dashboard;

  return (
    <header className="h-16 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-900 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-semibold text-neutral-100 tracking-tight leading-none">
            {currentInfo.title}
          </h1>
          <p className="text-xs text-neutral-400 mt-1 hidden sm:block">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {currentView === 'library' && onOpenCreatePrompt && (
          <button
            onClick={onOpenCreatePrompt}
            className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Prompt</span>
          </button>
        )}

        {currentView !== 'library' && (
          <button
            onClick={() => onNavigate('library')}
            className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Browse Library</span>
          </button>
        )}

        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-neutral-800 text-xs text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Gemini 3.8 Studio Connected</span>
        </div>
      </div>
    </header>
  );
}

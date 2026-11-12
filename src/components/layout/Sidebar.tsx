import React from 'react';
import { NavView } from '../../types.ts';
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Code2,
  Bookmark,
  History,
  Settings,
  LogOut,
  X,
  Compass,
  Share2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ currentView, onSelectView, isOpenMobile, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth();

  const navItems: { view: NavView; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { view: 'text', label: 'Text Generator', icon: <FileText className="w-4 h-4" /> },
    { view: 'image', label: 'Image Generator', icon: <ImageIcon className="w-4 h-4" /> },
    { view: 'code', label: 'Code Generator', icon: <Code2 className="w-4 h-4" /> },
    { view: 'social', label: 'Social Media', icon: <Share2 className="w-4 h-4" /> },
    { view: 'library', label: 'Prompt Library', icon: <Bookmark className="w-4 h-4" /> },
    { view: 'history', label: 'Generation History', icon: <History className="w-4 h-4" /> },
    { view: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleSelect = (view: NavView) => {
    onSelectView(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-neutral-950 border-r border-neutral-800/80 flex flex-col transition-transform duration-200 ease-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-neutral-800/80 flex items-center justify-between px-5">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleSelect('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              P
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-white block leading-none">
                PromptStudio
              </span>
              <span className="text-[11px] text-neutral-400 block mt-1 tracking-wider uppercase font-medium">
                AI Studio
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden text-neutral-400 hover:text-white p-1 rounded-md"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Workspace
          </div>
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => handleSelect(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors font-medium text-left cursor-pointer ${
                  isActive
                    ? 'bg-neutral-800 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <span className={isActive ? 'text-indigo-400' : 'text-neutral-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Prompt Accuracy Constitution Banner */}
        <div className="p-3 mx-3 mb-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Strict Accuracy Mode</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Zero hallucinations. Strict adherence to user counts, exclusions, and formats.
          </p>
        </div>

        {/* User Profile Footer */}
        {user && (
          <div className="border-t border-neutral-800/80 p-3 bg-neutral-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-200 shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-neutral-200 truncate">{user.name}</p>
                <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign out"
              className="text-neutral-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

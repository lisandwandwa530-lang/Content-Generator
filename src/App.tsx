import React, { useState } from 'react';
import { NavView, PromptItem } from './types.ts';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider, useToast } from './context/ToastContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { TextGenerator } from './components/generators/TextGenerator.tsx';
import { ImageGenerator } from './components/generators/ImageGenerator.tsx';
import { CodeGenerator } from './components/generators/CodeGenerator.tsx';
import { SocialMediaView } from './components/social/SocialMediaView.tsx';
import { PublishModal } from './components/social/PublishModal.tsx';
import { PromptLibraryView } from './components/library/PromptLibraryView.tsx';
import { GenerationHistoryView } from './components/history/GenerationHistoryView.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { PromptModal } from './components/library/PromptModal.tsx';
import { api } from './services/api.ts';

function StudioApp() {
  const { user, loading } = useAuth();
  const { success, error } = useToast();

  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Dynamic cross-generator prompt passing
  const [activePromptForText, setActivePromptForText] = useState('');
  const [activePromptForImage, setActivePromptForImage] = useState('');
  const [activePromptForCode, setActivePromptForCode] = useState('');

  // Quick save to library modal
  const [saveModalData, setSaveModalData] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    category: 'text' | 'image' | 'code';
    tags: string[];
  }>({
    isOpen: false,
    title: '',
    content: '',
    category: 'text',
    tags: [],
  });

  // Social Publishing Modal State
  const [publishModalData, setPublishModalData] = useState<{
    isOpen: boolean;
    text?: string;
    imageUrl?: string;
    originalPrompt?: string;
  }>({
    isOpen: false,
  });

  const [openCreatePromptInLibrary, setOpenCreatePromptInLibrary] = useState(false);

  // Handle "Use Prompt" trigger from Library or Dashboard
  const handleUsePrompt = (promptText: string, category: 'text' | 'image' | 'code') => {
    if (category === 'text') {
      setActivePromptForText(promptText);
      setCurrentView('text');
    } else if (category === 'image') {
      setActivePromptForImage(promptText);
      setCurrentView('image');
    } else if (category === 'code') {
      setActivePromptForCode(promptText);
      setCurrentView('code');
    }
  };

  // Handle "Save to Library" from inside generators
  const handleOpenSaveModal = (data: {
    title: string;
    content: string;
    category: 'text' | 'image' | 'code';
    tags: string[];
  }) => {
    setSaveModalData({
      isOpen: true,
      ...data,
    });
  };

  const handleSavePromptFromGenerator = async (payload: {
    title: string;
    description: string;
    category: 'text' | 'image' | 'code';
    content: string;
    tags: string[];
    isFavorite?: boolean;
  }) => {
    try {
      await api.createPrompt(payload);
      success('Prompt saved to your Library');
      setSaveModalData((prev) => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      error(err.message || 'Failed to save prompt');
    }
  };

  // Handle "Regenerate" from history
  const handleRegenerateFromHistory = (
    prompt: string,
    type: 'text' | 'image' | 'code',
    parameters?: Record<string, any>
  ) => {
    if (type === 'text') {
      setActivePromptForText(prompt);
      setCurrentView('text');
    } else if (type === 'image') {
      setActivePromptForImage(prompt);
      setCurrentView('image');
    } else if (type === 'code') {
      setActivePromptForCode(prompt);
      setCurrentView('code');
    }
  };

  // Quick publish helper
  const handleOpenPublish = (data?: { text?: string; imageUrl?: string; originalPrompt?: string }) => {
    setPublishModalData({
      isOpen: true,
      text: data?.text || '',
      imageUrl: data?.imageUrl || '',
      originalPrompt: data?.originalPrompt || '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-400 space-y-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm animate-pulse">
          P
        </div>
        <p className="text-xs font-medium tracking-wide">Connecting to PromptStudio AI...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Auth Gate: If not signed in, show Auth Modal */}
      {!user && <AuthModal isOpen={!user} />}

      {/* Desktop & Mobile Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Header */}
        <Header
          currentView={currentView}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onNavigate={setCurrentView}
          onOpenCreatePrompt={() => setOpenCreatePromptInLibrary(true)}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentView}
              onUsePrompt={handleUsePrompt}
              onOpenPublishModal={(text, img) => handleOpenPublish({ text, imageUrl: img })}
            />
          )}

          {currentView === 'text' && (
            <TextGenerator
              initialPrompt={activePromptForText}
              onSaveToLibrary={handleOpenSaveModal}
              onNavigateToHistory={() => setCurrentView('history')}
              onPublishToSocial={(data) => handleOpenPublish(data)}
            />
          )}

          {currentView === 'image' && (
            <ImageGenerator
              initialPrompt={activePromptForImage}
              onSaveToLibrary={handleOpenSaveModal}
              onPublishToSocial={(data) => handleOpenPublish(data)}
            />
          )}

          {currentView === 'code' && (
            <CodeGenerator
              initialPrompt={activePromptForCode}
              onSaveToLibrary={handleOpenSaveModal}
            />
          )}

          {currentView === 'social' && (
            <SocialMediaView
              onOpenPublishModal={(text, img) => handleOpenPublish({ text, imageUrl: img })}
            />
          )}

          {currentView === 'library' && (
            <PromptLibraryView
              onUsePrompt={handleUsePrompt}
              openCreateModal={openCreatePromptInLibrary}
              onResetCreateModalFlag={() => setOpenCreatePromptInLibrary(false)}
            />
          )}

          {currentView === 'history' && (
            <GenerationHistoryView onRegenerate={handleRegenerateFromHistory} />
          )}

          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Save to Library Modal from Generators */}
      {saveModalData.isOpen && (
        <PromptModal
          isOpen={saveModalData.isOpen}
          defaultCategory={saveModalData.category}
          initialPrompt={{
            id: '',
            userId: '',
            title: saveModalData.title,
            description: '',
            category: saveModalData.category,
            content: saveModalData.content,
            tags: saveModalData.tags,
            isFavorite: false,
            createdAt: '',
            updatedAt: '',
          }}
          onClose={() => setSaveModalData((prev) => ({ ...prev, isOpen: false }))}
          onSave={handleSavePromptFromGenerator}
        />
      )}

      {/* Global Social Media Publishing Modal */}
      {publishModalData.isOpen && (
        <PublishModal
          isOpen={publishModalData.isOpen}
          onClose={() => setPublishModalData({ isOpen: false })}
          initialText={publishModalData.text}
          initialImageUrl={publishModalData.imageUrl}
          originalPrompt={publishModalData.originalPrompt}
          onSuccess={() => {
            // Optional callback
          }}
          onNavigateToSocialSettings={() => {
            setPublishModalData({ isOpen: false });
            setCurrentView('social');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <StudioApp />
      </AuthProvider>
    </ToastProvider>
  );
}

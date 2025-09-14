import React, { useState, useMemo, useCallback, memo } from 'react';
import { WordPressSite, AppboardViewProps, ContentType, GeneratedContent, ArticleContent } from '@/types/types';
import { useLanguage } from '@/contexts/LanguageContext';
import AddSiteModal from '@/components/AddSiteModal';
import IdeaGeneratorModal from '@/components/IdeaGeneratorModal';
import { PlusCircleIcon } from '@/lib/constants';

// Import sub-components
import StatsOverview from '@/components/AppboardView/StatsOverview';
import QuickActions from '@/components/AppboardView/QuickActions';
import MySites from '@/components/AppboardView/MySites';
import PerformanceSnapshot from '@/components/AppboardView/PerformanceSnapshot';
import RecentActivity from '@/components/AppboardView/RecentActivity';

const AppboardView: React.FC<AppboardViewProps> = ({ 
  sites, 
  onAddSite, 
  onRemoveSite, 
  isLoading, 
  onManageSite, 
  onNavigateToNewContent, 
  contentLibrary 
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const { t } = useLanguage();

  const sortedActivity = useMemo(() => 
    [...contentLibrary].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), 
  [contentLibrary]);

  const recentActivity = useMemo(() => sortedActivity.slice(0, 5), [sortedActivity]);
  
  const topPerformingPost = useMemo(() => 
      recentActivity
        .filter(a => a.type === 'ARTICLE' && (a as any).performance_stats?.views > 0)
        .sort((a,b) => (b as any).performance_stats?.views - (a as any).performance_stats?.views)[0]
  , [recentActivity]) as ArticleContent | undefined;

  const stats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return {
        totalSites: sites.length,
        contentLast30Days: contentLibrary.filter(item => new Date(item.createdAt) > thirtyDaysAgo).length,
        totalLibraryItems: contentLibrary.length,
    };
  }, [sites, contentLibrary]);

  const handleIdeaSelected = useCallback((title: string) => {
      setIsIdeaModalOpen(false);
      onNavigateToNewContent('ARTICLE' as ContentType, title);
  }, [onNavigateToNewContent]);

  const handleAnalyzeClick = useCallback(() => {
      setIsIdeaModalOpen(true);
  }, []);

  const handleAddModalClose = useCallback(() => {
      setIsAddModalOpen(false);
  }, []);

  const handleIdeaModalClose = useCallback(() => {
      setIsIdeaModalOpen(false);
  }, []);

  const handleAddSite = useCallback(async (newSite: any) => {
      await onAddSite(newSite);
      setIsAddModalOpen(false);
  }, [onAddSite]);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-foreground">{t('appboard')}</h1>
            <p className="text-muted-foreground mt-1">{t('appboardHint')}</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="modern-button-primary px-6 py-2 flex items-center justify-center"
        >
          <PlusCircleIcon className="me-2"/> {t('addNewSite')}
        </button>
      </header>

      <StatsOverview 
        totalSites={stats.totalSites}
        contentLast30Days={stats.contentLast30Days}
        totalLibraryItems={stats.totalLibraryItems}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <QuickActions onNavigateToNewContent={onNavigateToNewContent} />
            
            <MySites 
              sites={sites}
              isLoading={isLoading}
              onRemoveSite={onRemoveSite}
              onManageSite={onManageSite}
            />
          </div>

          <div className="xl:col-span-1 space-y-6">
            <PerformanceSnapshot 
              topPerformingPost={topPerformingPost}
              onAnalyzeClick={handleAnalyzeClick}
            />
            
            <RecentActivity recentActivity={recentActivity} />
          </div>
      </div>
      
      {isAddModalOpen && (
        <AddSiteModal
            isOpen={isAddModalOpen}
            onClose={handleAddModalClose}
            onAddSite={handleAddSite}
            sites={sites}
        />
      )}
      {isIdeaModalOpen && (
        <IdeaGeneratorModal
            isOpen={isIdeaModalOpen}
            onClose={handleIdeaModalClose}
            onIdeaSelect={handleIdeaSelected}
            sites={sites}
        />
      )}
    </div>
  );
};

export default memo(AppboardView);
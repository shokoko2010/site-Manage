import React, { useState, useMemo } from 'react';
import { WordPressSite, AppboardViewProps, ContentType, GeneratedContent, ArticleContent } from '@/types/types';
import { useLanguage } from '@/contexts/LanguageContext';
import AddSiteModal from '../AddSiteModal';
import IdeaGeneratorModal from '../IdeaGeneratorModal';
import { PlusCircleIcon } from '@/lib/constants';

// Import sub-components
import StatsOverview from './StatsOverview';
import QuickActions from './QuickActions';
import MySites from './MySites';
import PerformanceSnapshot from './PerformanceSnapshot';
import RecentActivity from './RecentActivity';

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

  const handleIdeaSelected = (title: string) => {
      setIsIdeaModalOpen(false);
      onNavigateToNewContent(ContentType.Article, title);
  }

  const handleAnalyzeClick = () => {
      setIsIdeaModalOpen(true);
  }

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
            onClose={() => setIsAddModalOpen(false)}
            onAddSite={onAddSite}
            sites={sites}
        />
      )}
      {isIdeaModalOpen && (
        <IdeaGeneratorModal
            isOpen={isIdeaModalOpen}
            onClose={() => setIsIdeaModalOpen(false)}
            onIdeaSelect={handleIdeaSelected}
            sites={sites}
        />
      )}
    </div>
  );
};

export default AppboardView;
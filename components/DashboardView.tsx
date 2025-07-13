import React, { useState, useContext, useMemo } from 'react';
import { WordPressSite, LanguageContextType, DashboardViewProps, ContentType, GeneratedContent } from '../types';
import SiteCard from './SiteCard';
import Spinner from './common/Spinner';
import { LanguageContext } from '../App';
import AddSiteModal from './AddSiteModal';
import { PlusCircleIcon, CampaignIcon, ArticleIcon, ClockIcon, ChartPieIcon, EyeIcon, ChatBubbleLeftIcon, ArrowUpRightIcon, ProductIcon, GlobeIcon, LibraryIcon } from '../constants';
import IdeaGeneratorModal from './IdeaGeneratorModal';

const StatCard = ({ icon, value, label }: { icon: React.ReactNode, value: string | number, label: string }) => (
    <div className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700/50 flex items-center space-x-4 rtl:space-x-reverse transition-all hover:border-indigo-500/50 hover:-translate-y-1">
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-indigo-400">
            {icon}
        </div>
        <div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400">{label}</p>
        </div>
    </div>
);


const DashboardView: React.FC<DashboardViewProps> = ({ sites, onAddSite, onRemoveSite, isLoading, onManageSite, onNavigateToNewContent, recentActivity, contentLibrary }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
  
  const topPerformingPost = recentActivity
    .filter(a => a.type === 'ARTICLE' && (a as any).performance_stats?.views > 0)
    .sort((a,b) => (b as any).performance_stats?.views - (a as any).performance_stats?.views)[0];

  const stats = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return {
        totalSites: sites.length,
        contentLast30Days: contentLibrary.filter(item => new Date(item.createdAt) > thirtyDaysAgo).length,
        totalLibraryItems: contentLibrary.length,
    };
  }, [sites, contentLibrary]);

  const QuickActionButton = ({ title, icon, onClick }: { title: string, icon: React.ReactNode, onClick: () => void }) => (
    <button
      onClick={onClick}
      className="p-4 bg-gray-800 rounded-xl shadow-lg border border-gray-700/50 hover:bg-gray-700/70 hover:-translate-y-1 transition-all flex flex-col items-center justify-center text-center w-full"
    >
      <div className="mb-2 p-3 rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-400">
        {icon}
      </div>
      <span className="font-semibold text-white">{title}</span>
    </button>
  );

  const ActivityItem = ({ item }: {item: GeneratedContent}) => (
    <div className="flex items-center space-x-4 rtl:space-x-reverse p-3 hover:bg-gray-700/50 rounded-lg">
      <div className="flex-shrink-0 bg-gray-700 p-2 rounded-lg">
        {item.type === ContentType.Article ? <ArticleIcon /> : <ProductIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.title}</p>
        <p className="text-xs text-gray-400 flex items-center">
            <ClockIcon className="w-4 h-4" />
            <span className="ms-1">{new Date(item.createdAt).toLocaleDateString()}</span>
        </p>
      </div>
    </div>
  );

  const handleIdeaSelected = (title: string) => {
      setIsIdeaModalOpen(false);
      onNavigateToNewContent(ContentType.Article, title);
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white">{t('dashboard')}</h1>
            <p className="text-gray-400 mt-1">{t('dashboardHint')}</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-gradient text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-transform hover:scale-105">
            <PlusCircleIcon className="me-2"/> {t('addNewSite')}
        </button>
      </header>

       {/* Stats Overview */}
        <section className="mb-8">
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                 <StatCard icon={<GlobeIcon />} value={stats.totalSites} label={t('totalSites')} />
                 <StatCard icon={<ChartPieIcon />} value={stats.contentLast30Days} label={t('contentLast30Days')} />
                 <StatCard icon={<LibraryIcon />} value={stats.totalLibraryItems} label={t('totalLibraryItems')} />
             </div>
        </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
             {/* Quick Actions */}
            <section>
                <h2 className="text-xl font-semibold text-gray-300 mb-4">{t('quickActions')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <QuickActionButton title={t('article')} icon={<ArticleIcon />} onClick={() => onNavigateToNewContent(ContentType.Article)} />
                    <QuickActionButton title={t('product')} icon={<ProductIcon />} onClick={() => onNavigateToNewContent(ContentType.Product)} />
                    <QuickActionButton title={t('campaign')} icon={<CampaignIcon />} onClick={() => onNavigateToNewContent(ContentType.Campaign)} />
                </div>
            </section>
            
            {/* My Sites */}
            <section>
              <h2 className="text-xl font-semibold text-gray-300 mb-4">{t('mySites')}</h2>
              {isLoading ? (
                <div className="flex justify-center items-center h-48 bg-gray-800 rounded-xl"><Spinner /></div>
              ) : sites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sites.map(site => (
                    <SiteCard key={site.id} site={site} onRemove={onRemoveSite} onManage={onManageSite} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl">
                  <h3 className="text-white font-semibold">{t('noSites')}</h3>
                  <p className="text-gray-500 text-sm mt-1">{t('noSitesHint')}</p>
                </div>
              )}
            </section>
          </div>

          <div className="xl:col-span-1 space-y-6">
              {/* Performance Snapshot Placeholder */}
              {topPerformingPost && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-300 mb-4">{t('performanceSnapshot')}</h2>
                   <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50">
                        <h3 className="font-semibold text-indigo-400 mb-2">{t('topPerformingArticle')}</h3>
                        <p className="text-white font-bold text-lg mb-3">{topPerformingPost.title}</p>
                        <div className="flex justify-around text-center text-sm mb-4 border-y border-gray-700 py-3">
                            <div className="text-gray-300 flex items-center"><EyeIcon/> <span className="ms-2">{ (topPerformingPost as any).performance_stats?.views || 0 } {t('views')}</span></div>
                            <div className="text-gray-300 flex items-center"><ChatBubbleLeftIcon/> <span className="ms-2">{ (topPerformingPost as any).performance_stats?.comments || 0 } {t('comments')}</span></div>
                        </div>
                        <div className="flex space-x-2 rtl:space-x-reverse">
                           <a href={(topPerformingPost as any).link} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center">
                             {t('viewArticle')} <ArrowUpRightIcon className="ms-1 h-4 w-4" />
                           </a>
                           <button onClick={() => setIsIdeaModalOpen(true)} className="flex-1 text-sm btn-gradient text-white font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center">
                             {t('analyzeAndGenerate')}
                           </button>
                        </div>
                    </div>
                </section>
              )}
            
              {/* Recent Activity */}
              <section>
                <h2 className="text-xl font-semibold text-gray-300 mb-4">{t('recentActivity')}</h2>
                <div className="bg-gray-800 rounded-xl p-3 border border-gray-700/50">
                    <div className="space-y-1">
                        {recentActivity.length > 0 ? (
                            recentActivity.map(item => <ActivityItem key={item.id} item={item} />)
                        ) : (
                            <p className="text-center text-sm text-gray-500 p-4">{t('noActivity')}</p>
                        )}
                    </div>
                </div>
              </section>
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
      {isIdeaModalOpen && topPerformingPost && (
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

export default DashboardView;

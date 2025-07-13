import React, { useMemo, useContext } from 'react';
import { GeneratedContent, ContentType, WordPressSite, Notification, ArticleContent, LanguageContextType } from '../types';
import { LanguageContext } from '../App';
import ContentCard from './ContentCard';

interface ContentLibraryViewProps {
  library: GeneratedContent[];
  sites: WordPressSite[];
  onRemoveFromLibrary: (contentId: string) => void;
  showNotification: (notification: Notification) => void;
  onEdit: (content: ArticleContent) => void;
  onScheduleAll: () => void;
}

const ContentLibraryView: React.FC<ContentLibraryViewProps> = ({ library, sites, onRemoveFromLibrary, showNotification, onEdit, onScheduleAll }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const hasUnscheduledItems = useMemo(() => library.some(c => !c.scheduledFor && c.status === 'draft'), [library]);

    // Group by status for better organization
    const drafts = library.filter(c => c.status === 'draft' && !c.scheduledFor);
    const scheduled = library.filter(c => c.status === 'draft' && c.scheduledFor).sort((a,b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime());
    const published = library.filter(c => c.status === 'published').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
  return (
    <div className="p-8 h-full">
      <header className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white">{t('libraryTitle')}</h1>
            <p className="text-gray-400 mt-1">{t('libraryHint')}</p>
        </div>
        {hasUnscheduledItems && (
            <button 
                onClick={onScheduleAll} 
                className="btn-gradient text-white font-bold py-2 px-4 rounded-lg transition-transform hover:scale-105"
            >
                {t('scheduleAll')}
            </button>
        )}
      </header>

      {library.length > 0 ? (
        <div className="space-y-8">
            {drafts.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-300 mb-4">{t('draft')}s</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {drafts.map(content => (
                            <ContentCard 
                                key={content.id}
                                content={content}
                                site={sites.find(s => s.id === content.siteId)}
                                onEdit={onEdit}
                                onRemove={onRemoveFromLibrary}
                                showNotification={showNotification}
                                onRemoveFromLibrary={onRemoveFromLibrary}
                                allSites={sites}
                            />
                        ))}
                    </div>
                </section>
            )}
             {scheduled.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-300 mb-4">{t('tableScheduled')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {scheduled.map(content => (
                            <ContentCard 
                                key={content.id}
                                content={content}
                                site={sites.find(s => s.id === content.siteId)}
                                onEdit={onEdit}
                                onRemove={onRemoveFromLibrary}
                                showNotification={showNotification}
                                onRemoveFromLibrary={onRemoveFromLibrary}
                                allSites={sites}
                            />
                        ))}
                    </div>
                </section>
            )}
             {published.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-300 mb-4">{t('published')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {published.map(content => (
                            <ContentCard 
                                key={content.id}
                                content={content}
                                site={sites.find(s => s.id === content.siteId)}
                                onEdit={onEdit}
                                onRemove={onRemoveFromLibrary}
                                showNotification={showNotification}
                                onRemoveFromLibrary={onRemoveFromLibrary}
                                allSites={sites}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl">
            <h3 className="text-white font-semibold">{t('libraryEmpty')}</h3>
            <p className="text-gray-500 text-sm mt-1">{t('libraryEmptyHint')}</p>
        </div>
      )}
    </div>
  );
};

export default ContentLibraryView;
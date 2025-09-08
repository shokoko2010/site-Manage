import React, { useMemo, useState } from 'react';
import { GeneratedContent, ContentType, WordPressSite, Notification, ArticleContent } from '@/types/types';
import { useLanguage } from '../contexts/LanguageContext';
import ContentCard from './ContentCard';
import AdvancedContentManager from './AdvancedContentManager';
import ContentVersionManager from './ContentVersionManager';
import { SettingsIcon, ClockIcon } from '../lib/constants';

interface ContentLibraryViewProps {
  library: GeneratedContent[];
  sites: WordPressSite[];
  onRemoveFromLibrary: (contentId: string) => void;
  showNotification: (notification: Notification) => void;
  onEdit: (content: ArticleContent) => void;
  onScheduleAll: () => void;
  onUpdateLibraryItem: (contentId: string, updates: Partial<GeneratedContent>) => void;
}

const ContentLibraryView: React.FC<ContentLibraryViewProps> = ({ library, sites, onRemoveFromLibrary, showNotification, onEdit, onScheduleAll, onUpdateLibraryItem }) => {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'advanced' | 'versions'>('grid');
    const [selectedContentForVersions, setSelectedContentForVersions] = useState<GeneratedContent | null>(null);
    const hasUnscheduledItems = useMemo(() => library.some(c => !c.scheduledFor && c.status === 'draft'), [library]);

    // Group by status for better organization
    const drafts = library.filter(c => c.status === 'draft' && !c.scheduledFor);
    const scheduled = library.filter(c => c.status === 'draft' && c.scheduledFor).sort((a,b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime());
    const published = library.filter(c => c.status === 'published').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleEditContent = (content: GeneratedContent) => {
      if (content.type === ContentType.Article) {
        onEdit(content as ArticleContent);
      }
    };

    const handleRestoreVersion = (restoredContent: GeneratedContent) => {
      onUpdateLibraryItem(restoredContent.id, restoredContent);
      showNotification({ message: t('versionRestored'), type: 'success' });
    };

    const handleDeleteContent = (contentId: string) => {
      onRemoveFromLibrary(contentId);
      showNotification({ message: t('contentDeleted'), type: 'info' });
    };

    if (viewMode === 'advanced') {
      return (
        <AdvancedContentManager
          contentLibrary={library}
          onUpdateContent={onUpdateLibraryItem}
          onDeleteContent={handleDeleteContent}
          onEditContent={handleEditContent}
          sites={sites.map(site => ({ id: site.id, name: site.name }))}
        />
      );
    }

    if (viewMode === 'versions' && selectedContentForVersions) {
      return (
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setViewMode('grid')}
              className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← {t('backToLibrary')}
            </button>
            <h2 className="text-xl font-bold text-white">
              {t('versionManagementFor')}: {selectedContentForVersions.title}
            </h2>
            <div></div>
          </div>
          <ContentVersionManager
            content={selectedContentForVersions}
            onRestoreVersion={handleRestoreVersion}
            onUpdateContent={onUpdateLibraryItem}
          />
        </div>
      );
    }

    return (
    <div className="p-8 h-full overflow-y-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white">{t('libraryTitle')}</h1>
            <p className="text-gray-400 mt-1">{t('libraryHint')}</p>
        </div>
        <div className="flex items-center space-x-4">
          {hasUnscheduledItems && (
            <button 
                onClick={onScheduleAll} 
                className="btn-gradient text-white font-bold py-2 px-4 rounded-lg transition-transform hover:scale-105"
            >
                {t('scheduleAll')}
            </button>
          )}
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title={t('gridView')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title={t('listView')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('advanced')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'advanced' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title={t('advancedManagement')}
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {library.length > 0 ? (
        <div className="space-y-8">
             {published.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-300 mb-4">{t('published')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {published.map(content => (
                            <ContentCard 
                                key={content.id}
                                content={content}
                                site={sites.find(s => s.id === content.siteId)}
                                onEdit={handleEditContent}
                                onRemove={handleDeleteContent}
                                showNotification={showNotification}
                                onUpdateLibraryItem={onUpdateLibraryItem}
                                allSites={sites}
                                onVersionManage={() => {
                                  setSelectedContentForVersions(content);
                                  setViewMode('versions');
                                }}
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
                                onEdit={handleEditContent}
                                onRemove={handleDeleteContent}
                                showNotification={showNotification}
                                onUpdateLibraryItem={onUpdateLibraryItem}
                                allSites={sites}
                                onVersionManage={() => {
                                  setSelectedContentForVersions(content);
                                  setViewMode('versions');
                                }}
                            />
                        ))}
                    </div>
                </section>
            )}
            {drafts.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold text-gray-300 mb-4">{t('draft')}s</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {drafts.map(content => (
                            <ContentCard 
                                key={content.id}
                                content={content}
                                site={sites.find(s => s.id === content.siteId)}
                                onEdit={handleEditContent}
                                onRemove={handleDeleteContent}
                                showNotification={showNotification}
                                onUpdateLibraryItem={onUpdateLibraryItem}
                                allSites={sites}
                                onVersionManage={() => {
                                  setSelectedContentForVersions(content);
                                  setViewMode('versions');
                                }}
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

import React, { useState, useContext, useMemo } from 'react';
import { GeneratedContent, ContentType, WordPressSite, PublishingOptions, Notification, ArticleContent, LanguageContextType } from '../types';
import { ArticleIcon, CameraIcon, ProductIcon, PublishIcon, TrashIcon, EditIcon } from '../constants';
import PublishModal from './PublishModal';
import { publishContent } from '../services/wordpressService';
import { LanguageContext } from '../App';

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
    const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    
    const hasUnscheduledItems = useMemo(() => library.some(c => !c.scheduledFor), [library]);

    const openPublishModal = (content: GeneratedContent) => {
        setSelectedContent(content);
        setIsPublishModalOpen(true);
    };

    const handlePublish = async (options: PublishingOptions) => {
        const selectedSite = sites.find(s => s.id === options.siteId);
        if (!selectedContent || !selectedSite) {
            showNotification({ message: 'Selected site not found.', type: 'error' });
            return;
        }
        setIsPublishing(true);

        try {
            const result = await publishContent(selectedSite, selectedContent, options);
            const message = options.status === 'future' 
                ? `Successfully scheduled! It will be published on ${new Date(options.scheduledAt!).toLocaleString()}.`
                : t('publishSuccess', { url: result.postUrl });

            showNotification({ message, type: 'success' });
            onRemoveFromLibrary(selectedContent.id);
            setIsPublishModalOpen(false);
            setSelectedContent(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
            showNotification({ message: t('publishFail', { error: errorMessage }), type: 'error' });
        } finally {
            setIsPublishing(false);
        }
    };

  return (
    <div className="p-8 h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t('libraryTitle')}</h1>
        <p className="text-gray-400 mt-1">{t('libraryHint')}</p>
      </header>

      <div className="bg-gray-800 rounded-lg shadow-lg">
        <div className="overflow-x-auto">
            {library.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700/50">
                        <tr>
                        <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-300 uppercase tracking-wider">{t('tableTitle')}</th>
                        <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-300 uppercase tracking-wider">{t('tableType')}</th>
                        <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-300 uppercase tracking-wider">{t('tableCreated')}</th>
                        <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-300 uppercase tracking-wider">{t('tableScheduled')}</th>
                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">{t('tableActions')}</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {library.map(content => {
                          const contentSite = sites.find(s => s.id === content.siteId);
                          const isVirtual = contentSite?.isVirtual;

                          return (
                            <tr key={content.id} className="hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-white flex items-center">
                                        {content.title}
                                        {content.type === ContentType.Article && (content as ArticleContent).featuredImage && (
                                            <CameraIcon className="ms-2 text-blue-400 flex-shrink-0"/>
                                        )}
                                    </div>
                                    {isVirtual && <span className="text-xs text-purple-400">{t('virtualSite')}: {contentSite.name}</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {content.type === ContentType.Article ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
                                            <ArticleIcon/> <span className="ms-1.5">{t('article')}</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                                            <ProductIcon/> <span className="ms-1.5">{t('product')}</span>
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    {new Date(content.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    {content.scheduledFor ? new Date(content.scheduledFor).toLocaleDateString() : '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium space-x-2 rtl:space-x-reverse">
                                    {!isVirtual && content.type === ContentType.Article && (
                                        <button onClick={() => onEdit(content as ArticleContent)} className="text-yellow-400 hover:text-yellow-300 transition-colors p-1 rounded-md inline-flex items-center">
                                            <EditIcon/>
                                            <span className="ms-1">{t('edit')}</span>
                                        </button>
                                    )}
                                    {!isVirtual && (
                                        <button onClick={() => openPublishModal(content)} className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded-md inline-flex items-center">
                                            <PublishIcon/>
                                            <span className="ms-1">{t('publish')}</span>
                                        </button>
                                    )}
                                    <button onClick={() => onRemoveFromLibrary(content.id)} className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-md inline-flex items-center">
                                        <TrashIcon/>
                                        <span className="ms-1">{t('delete')}</span>
                                    </button>
                                </td>
                            </tr>
                          );
                        })}
                    </tbody>
                </table>
            ) : (
                <div className="text-center py-16">
                    <p className="text-gray-400">{t('libraryEmpty')}</p>
                    <p className="text-gray-500 text-sm mt-1">{t('libraryEmptyHint')}</p>
                </div>
            )}
        </div>
        {library.length > 0 && hasUnscheduledItems && (
            <div className="p-4 bg-gray-700/50 flex justify-end">
                <button 
                    onClick={onScheduleAll} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    {t('scheduleAll')}
                </button>
            </div>
        )}
      </div>
      {isPublishModalOpen && selectedContent && (
        <PublishModal
            content={selectedContent}
            sites={sites}
            isOpen={isPublishModalOpen}
            onClose={() => setIsPublishModalOpen(false)}
            onPublish={handlePublish}
            isPublishing={isPublishing}
        />
      )}
    </div>
  );
};

export default ContentLibraryView;
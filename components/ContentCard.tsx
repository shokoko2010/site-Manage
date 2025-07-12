import React, { useState, useContext } from 'react';
import { GeneratedContent, WordPressSite, ContentType, ArticleContent, LanguageContextType, PublishingOptions } from '../types';
import { ArticleIcon, ProductIcon, ClockIcon, TrashIcon, EditIcon, PublishIcon } from './constants';
import { LanguageContext } from '../App';
import PublishModal from './PublishModal';
import { publishContent } from '../services/wordpressService';

interface ContentCardProps {
    content: GeneratedContent;
    site?: WordPressSite;
    onEdit: (content: ArticleContent) => void;
    onRemove: (contentId: string) => void;
    showNotification: (notification: any) => void;
    onRemoveFromLibrary: (contentId: string) => void;
    allSites: WordPressSite[];
}

const ContentCard: React.FC<ContentCardProps> = ({ content, site, onEdit, onRemove, showNotification, onRemoveFromLibrary, allSites }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const isArticle = content.type === ContentType.Article;
    const article = isArticle ? (content as ArticleContent) : null;
    const isVirtual = site?.isVirtual;
    
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const openPublishModal = () => {
        setIsPublishModalOpen(true);
    };

    const handlePublish = async (options: PublishingOptions) => {
        const selectedSite = allSites.find(s => s.id === options.siteId);
        if (!content || !selectedSite) {
            showNotification({ message: 'Selected site not found.', type: 'error' });
            return;
        }
        setIsPublishing(true);

        try {
            const result = await publishContent(selectedSite, content, options);
            const message = options.status === 'future' 
                ? `Successfully scheduled! It will be published on ${new Date(options.scheduledAt!).toLocaleString()}.`
                : t('publishSuccess', { url: result.postUrl });

            showNotification({ message, type: 'success' });
            onRemoveFromLibrary(content.id);
            setIsPublishModalOpen(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
            showNotification({ message: t('publishFail', { error: errorMessage }), type: 'error' });
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700/50 flex flex-col group relative transition-all duration-300 hover:border-indigo-500/50 hover:shadow-indigo-500/10 hover:-translate-y-1">
            <div className="relative">
                {isArticle && article?.featuredImage ? (
                     <img src={`data:image/jpeg;base64,${article.featuredImage}`} alt={content.title} className="w-full h-32 object-cover rounded-t-xl" />
                ) : (
                    <div className="w-full h-32 bg-gray-700 rounded-t-xl flex items-center justify-center">
                        <div className="text-gray-500">{isArticle ? <ArticleIcon className="w-10 h-10"/> : <ProductIcon className="w-10 h-10"/>}</div>
                    </div>
                )}
                 <div className="absolute top-2 right-2 bg-gray-900/50 p-1.5 rounded-full backdrop-blur-sm">
                    {isArticle ? (
                        <span title={t('article')}><ArticleIcon className="w-4 h-4 text-purple-300"/></span>
                    ) : (
                        <span title={t('product')}><ProductIcon className="w-4 h-4 text-green-300"/></span>
                    )}
                 </div>
            </div>
            <div className="p-4 flex-grow flex flex-col">
                <h3 className="font-bold text-white mb-2 flex-grow" title={content.title}>{content.title}</h3>
                <div className="text-xs text-gray-400 flex items-center mt-2">
                    <ClockIcon className="w-4 h-4 me-1.5"/>
                    {content.scheduledFor ? (
                        <span>Scheduled: {new Date(content.scheduledFor).toLocaleDateString()}</span>
                    ) : (
                        <span>Created: {new Date(content.createdAt).toLocaleDateString()}</span>
                    )}
                </div>
                 {site && <div className="text-xs text-gray-400 mt-1">For: <span className="font-semibold text-gray-300">{site.name}</span></div>}
            </div>

             <div className="absolute inset-0 bg-gray-900/70 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
                <div className="flex items-center space-x-2">
                     {!isVirtual && isArticle && (
                        <button onClick={() => onEdit(article as ArticleContent)} className="bg-gray-700 hover:bg-yellow-500 text-white p-3 rounded-full transition-colors" title={t('edit')}>
                            <EditIcon/>
                        </button>
                    )}
                     {!isVirtual && (
                        <button onClick={openPublishModal} className="bg-gray-700 hover:bg-sky-500 text-white p-3 rounded-full transition-colors" title={t('publish')}>
                            <PublishIcon/>
                        </button>
                    )}
                    <button onClick={() => onRemove(content.id)} className="bg-gray-700 hover:bg-red-500 text-white p-3 rounded-full transition-colors" title={t('delete')}>
                        <TrashIcon/>
                    </button>
                </div>
            </div>
             {isPublishModalOpen && (
                <PublishModal
                    content={content}
                    sites={allSites}
                    isOpen={isPublishModalOpen}
                    onClose={() => setIsPublishModalOpen(false)}
                    onPublish={handlePublish}
                    isPublishing={isPublishing}
                />
            )}
        </div>
    );
};

export default ContentCard;

import React, { useState, useEffect, useContext } from 'react';
import { GeneratedContent, PublishingOptions, WordPressSite, ContentType, ArticleContent, LanguageContextType } from '../types';
import Modal from './common/Modal';
import Spinner from './common/Spinner';
import { LanguageContext } from '../App';

interface PublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPublish: (options: PublishingOptions) => void;
    content: GeneratedContent;
    sites: WordPressSite[];
    isPublishing?: boolean;
    mode?: 'publish' | 'update';
}

const toDatetimeLocal = (isoDate?: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    // Adjust for timezone offset
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
};


const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, onPublish, content, sites, isPublishing, mode = 'publish' }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [options, setOptions] = useState<Partial<PublishingOptions>>({
        siteId: content.siteId || (sites.length > 0 ? sites[0].id : undefined),
        status: 'publish',
        categories: '',
        tags: '',
        scheduledAt: content.scheduledFor ? toDatetimeLocal(content.scheduledFor) : '',
        // WooCommerce specific
        price: '',
        salePrice: '',
        sku: '',
        stockStatus: 'instock',
    });
     const [isScheduled, setIsScheduled] = useState(!!content.scheduledFor);

    useEffect(() => {
        // Set default site if one isn't selected but sites are available
        if (sites.length > 0 && !options.siteId) {
            setOptions(prev => ({ ...prev, siteId: sites[0].id }));
        }
        // Sync scheduled state with content
         if (content.scheduledFor) {
            setIsScheduled(true);
            setOptions(prev => ({ ...prev, scheduledAt: toDatetimeLocal(content.scheduledFor) }));
        }
    }, [sites, options.siteId, content.scheduledFor]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setOptions(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const handleSubmit = () => {
        if (!options.siteId) {
            alert("Please select a site to publish to.");
            return;
        }
        
        let finalStatus: PublishingOptions['status'] = 'publish';
        if (isScheduled && options.scheduledAt) {
            finalStatus = 'future';
        } else if (options.status) {
            finalStatus = options.status;
        }


        onPublish({ ...options, status: finalStatus } as PublishingOptions);
    };

    if (!isOpen) return null;

    const articleContent = content.type === ContentType.Article ? (content as ArticleContent) : null;
    const modalTitle = mode === 'update' ? t('updateTitle', { title: content.title }) : t('publishTitle', { title: content.title });
    const confirmButtonText = isScheduled ? t('scheduleFor') : (mode === 'update' ? t('confirmUpdate') : t('confirmPublish'));


    return (
        <Modal title={modalTitle} onClose={onClose} size="xl">
            <div className="space-y-4 text-gray-300 max-h-[70vh] overflow-y-auto p-1">
                {articleContent?.featuredImage && (
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('featuredImage')}</label>
                        <img 
                            src={articleContent.featuredImage.startsWith('data:') ? articleContent.featuredImage : `data:image/jpeg;base64,${articleContent.featuredImage}`} 
                            alt="Featured image preview"
                            className="rounded-lg w-full object-cover max-h-64"
                        />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium">{t('publishToSite')}</label>
                    <select name="siteId" value={options.siteId} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm text-white disabled:bg-gray-800">
                         {sites.length > 0 ? (
                            sites.filter(s => !s.isVirtual).map(site => <option key={site.id} value={site.id}>{site.name}</option>)
                         ) : (
                            <option>{t('noSitesAvailable')}</option>
                         )}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">{t('categories')}</label>
                    <input type="text" name="categories" value={options.categories} onChange={handleChange} placeholder="e.g. tech, news" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium">{t('tags')}</label>
                    <input type="text" name="tags" value={options.tags} onChange={handleChange} placeholder="e.g. ai, wordpress" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                {content.type === ContentType.Product && (
                    <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">{t('regularPrice')}</label>
                            <input type="text" name="price" value={options.price} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{t('salePrice')}</label>
                            <input type="text" name="salePrice" value={options.salePrice} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">{t('sku')}</label>
                        <input type="text" name="sku" value={options.sku} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">{t('stockStatus')}</label>
                        <select name="stockStatus" value={options.stockStatus} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="instock">{t('inStock')}</option>
                            <option value="outofstock">{t('outOfStock')}</option>
                        </select>
                    </div>
                    </>
                )}
                 <div>
                    <label className="block text-sm font-medium">{t('status')}</label>
                    <select name="status" value={options.status} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={isScheduled}>
                        <option value="publish">{t('published')}</option>
                        <option value="draft">{t('draft')}</option>
                        <option value="pending">{t('pendingReview')}</option>
                    </select>
                </div>
                
                 <div className="p-3 bg-gray-700/50 rounded-lg">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} className="h-4 w-4 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500 bg-gray-700" />
                        <span className="ms-2 text-sm text-gray-200 font-medium">{t('scheduleFor')}</span>
                    </label>
                    {isScheduled && (
                        <input 
                            type="datetime-local" 
                            name="scheduledAt" 
                            value={options.scheduledAt} 
                            onChange={handleChange}
                            className="mt-2 block w-full bg-gray-600 border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    )}
                </div>

            </div>
            <div className="mt-6 flex justify-end space-x-3 rtl:space-x-reverse">
                 <button onClick={onClose} disabled={isPublishing} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">{t('cancel')}</button>
                 <button onClick={handleSubmit} disabled={isPublishing || !options.siteId} className="btn-gradient text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed">
                    {isPublishing ? <Spinner size="sm" /> : confirmButtonText}
                 </button>
            </div>
        </Modal>
    );
};

export default PublishModal;
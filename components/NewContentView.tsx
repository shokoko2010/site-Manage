
import React, { useState, useEffect, useContext } from 'react';
import { ArticleContent, ContentType, GeneratedContent, Language, ProductContent, WordPressSite, SiteContext, Notification, PublishingOptions, LanguageContextType, ArticleLength, SeoAnalysis, ProductContent as ProductContentType, WritingTone } from '../types';
import { generateArticle, generateProduct, generateFeaturedImage, generateContentStrategy, analyzeSeo } from '../services/geminiService';
import Spinner from './common/Spinner';
import { ArticleIcon, ProductIcon, SparklesIcon, CameraIcon, StrategyIcon, SeoIcon, LibraryIcon } from '../constants';
import { getSiteContext, publishContent } from '../services/wordpressService';
import PublishModal from './PublishModal';
import { LanguageContext } from '../App';

interface NewContentViewProps {
    onContentGenerated: (content: GeneratedContent) => void;
    onStrategyGenerated: (contents: ArticleContent[]) => void;
    sites: WordPressSite[];
    showNotification: (notification: Notification) => void;
    initialContent?: ArticleContent | null;
}

const NewContentView: React.FC<NewContentViewProps> = ({ onContentGenerated, onStrategyGenerated, sites, showNotification, initialContent }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [activeTab, setActiveTab] = useState<ContentType>(ContentType.Article);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedResult, setGeneratedResult] = useState<GeneratedContent | null>(null);
    const [generatedStrategy, setGeneratedStrategy] = useState<ArticleContent[] | null>(null);

    // Form states
    const [articleTopic, setArticleTopic] = useState('');
    const [articleKeywords, setArticleKeywords] = useState('');
    const [articleLength, setArticleLength] = useState<ArticleLength>(ArticleLength.Medium);
    const [productName, setProductName] = useState('');
    const [productFeatures, setProductFeatures] = useState('');
    const [strategyTopic, setStrategyTopic] = useState('');
    const [numArticles, setNumArticles] = useState(4);
    const [tone, setTone] = useState<WritingTone>(WritingTone.Professional);
    const [language, setLanguage] = useState<Language>(Language.English);

    // Site context states
    const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(sites.length > 0 ? sites[0].id : undefined);
    const [useGoogleSearch, setUseGoogleSearch] = useState(true);
    
    // Image generation states
    const [isGeneratingImages, setIsGeneratingImages] = useState(false);
    
    // Publishing states
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    
    // SEO Analysis states
    const [seoAnalysis, setSeoAnalysis] = useState<SeoAnalysis | null>(null);
    const [isAnalyzingSeo, setIsAnalyzingSeo] = useState(false);
    
    const selectedSite = sites.find(s => s.id === selectedSiteId);

    useEffect(() => {
        if (!selectedSiteId && sites.length > 0) {
            setSelectedSiteId(sites[0].id);
        }
        if (selectedSite?.isVirtual) {
            setUseGoogleSearch(true);
        }
    }, [sites, selectedSiteId, selectedSite?.isVirtual]);

    useEffect(() => {
        if (initialContent) {
            setActiveTab(initialContent.type);
            setGeneratedResult(initialContent);
            setSeoAnalysis(null);
            setGeneratedStrategy(null);
            
            if(initialContent.siteId) {
                setSelectedSiteId(initialContent.siteId);
            }
            if (initialContent.type === ContentType.Article) {
                setArticleTopic(initialContent.title);
                setArticleKeywords('');
            }
        }
    }, [initialContent]);


    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setGeneratedResult(null);
        setGeneratedStrategy(null);
        setSeoAnalysis(null);

        try {
            if (activeTab === ContentType.Article) {
                await handleGenerateArticle();
            } else if (activeTab === ContentType.Product) {
                await handleGenerateProduct();
            } else if (activeTab === ContentType.Strategy) {
                await handleGenerateStrategy();
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : t('errorUnknown');
            setError(message);
            showNotification({ message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateArticle = async () => {
        if (!articleTopic) throw new Error(t('errorAllFieldsRequired'));
        
        let siteContext: SiteContext | undefined = undefined;
        if (useGoogleSearch && selectedSite && !selectedSite.isVirtual) {
            try {
                siteContext = await getSiteContext(selectedSite);
            } catch (err) {
                console.warn("Could not fetch site context, continuing without it.", err);
                showNotification({ message: t('contextFail'), type: 'info' });
            }
        }
        const result = await generateArticle(articleTopic, articleKeywords, tone, language, articleLength, useGoogleSearch, siteContext);
        setGeneratedResult({ ...result, siteId: selectedSiteId });
    };

    const handleGenerateProduct = async () => {
        if (!productName) throw new Error(t('errorAllFieldsRequired'));
        const result = await generateProduct(productName, productFeatures, language);
        setGeneratedResult({ ...result, siteId: selectedSiteId });
    };
    
    const handleGenerateStrategy = async () => {
        if (!strategyTopic || !selectedSiteId) throw new Error(t('errorAllFieldsRequired'));
        showNotification({ message: t('generatingStrategy'), type: 'info' });

        const articles = await generateContentStrategy(strategyTopic, numArticles, language);
        
        const scheduledArticles = articles.map((article) => {
            return { ...article, siteId: selectedSiteId, scheduledFor: undefined };
        });

        setGeneratedStrategy(scheduledArticles);
    };
    
    const handleResultChange = (field: keyof ArticleContent | keyof ProductContentType, value: string) => {
        if (!generatedResult) return;
        setGeneratedResult(prev => {
            if (!prev) return null;
            return { ...prev, [field]: value } as GeneratedContent;
        });
    };

    const handleAnalyzeSeo = async () => {
        if (!generatedResult || generatedResult.type !== ContentType.Article) return;
        setIsAnalyzingSeo(true);
        setSeoAnalysis(null);
        showNotification({ message: t('analyzingSEO'), type: 'info' });
        try {
            const result = await analyzeSeo(generatedResult.title, generatedResult.body);
            setSeoAnalysis(result);
        } catch(err) {
            const message = err instanceof Error ? err.message : t('errorUnknown');
            showNotification({ message, type: 'error' });
        } finally {
            setIsAnalyzingSeo(false);
        }
    };


    const handleGenerateImages = async () => {
        if (!generatedResult || generatedResult.type !== ContentType.Article) return;
        
        setIsGeneratingImages(true);
        showNotification({ message: t('imageGenStarted'), type: 'info' });
        try {
            const imagePrompt = `A high-quality, professional blog post image for an article titled: "${generatedResult.title}". The image should be visually appealing and relevant to the topic.`;
            const images = await generateFeaturedImage(imagePrompt);
            setGeneratedResult(prev => {
                if (!prev || prev.type !== ContentType.Article) return prev;
                return { ...prev, generatedImageOptions: images, featuredImage: images[0] }; // Auto-select the first image
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : t('imageGenFail');
            showNotification({ message, type: 'error' });
        } finally {
            setIsGeneratingImages(false);
        }
    };

    const handleSelectImage = (imageBase64: string) => {
        setGeneratedResult(prev => {
            if (!prev || prev.type !== ContentType.Article) return prev;
            return { ...prev, featuredImage: imageBase64 };
        });
    };

    const handleSaveToLibrary = () => {
        if (generatedResult) {
            // Note: This currently creates a duplicate if editing. A more robust solution
            // would involve an `onUpdateLibraryItem` prop and logic to differentiate.
            // For now, focusing on the primary 'edit and publish' workflow.
            onContentGenerated(generatedResult);
            setGeneratedResult(null);
            // Reset forms
            setArticleTopic('');
            setArticleKeywords('');
            setProductName('');
            setProductFeatures('');
        }
    }

    const handlePublish = async (options: PublishingOptions) => {
        const siteToPublish = sites.find(s => s.id === options.siteId);
        if (!generatedResult || !siteToPublish) {
            showNotification({ message: 'Selected site not found.', type: 'error' });
            return;
        }
        setIsPublishing(true);

        try {
            const result = await publishContent(siteToPublish, generatedResult, options);
            showNotification({ message: t('publishSuccess', { url: result.postUrl }), type: 'success' });
            setIsPublishModalOpen(false);
            setGeneratedResult(null); // Clear the result after publishing
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
            showNotification({ message: t('publishFail', { error: errorMessage }), type: 'error' });
        } finally {
            setIsPublishing(false);
        }
    };
    
    const handleSaveStrategy = () => {
        if (generatedStrategy) {
            onStrategyGenerated(generatedStrategy);
            setGeneratedStrategy(null);
        }
    };
    
    const handleStrategyTitleChange = (index: number, newTitle: string) => {
        if (!generatedStrategy) return;
        const updatedStrategy = [...generatedStrategy];
        updatedStrategy[index].title = newTitle;
        setGeneratedStrategy(updatedStrategy);
    };

    const renderForm = () => {
        const commonFields = (
             <>
                <div className="md:col-span-2">
                    <label htmlFor="language" className="block text-sm font-medium text-gray-300">{t('language')}</label>
                    <select id="language" value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white">
                        {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
            </>
        );

        const contextSelector = (
            <div className="md:col-span-2 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <label htmlFor="site-select" className="block text-sm font-medium text-gray-300 mb-2">{t('generateForSite')}</label>
                <select 
                    id="site-select" 
                    value={selectedSiteId} 
                    onChange={e => setSelectedSiteId(e.target.value)} 
                    disabled={sites.length === 0}
                    className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white disabled:bg-gray-800 disabled:cursor-not-allowed"
                >
                    {sites.length > 0 ? sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>) : <option>{t('noSitesAvailable')}</option>}
                </select>
                
                <div className="mt-4">
                    <label className={`flex items-center ${selectedSite?.isVirtual ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input type="checkbox" checked={useGoogleSearch || selectedSite?.isVirtual} onChange={e => setUseGoogleSearch(e.target.checked)} className="h-4 w-4 rounded border-gray-500 text-blue-600 focus:ring-blue-500 bg-gray-700" disabled={!selectedSiteId || selectedSite?.isVirtual} />
                        <span className="ms-2 text-sm text-gray-300">{t('useGoogleSearch')}</span>
                    </label>
                     <p className="text-xs text-gray-500 mt-1 ms-6">{t('useGoogleSearchHint')}</p>
                </div>
            </div>
        );

        if (activeTab === ContentType.Article) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contextSelector}
                    <div className="md:col-span-2">
                        <label htmlFor="article-topic" className="block text-sm font-medium text-gray-300">{t('topicTitle')}</label>
                        <input type="text" id="article-topic" value={articleTopic} onChange={e => setArticleTopic(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder={t('topicTitlePlaceholder')} />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="article-keywords" className="block text-sm font-medium text-gray-300">{t('keywords')}</label>
                        <input type="text" id="article-keywords" value={articleKeywords} onChange={e => setArticleKeywords(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder={t('keywordsPlaceholder')} />
                    </div>
                     <div className="md:col-span-1">
                        <label htmlFor="tone" className="block text-sm font-medium text-gray-300">{t('writingTone')}</label>
                        <select id="tone" value={tone} onChange={(e) => setTone(e.target.value as WritingTone)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white">
                            {Object.values(WritingTone).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label htmlFor="articleLength" className="block text-sm font-medium text-gray-300">{t('articleLength')}</label>
                        <select id="articleLength" value={articleLength} onChange={(e) => setArticleLength(e.target.value as ArticleLength)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white">
                            {Object.values(ArticleLength).map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                    {commonFields}
                </div>
            );
        }
        if (activeTab === ContentType.Product) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label htmlFor="product-name" className="block text-sm font-medium text-gray-300">{t('productName')}</label>
                        <input type="text" id="product-name" value={productName} onChange={e => setProductName(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder={t('productNamePlaceholder')} />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="product-features" className="block text-sm font-medium text-gray-300">{t('productFeatures')}</label>
                        <textarea id="product-features" rows={4} value={productFeatures} onChange={e => setProductFeatures(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder={t('productFeaturesPlaceholder')}></textarea>
                    </div>
                     <div className="col-span-1 md:col-span-2">
                        <label htmlFor="tone" className="block text-sm font-medium text-gray-300">{t('writingTone')}</label>
                        <select id="tone" value={tone} onChange={(e) => setTone(e.target.value as WritingTone)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white">
                            {Object.values(WritingTone).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    {commonFields}
                </div>
            );
        }
        if (activeTab === ContentType.Strategy) {
             return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contextSelector}
                    <div className="md:col-span-2">
                        <label htmlFor="strategy-topic" className="block text-sm font-medium text-gray-300">{t('mainTopic')}</label>
                        <input type="text" id="strategy-topic" value={strategyTopic} onChange={e => setStrategyTopic(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder={t('mainTopicPlaceholder')} />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="num-articles" className="block text-sm font-medium text-gray-300">{t('numArticles')}</label>
                        <input type="number" id="num-articles" value={numArticles} min="1" max="30" onChange={e => setNumArticles(parseInt(e.target.value, 10))} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    {commonFields}
                </div>
            );
        }
        return null;
    }

    const renderImageGenerator = () => {
        if (!generatedResult || generatedResult.type !== ContentType.Article) return null;
        const article = generatedResult as ArticleContent;

        return (
            <div className="mt-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h4 className="text-lg font-semibold text-gray-200 mb-3">{t('featuredImage')}</h4>
                
                {isGeneratingImages ? (
                    <div className="flex flex-col items-center justify-center h-48">
                        <Spinner />
                        <p className="mt-2 text-sm text-gray-400">{t('generatingImages')}</p>
                    </div>
                ) : !article.generatedImageOptions || article.generatedImageOptions.length === 0 ? (
                    <button onClick={handleGenerateImages} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center transition-colors">
                        <CameraIcon />
                        <span className="ms-2">{t('generateImage')}</span>
                    </button>
                ) : (
                    <div>
                        <p className="text-sm text-gray-400 mb-3">{t('selectAnImage')}</p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {article.generatedImageOptions.map((imgSrc, index) => (
                                <img
                                    key={index}
                                    src={`data:image/jpeg;base64,${imgSrc}`}
                                    alt={`Generated image option ${index + 1}`}
                                    className={`rounded-lg cursor-pointer transition-all duration-200 ${article.featuredImage === imgSrc ? 'ring-4 ring-blue-500 shadow-lg' : 'ring-2 ring-transparent hover:ring-blue-500'}`}
                                    onClick={() => handleSelectImage(imgSrc)}
                                />
                            ))}
                        </div>
                        <button onClick={handleGenerateImages} className="w-full text-sm bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center transition-colors">
                            <SparklesIcon />
                            <span className="ms-2">{t('regenerate')}</span>
                        </button>
                    </div>
                )}
            </div>
        );
    }
    
    const renderSeoAnalyzer = () => {
        if (!generatedResult || generatedResult.type !== ContentType.Article) return null;
        const scoreColor = seoAnalysis && seoAnalysis.score >= 80 ? 'text-green-400' : seoAnalysis && seoAnalysis.score >= 50 ? 'text-yellow-400' : 'text-red-400';

        return (
            <div className="mt-6 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h4 className="text-lg font-semibold text-gray-200 mb-3">{t('seoAnalysis')}</h4>
                
                {isAnalyzingSeo && (
                     <div className="flex flex-col items-center justify-center h-24">
                        <Spinner />
                    </div>
                )}

                {!isAnalyzingSeo && !seoAnalysis && (
                    <button onClick={handleAnalyzeSeo} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center transition-colors">
                        <SeoIcon />
                        <span className="ms-2">{t('analyzeSeo')}</span>
                    </button>
                )}

                {seoAnalysis && (
                    <div className="animate-fade-in space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">{t('seoScore')}</span>
                             <div className="flex items-center">
                                <span className={`text-2xl font-bold ${scoreColor}`}>{seoAnalysis.score}</span>
                                <span className="text-sm text-gray-400">/100</span>
                            </div>
                        </div>
                        <div>
                            <h5 className="font-semibold mb-2">{t('seoSuggestions')}</h5>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                                {seoAnalysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                         <button onClick={handleAnalyzeSeo} className="w-full text-sm bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center transition-colors">
                            <SparklesIcon />
                            <span className="ms-2">{t('regenerate')}</span>
                        </button>
                    </div>
                )}
            </div>
        );
    }

    const renderResult = () => {
        if (!generatedResult) return null;

        const contentSite = sites.find(s => s.id === generatedResult.siteId);
        const isForVirtualSite = contentSite?.isVirtual === true;

        return (
            <div className="bg-gray-800 rounded-lg p-6 animate-fade-in">
                <h3 className="text-2xl font-bold text-white mb-4">{t('generatedContent')}</h3>
                {generatedResult.type === ContentType.Article ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                            <input type="text" value={generatedResult.title} onChange={e => handleResultChange('title', e.target.value)} className="text-xl font-bold w-full bg-gray-700 p-2 rounded-md text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Meta Description</label>
                            <textarea value={generatedResult.metaDescription} onChange={e => handleResultChange('metaDescription', e.target.value)} className="text-sm w-full bg-gray-700 p-2 rounded-md text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Body (Markdown)</label>
                            <textarea value={generatedResult.body} onChange={e => handleResultChange('body', e.target.value)} className="text-base w-full bg-gray-700 p-2 rounded-md h-96 text-gray-200 leading-relaxed font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                         </div>
                         {renderImageGenerator()}
                         {renderSeoAnalyzer()}
                    </div>
                ) : (
                     <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Product Name</label>
                            <input type="text" value={generatedResult.title} onChange={e => handleResultChange('title', e.target.value)} className="text-xl font-bold w-full bg-gray-700 p-2 rounded-md text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Long Description (Markdown)</label>
                            <textarea value={generatedResult.longDescription} onChange={e => handleResultChange('longDescription', e.target.value)} className="text-base w-full bg-gray-700 p-2 rounded-md h-64 text-gray-200 leading-relaxed font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Short Description</label>
                            <textarea value={generatedResult.shortDescription} onChange={e => handleResultChange('shortDescription', e.target.value)} className="text-sm w-full bg-gray-700 p-2 rounded-md h-24 text-gray-300 font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>
                )}
                <div className="mt-6 flex items-center justify-end space-x-4 rtl:space-x-reverse">
                     <button onClick={handleSaveToLibrary} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        {t('saveToLibrary')}
                    </button>
                    {!isForVirtualSite && (
                        <button onClick={() => setIsPublishModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                            {t('publish')}
                        </button>
                    )}
                </div>
            </div>
        )
    }
    
    const renderStrategyResult = () => {
        if (!generatedStrategy) return null;

        return (
            <div className="bg-gray-800 rounded-lg p-6 animate-fade-in">
                <h3 className="text-2xl font-bold text-white mb-2">{t('generatedStrategy')}</h3>
                <p className="text-gray-400 mb-4 text-sm">{t('reviewStrategyHint')}</p>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {generatedStrategy.map((article, index) => (
                        <div key={article.id} className="flex items-center gap-4">
                            <span className="text-gray-400 font-bold">{index + 1}.</span>
                            <input 
                                type="text"
                                value={article.title}
                                onChange={e => handleStrategyTitleChange(index, e.target.value)}
                                className="text-base font-medium w-full bg-gray-700 p-2 rounded-md text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex items-center justify-end space-x-4 rtl:space-x-reverse">
                    <button onClick={() => setGeneratedStrategy(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        {t('discard')}
                    </button>
                    <button onClick={handleSaveStrategy} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center">
                        <LibraryIcon /> <span className="ms-2">{t('saveStrategyToLibrary')}</span>
                    </button>
                </div>
            </div>
        );
    }

    const buttonText = activeTab === ContentType.Strategy ? t('generateStrategy') : t('generateContent');
    const buttonIcon = activeTab === ContentType.Strategy ? <StrategyIcon /> : <SparklesIcon />;
    
    return (
        <div className="p-8 h-full">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">{t('createNewContent')}</h1>
                <p className="text-gray-400 mt-1">{t('createNewContentHint')}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <form onSubmit={handleGenerate} className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div className="mb-6">
                        <div className="flex border-b border-gray-700">
                            <button type="button" onClick={() => setActiveTab(ContentType.Article)} className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium ${activeTab === ContentType.Article ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                                <ArticleIcon />
                                <span>{t('article')}</span>
                            </button>
                            <button type="button" onClick={() => setActiveTab(ContentType.Product)} className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium ${activeTab === ContentType.Product ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                                <ProductIcon />
                                <span>{t('product')}</span>
                            </button>
                             <button type="button" onClick={() => setActiveTab(ContentType.Strategy)} className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium ${activeTab === ContentType.Strategy ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                                <StrategyIcon />
                                <span>{t('contentStrategy')}</span>
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4 mb-6">
                        {renderForm()}
                    </div>
                     <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed">
                        {isLoading ? <Spinner size="sm" /> : (
                            <>
                                {buttonIcon}
                                <span className="ms-2">{buttonText}</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="lg:col-span-1">
                    {(() => {
                        if (isLoading) {
                            return (
                                <div className="text-center p-10 bg-gray-800 rounded-lg flex flex-col items-center justify-center h-full">
                                    <Spinner size="lg"/>
                                    <p className="mt-4 text-lg text-gray-300 animate-pulse">{t('generating')}</p>
                                </div>
                            );
                        }
                        if (activeTab === ContentType.Strategy && generatedStrategy) {
                            return renderStrategyResult();
                        }
                        if (error && !generatedResult) {
                             return <div className="text-center p-10 bg-red-900/20 border border-red-500 rounded-lg flex items-center justify-center h-full"><p className="text-red-400">{error}</p></div>
                        }
                        if (generatedResult) {
                            return renderResult();
                        }
                        return (
                            <div className="flex items-center justify-center h-full bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg">
                                <div className="text-center p-4">
                                     <SparklesIcon />
                                    <h3 className="mt-2 text-sm font-medium text-gray-300">{t('yourContentHere')}</h3>
                                    <p className="mt-1 text-sm text-gray-500">{t('yourContentHereHint')}</p>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
            {isPublishModalOpen && generatedResult && (
                <PublishModal
                    content={generatedResult}
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

export default NewContentView;
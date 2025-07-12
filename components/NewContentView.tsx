
import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { ArticleContent, ContentType, GeneratedContent, Language, ProductContent, WordPressSite, SiteContext, Notification, PublishingOptions, LanguageContextType, ArticleLength, SeoAnalysis, ProductContent as ProductContentType, WritingTone, InternalLinkSuggestion, CampaignGenerationResult } from '../types';
import { generateArticle, generateProduct, generateFeaturedImage, generateContentCampaign, analyzeSeo, refineArticle, modifyText, generateInternalLinks } from '../services/geminiService';
import Spinner from './common/Spinner';
import { ArticleIcon, ProductIcon, SparklesIcon, CameraIcon, CampaignIcon, SeoIcon, LibraryIcon, LinkIcon, ChevronDownIcon, ChevronUpIcon, ArrowPathIcon, CheckCircleIcon, ArrowUturnLeftIcon, Bars3Icon, HeadingIcon, BoldIcon, ItalicIcon, ListBulletIcon, QuoteIcon, PublishIcon } from '../constants';
import { getSiteContext, publishContent, updatePost } from '../services/wordpressService';
import PublishModal from './PublishModal';
import { LanguageContext } from '../App';
import InlineAiMenu from './InlineAiMenu';

interface NewContentViewProps {
    onContentGenerated: (content: GeneratedContent) => void;
    onCampaignGenerated: (campaignResult: CampaignGenerationResult) => void;
    sites: WordPressSite[];
    showNotification: (notification: Notification) => void;
    initialContent?: ArticleContent | null;
    onExit: () => void;
    newContentType?: ContentType;
    initialTitle?: string;
}


type SelectionInfo = { text: string; top: number; left: number; field: 'body' | 'longDescription' | 'shortDescription'; };
type WizardStep = 'brief' | 'generating' | 'editor' | 'campaign_result';


// Standalone Toolkit Components defined outside the main component to prevent closure issues and bugs
const AIToolkitSection: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode, isOpen: boolean, onToggle: () => void, isLoading?: boolean}> = ({ title, icon, children, isOpen, onToggle, isLoading = false }) => {
    return (
        <div className="bg-gray-700/50 rounded-lg border border-gray-600/50">
            <button onClick={onToggle} className="w-full flex justify-between items-center p-3 text-left">
                <div className="flex items-center space-x-2">
                    <span className="text-indigo-400">{icon}</span>
                    <h4 className="font-semibold text-gray-200">{title}</h4>
                     {isLoading && <Spinner size="sm" />}
                </div>
                {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>
            {isOpen && <div className="p-3 border-t border-gray-600/50">{children}</div>}
        </div>
    );
};

const RefineTool = ({ article, contentLanguage, showNotification, onRefined }: { article: ArticleContent, contentLanguage: Language, showNotification: (n: Notification) => void, onRefined: (content: GeneratedContent) => void }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [isRefining, setIsRefining] = useState(false);
    const [refinementPrompt, setRefinementPrompt] = useState('');
    
    const handleRefineArticle = async () => {
        setIsRefining(true);
        showNotification({ message: t('refiningArticle'), type: 'info' });
        try {
            const refinedData = await refineArticle(article, refinementPrompt, contentLanguage);
            onRefined({ ...article, ...refinedData });
        } catch(err) {
            showNotification({ message: err instanceof Error ? err.message : t('errorUnknown'), type: 'error' });
        } finally {
            setIsRefining(false);
        }
    };
    
    return (
        <div className="space-y-3">
            <p className="text-sm text-gray-400">{t('refineWithAIHint')}</p>
            <textarea value={refinementPrompt} onChange={e => setRefinementPrompt(e.target.value)} placeholder={t('refinementPlaceholder')} className="w-full text-sm bg-gray-600 p-2 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none" rows={2} disabled={isRefining} />
            <button onClick={handleRefineArticle} disabled={isRefining} className="w-full btn-gradient text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50">
                {isRefining ? <Spinner size="sm"/> : <><SparklesIcon className="me-2 h-4 w-4"/> {t('refineArticle')}</>}
            </button>
        </div>
    );
};

const ImageGeneratorTool = ({ article, showNotification, onImageChange }: { article: ArticleContent, showNotification: (n: Notification) => void, onImageChange: (content: GeneratedContent) => void }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [isGeneratingImages, setIsGeneratingImages] = useState(false);
    
    const handleGenerateImages = async () => {
        setIsGeneratingImages(true);
        showNotification({ message: t('imageGenStarted'), type: 'info' });
        try {
            const imagePrompt = `A high-quality, professional blog post image for an article titled: "${article.title}". The image should be visually appealing and relevant to the topic. Style: photorealistic.`;
            const images = await generateFeaturedImage(imagePrompt);
            onImageChange({ ...article, generatedImageOptions: images, featuredImage: images[0] });
        } catch (err) {
            showNotification({ message: err instanceof Error ? err.message : t('imageGenFail'), type: 'error' });
        } finally { setIsGeneratingImages(false); }
    };

    const handleSelectImage = (imageBase64: string) => {
        onImageChange({ ...article, featuredImage: imageBase64 });
    };

    if (isGeneratingImages) return <div className="flex flex-col items-center justify-center h-40"><Spinner /><p className="mt-2 text-sm text-gray-400">{t('generatingImages')}</p></div>;
    
    if (!article.generatedImageOptions?.length) return <button onClick={handleGenerateImages} className="w-full btn-gradient text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"><CameraIcon /><span className="ms-2">{t('generateImage')}</span></button>;

    return (
        <div>
            <p className="text-sm text-gray-400 mb-3">{t('selectAnImage')}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
                {article.generatedImageOptions.map((imgSrc, index) => (
                    <img key={index} src={`data:image/jpeg;base64,${imgSrc}`} alt={`Generated option ${index + 1}`} className={`rounded-lg cursor-pointer transition-all duration-200 ${article.featuredImage === imgSrc ? 'ring-4 ring-sky-500 shadow-lg' : 'ring-2 ring-transparent hover:ring-sky-500'}`} onClick={() => handleSelectImage(imgSrc)} />
                ))}
            </div>
            <button onClick={handleGenerateImages} className="w-full text-sm bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"><ArrowPathIcon className="h-4 w-4 me-2"/>{t('regenerate')}</button>
        </div>
    );
};

const SeoAnalyzerTool = ({ analysis }: { analysis: SeoAnalysis | null }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    
    if (!analysis) return <div className="text-sm text-center text-gray-500 py-4">{t('typeToAnalyze')}</div>;
    
    const scoreColor = analysis.score >= 80 ? 'text-green-400' : analysis.score >= 50 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="space-y-3 animate-fade-in-fast">
            <div className="flex items-baseline justify-between">
                <span className="font-semibold text-gray-300">{t('seoScore')}</span>
                <span className={`text-3xl font-bold ${scoreColor}`}>{analysis.score}<span className="text-base text-gray-500">/100</span></span>
            </div>
            <div className="space-y-2 text-sm">
                {analysis.suggestions.map((s, i) => <p key={i} className="flex items-start"><CheckCircleIcon className="h-4 w-4 text-green-400 me-2 mt-0.5 flex-shrink-0" />{s}</p>)}
            </div>
        </div>
    );
};

const InternalLinkerTool = ({ article, suggestions, onLinkApplied }: { article: ArticleContent, suggestions: InternalLinkSuggestion[] | null, onLinkApplied: (suggestion: InternalLinkSuggestion) => void }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);

    const handleApplyLink = (suggestion: InternalLinkSuggestion) => {
        onLinkApplied(suggestion);
    };
    
    if (suggestions === null) return <div className="text-sm text-center text-gray-500 py-4">{t('typeToSuggestLinks')}</div>;
    if (suggestions.length === 0) return <p className="text-sm text-center text-gray-500 py-4">{t('noLinksFound')}</p>;

    return (
        <div className="space-y-2 animate-fade-in-fast">
            {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-gray-600 p-2 rounded-lg">
                    <p className="text-sm text-gray-300 leading-relaxed">
                       {t('linkSuggestionText', {
                            textToLink: `<strong>“${suggestion.textToLink}”</strong>`,
                            postTitle: `<em>“${suggestion.postTitle}”</em>`
                        }).split(/<strong>(.*?)<\/strong>|<em>(.*?)<\/em>/g).map((part, i) => {
                            if (part === undefined) {
                                return null;
                            }
                            if (i % 3 === 1) return <strong key={i} className="font-semibold text-white">{part.replace(/“|”/g, '')}</strong>;
                            if (i % 3 === 2) return <em key={i} className="text-sky-300 not-italic">{part.replace(/“|”/g, '')}</em>;
                            return <span key={i}>{part}</span>;
                       })}
                    </p>
                    <button onClick={() => handleApplyLink(suggestion)} className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-xs rounded-md transition-colors">
                        {t('applyLink')}
                    </button>
                </div>
            ))}
        </div>
    );
};

// Main Component
const NewContentView: React.FC<NewContentViewProps> = ({ onContentGenerated, onCampaignGenerated, sites, showNotification, initialContent, newContentType, onExit, initialTitle }) => {
    const { t, language: appLanguage } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [wizardStep, setWizardStep] = useState<WizardStep>('brief');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedResult, setGeneratedResult] = useState<GeneratedContent | null>(null);
    const [generatedCampaign, setGeneratedCampaign] = useState<CampaignGenerationResult | null>(null);
    const editorRef = useRef<any>(null);


    // Form states
    const [activeTab, setActiveTab] = useState<ContentType>(ContentType.Article);
    const [articleTopic, setArticleTopic] = useState('');
    const [articleKeywords, setArticleKeywords] = useState('');
    const [articleLength, setArticleLength] = useState<ArticleLength>(ArticleLength.Medium);
    const [productName, setProductName] = useState('');
    const [productFeatures, setProductFeatures] = useState('');
    const [campaignTopic, setCampaignTopic] = useState('');
    const [numArticles, setNumArticles] = useState(4);
    const [tone, setTone] = useState<WritingTone>(WritingTone.Professional);
    const [language, setLanguage] = useState<Language>(Language.English); // Language of the content
    const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(sites.length > 0 ? sites[0].id : undefined);
    const [useGoogleSearch, setUseGoogleSearch] = useState(true);

    // Toolkit, Editor & Result states
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [selection, setSelection] = useState<SelectionInfo | null>(null);
    const [isModifyingText, setIsModifyingText] = useState(false);
    const resultViewRef = useRef<HTMLDivElement>(null);
    const [isToolkitOpen, setIsToolkitOpen] = useState(true);
    
    // Proactive AI Co-pilot State
    const [isSeoToolkitOpen, setIsSeoToolkitOpen] = useState(true);
    const [isLinkToolkitOpen, setIsLinkToolkitOpen] = useState(true);
    const [seoAnalysis, setSeoAnalysis] = useState<SeoAnalysis | null>(null);
    const [isAnalyzingSeo, setIsAnalyzingSeo] = useState(false);
    const [linkSuggestions, setLinkSuggestions] = useState<InternalLinkSuggestion[] | null>(null);
    const [isSuggestingLinks, setIsSuggestingLinks] = useState(false);
    
    const articleForAnalysis = generatedResult?.type === ContentType.Article ? (generatedResult as ArticleContent) : null;
    const selectedSite = sites.find(s => s.id === selectedSiteId);

    const wordCount = useMemo(() => {
        if (generatedResult?.type !== ContentType.Article) return 0;
        const body = (generatedResult as ArticleContent).body;
        return body ? body.trim().split(/\s+/).filter(Boolean).length : 0;
    }, [generatedResult]);

    // Set initial state from props (for new content or editing existing content)
    useEffect(() => {
        if (initialContent) {
            setGeneratedResult(initialContent);
            setActiveTab(initialContent.type);
            setSelectedSiteId(initialContent.siteId);
            setLanguage(initialContent.language);
            setWizardStep('editor');
        } else if (newContentType) {
            setActiveTab(newContentType);
            if (initialTitle && newContentType === ContentType.Article) {
                setArticleTopic(initialTitle);
            }
            setWizardStep('brief');
        }
    }, [initialContent, newContentType, initialTitle]);
    
    // Reset proactive analysis state when content changes
    useEffect(() => {
        setSeoAnalysis(null);
        setLinkSuggestions(null);
    }, [generatedResult?.id]);


    // Proactive AI handlers
    useEffect(() => {
        if (wizardStep !== 'editor' || !articleForAnalysis?.body) return;

        const handleProactiveAnalysis = () => {
             if (isSeoToolkitOpen && !isAnalyzingSeo) {
                analyzeSeo(articleForAnalysis.title, articleForAnalysis.body).then(setSeoAnalysis).catch(console.warn).finally(() => setIsAnalyzingSeo(false));
                setIsAnalyzingSeo(true);
             }
             if (isLinkToolkitOpen && !isSuggestingLinks) {
                const siteForLinks = sites.find(s => s.id === selectedSiteId);
                if (siteForLinks && !siteForLinks.isVirtual) {
                    setIsSuggestingLinks(true);
                    getSiteContext(siteForLinks).then(context => {
                        if (context.recentPosts?.length > 0) {
                           return generateInternalLinks(articleForAnalysis.body, context);
                        }
                        return [];
                    }).then(setLinkSuggestions).catch(console.warn).finally(() => setIsSuggestingLinks(false));
                }
             }
        };

        const handler = setTimeout(handleProactiveAnalysis, 2000);
        return () => clearTimeout(handler);
    }, [articleForAnalysis?.body, articleForAnalysis?.title, wizardStep, isSeoToolkitOpen, isLinkToolkitOpen, sites, selectedSiteId]);

    // Handle site selection changes
    useEffect(() => {
        if (!selectedSiteId && sites.length > 0) {
            setSelectedSiteId(sites[0].id);
        }
        if (selectedSite?.isVirtual) {
            setUseGoogleSearch(true);
        }
    }, [sites, selectedSiteId, selectedSite?.isVirtual]);

    // Effect for handling text selection for inline AI menu
    useEffect(() => {
        const handleMouseUp = (event: MouseEvent) => {
            if (isModifyingText) return;
            const currentSelection = window.getSelection();
            const selectedText = currentSelection?.toString().trim();

            if (selectedText && resultViewRef.current?.contains(currentSelection.anchorNode)) {
                 const range = currentSelection.getRangeAt(0);
                 const rect = range.getBoundingClientRect();
                 const containerRect = resultViewRef.current.getBoundingClientRect();
                 const field = (event.target as HTMLElement).closest('[data-editor-field]')?.getAttribute('data-editor-field') as SelectionInfo['field'] | undefined;
                 if (field) {
                    setSelection({ text: selectedText, top: rect.top - containerRect.top, left: rect.left - containerRect.left + rect.width / 2, field: field });
                 }
            } else {
                setSelection(null);
            }
        };
        const handleScroll = () => setSelection(null);
        document.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isModifyingText]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setWizardStep('generating');

        try {
            if (activeTab === ContentType.Article) {
                await handleGenerateArticle();
            } else if (activeTab === ContentType.Product) {
                await handleGenerateProduct();
            } else if (activeTab === ContentType.Campaign) {
                await handleGenerateCampaign();
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : t('errorUnknown');
            setError(message);
            showNotification({ message, type: 'error' });
            setWizardStep('brief'); // Go back to form on error
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateArticle = async () => {
        if (!articleTopic) throw new Error(t('errorAllFieldsRequired'));
        let siteContext: SiteContext | undefined = undefined;
        if (selectedSite && !selectedSite.isVirtual) {
            try { siteContext = await getSiteContext(selectedSite); } catch (err) { console.warn("Could not fetch site context", err); }
        }
        const result = await generateArticle(articleTopic, articleKeywords, tone, language, articleLength, useGoogleSearch, siteContext);
        setGeneratedResult({ ...result, siteId: selectedSiteId, origin: 'new' });
        setWizardStep('editor');
    };

    const handleGenerateProduct = async () => {
        if (!productName) throw new Error(t('errorAllFieldsRequired'));
        const result = await generateProduct(productName, productFeatures, language);
        setGeneratedResult({ ...result, siteId: selectedSiteId });
        setWizardStep('editor');
    };
    
    const handleGenerateCampaign = async () => {
        if (!campaignTopic || !selectedSiteId) throw new Error(t('errorAllFieldsRequired'));
        const campaignResult = await generateContentCampaign(campaignTopic, numArticles, language);
        const updatedPillar = { ...campaignResult.pillarPost, siteId: selectedSiteId };
        const updatedClusters = campaignResult.clusterPosts.map(c => ({...c, siteId: selectedSiteId}));
        setGeneratedCampaign({ pillarPost: updatedPillar, clusterPosts: updatedClusters });
        setWizardStep('campaign_result');
    };

    const handleResultChange = (field: keyof ArticleContent | keyof ProductContentType, value: string) => {
        if (!generatedResult) return;
        setGeneratedResult(prev => {
             if (!prev) return null;
             if (field === 'body' || field === 'title') {
                 setSeoAnalysis(null);
                 setLinkSuggestions(null);
             }
             return { ...prev, [field]: value } as GeneratedContent;
        });
    };

    const handlePublish = async (options: PublishingOptions) => {
        const siteToPublish = sites.find(s => s.id === options.siteId);
        if (!generatedResult || !siteToPublish) return;
        setIsPublishing(true);
        try {
            const result = await publishContent(siteToPublish, generatedResult, options);
            showNotification({ message: t('publishSuccess', { url: result.postUrl }), type: 'success' });
            setIsPublishModalOpen(false);
            onExit();
        } catch (err) {
            showNotification({ message: t('publishFail', { error: err instanceof Error ? err.message : String(err) }), type: 'error' });
        } finally {
            setIsPublishing(false);
        }
    };

    const handleUpdate = async (options: PublishingOptions) => {
        const siteToUpdate = sites.find(s => s.id === options.siteId);
        const article = generatedResult as ArticleContent;
        if (!article?.postId || !siteToUpdate) return;
        setIsPublishing(true);
        try {
            const result = await updatePost(siteToUpdate, article.postId, article, options);
            showNotification({ message: t('updateSuccess', { url: result.postUrl }), type: 'success' });
            setIsPublishModalOpen(false);
            onExit();
        } catch (err) {
            showNotification({ message: t('updateFail', { error: err instanceof Error ? err.message : String(err) }), type: 'error' });
        } finally {
            setIsPublishing(false);
        }
    };
    
    const handleSaveCampaign = () => {
        if (generatedCampaign) {
            onCampaignGenerated(generatedCampaign);
            onExit();
        }
    };
    
    const handleCampaignArticleTitleChange = (type: 'pillar' | 'cluster', index: number, newTitle: string) => {
        if (!generatedCampaign) return;
        const updatedCampaign = { ...generatedCampaign };
        if (type === 'pillar') updatedCampaign.pillarPost.title = newTitle;
        else updatedCampaign.clusterPosts[index].title = newTitle;
        setGeneratedCampaign(updatedCampaign);
    };

    const handleAiTextModify = async (instruction: string) => {
        if (!selection || !generatedResult) return;
        setIsModifyingText(true);
        try {
            const modifiedText = await modifyText(selection.text, instruction, language);
            setGeneratedResult(prevResult => {
                if (!prevResult) return null;
                const newResult = { ...prevResult };
                const currentText = (newResult as any)[selection.field] as string;
                const newContent = currentText.replace(selection.text, modifiedText);
                (newResult as any)[selection.field] = newContent;
                return newResult as GeneratedContent;
            });
        } catch (err) {
            showNotification({ message: err instanceof Error ? err.message : t('errorUnknown'), type: 'error' });
        } finally {
            setIsModifyingText(false);
            setSelection(null);
        }
    };
    
    const handleApplyLinkSuggestion = (suggestion: InternalLinkSuggestion) => {
        if (!articleForAnalysis) return;
        const newBody = articleForAnalysis.body.replace(suggestion.textToLink, `[${suggestion.textToLink}](${suggestion.linkTo})`);
        handleResultChange('body', newBody);
        setLinkSuggestions(prev => prev ? prev.filter(s => s.textToLink !== suggestion.textToLink) : null);
    };

    const renderBriefStep = () => {
        const commonFields = (
             <>
                <div className="md:col-span-1">
                    <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-1">{t('language')}</label>
                    <select id="language" value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="block w-full bg-gray-700 border border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm text-white">
                        {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                 <div className="md:col-span-1">
                    <label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-1">{t('writingTone')}</label>
                    <select id="tone" value={tone} onChange={(e) => setTone(e.target.value as WritingTone)} className="block w-full bg-gray-700 border border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm text-white">
                        {Object.values(WritingTone).map(tVal => <option key={tVal} value={tVal}>{t(tVal.toLowerCase() as any) || tVal}</option>)}
                    </select>
                </div>
            </>
        );

        const contextSelector = (
            <div className="md:col-span-2 bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <label htmlFor="site-select" className="block text-sm font-medium text-gray-300 mb-2">{t('generateForSite')}</label>
                <select 
                    id="site-select" 
                    value={selectedSiteId} 
                    onChange={e => setSelectedSiteId(e.target.value)} 
                    disabled={sites.length === 0}
                    className="block w-full bg-gray-700 border border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white disabled:bg-gray-800 disabled:cursor-not-allowed"
                >
                    {sites.length > 0 ? sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>) : <option>{t('noSitesAvailable')}</option>}
                </select>
                
                <div className="mt-4">
                    <label className={`flex items-center ${selectedSite?.isVirtual ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                        <input type="checkbox" checked={useGoogleSearch || selectedSite?.isVirtual} onChange={e => setUseGoogleSearch(e.target.checked)} className="h-4 w-4 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500 bg-gray-700" disabled={!selectedSiteId || selectedSite?.isVirtual} />
                        <span className="ms-2 text-sm text-gray-300">{t('useGoogleSearch')}</span>
                    </label>
                     <p className="text-xs text-gray-500 mt-1 ms-6">{t('useGoogleSearchHint')}</p>
                </div>
            </div>
        );

        return(
        <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-4xl w-full">
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">{t('step1_brief_title')}</h1>
                    <p className="text-gray-400 mt-1">{t('step1_brief_hint')}</p>
                </header>
                <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700/50">
                    <form onSubmit={handleGenerate}>
                        <div className="flex border-b border-gray-700 mb-6">
                            <TabButton id={ContentType.Article} label={t('article')} icon={<ArticleIcon />} />
                            <TabButton id={ContentType.Product} label={t('product')} icon={<ProductIcon />} />
                            <TabButton id={ContentType.Campaign} label={t('campaign')} icon={<CampaignIcon />} />
                        </div>
                        <div className="space-y-6 mb-8">
                        {activeTab === ContentType.Article && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {contextSelector}
                                <div className="md:col-span-2">
                                    <label htmlFor="article-topic" className="block text-sm font-medium text-gray-300 mb-1">{t('topicTitle')}</label>
                                    <input type="text" id="article-topic" value={articleTopic} onChange={e => setArticleTopic(e.target.value)} className="block w-full bg-gray-700 border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t('topicTitlePlaceholder')} />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="article-keywords" className="block text-sm font-medium text-gray-300 mb-1">{t('keywords')}</label>
                                    <input type="text" id="article-keywords" value={articleKeywords} onChange={e => setArticleKeywords(e.target.value)} className="block w-full bg-gray-700 border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t('keywordsPlaceholder')} />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="articleLength" className="block text-sm font-medium text-gray-300 mb-1">{t('articleLength')}</label>
                                    <select id="articleLength" value={articleLength} onChange={(e) => setArticleLength(e.target.value as ArticleLength)} className="block w-full bg-gray-700 border border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm text-white">
                                        {Object.values(ArticleLength).map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                {commonFields}
                            </div>
                        )}
                        {activeTab === ContentType.Product && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label htmlFor="product-name" className="block text-sm font-medium text-gray-300 mb-1">{t('productName')}</label>
                                    <input type="text" id="product-name" value={productName} onChange={e => setProductName(e.target.value)} className="block w-full bg-gray-700 border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t('productNamePlaceholder')} />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="product-features" className="block text-sm font-medium text-gray-300 mb-1">{t('productFeatures')}</label>
                                    <textarea id="product-features" rows={4} value={productFeatures} onChange={e => setProductFeatures(e.target.value)} className="block w-full bg-gray-700 border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t('productFeaturesPlaceholder')}></textarea>
                                </div>
                                {commonFields}
                            </div>
                        )}
                        {activeTab === ContentType.Campaign && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {contextSelector}
                                <div className="md:col-span-2">
                                    <label htmlFor="campaign-topic" className="block text-sm font-medium text-gray-300 mb-1">{t('mainTopic')}</label>
                                    <input type="text" id="campaign-topic" value={campaignTopic} onChange={e => setCampaignTopic(e.target.value)} className="block w-full bg-gray-700 border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t('mainTopicPlaceholder')} />
                                </div>
                                <div>
                                    <label htmlFor="num-articles" className="block text-sm font-medium text-gray-300 mb-1">{t('numArticles')}</label>
                                    <input type="number" id="num-articles" value={numArticles} min="1" max="10" onChange={e => setNumArticles(parseInt(e.target.value, 10))} className="block w-full bg-gray-700 border-gray-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                {commonFields}
                            </div>
                        )}
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full btn-gradient text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                            <SparklesIcon />
                            <span className="ms-2">{activeTab === ContentType.Campaign ? t('generateCampaign') : t('generateContent')}</span>
                        </button>
                        {error && <p className="text-red-400 mt-4 text-sm text-center">{error}</p>}
                    </form>
                </div>
            </div>
        </div>
        );
    };

    const TabButton = ({id, label, icon}: {id: ContentType, label: string, icon: React.ReactNode}) => (
        <button type="button" onClick={() => setActiveTab(id)} className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-semibold transition-all duration-200 ${activeTab === id ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}>
            {icon}
            <span>{label}</span>
        </button>
    );

    const renderGeneratingStep = () => (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Spinner size="lg"/>
            <h1 className="text-3xl font-bold text-white mt-6">{t('step2_generating_title')}</h1>
            <p className="text-gray-400 mt-2">{t('step2_generating_hint')}</p>
        </div>
    );

    const renderEditorStep = () => {
        if (!generatedResult) return <div className="fixed inset-0 bg-gray-900 z-40 flex items-center justify-center"><Spinner /></div>;
        
        const isEditingSyncedPost = (generatedResult as ArticleContent)?.origin === 'synced';
        const isForVirtualSite = selectedSite?.isVirtual === true;

        const handleFormat = (command: any) => {
            if (editorRef.current) {
                editorRef.current.executeCommand(command, command.replace('title',''));
            }
        };

        return(
            <div className="fixed inset-0 bg-gray-900 z-40 flex flex-col animate-fade-in-fast">
                {/* Editor Header */}
                <header className="flex-shrink-0 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button onClick={onExit} className="p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                            <ArrowUturnLeftIcon/>
                        </button>
                        <div className="w-px h-6 bg-gray-700"></div>
                        <input 
                           type="text"
                           value={generatedResult.title}
                           onChange={e => handleResultChange('title', e.target.value)}
                           placeholder={t('tableTitle')}
                           className="text-lg font-bold bg-transparent text-white focus:outline-none w-full max-w-lg"
                        />
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setIsToolkitOpen(p => !p)} className={`p-2 rounded-md ${isToolkitOpen ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'} transition-colors`} title={t('aiToolkit')}>
                            <Bars3Icon />
                        </button>
                        {!isForVirtualSite && (
                            <button onClick={() => setIsPublishModalOpen(true)} className="btn-gradient text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center transition-transform hover:scale-105">
                                <PublishIcon />
                                <span className="ms-2">{isEditingSyncedPost ? t('updatePost') : t('publish')}</span>
                            </button>
                        )}
                    </div>
                </header>

                {/* Editor Body */}
                <div className="flex-grow flex items-stretch overflow-hidden">
                    {/* Main Content Area */}
                    <main ref={resultViewRef} className="flex-grow flex flex-col p-4 md:p-6 lg:p-8">
                        {generatedResult.type === ContentType.Article ? (
                             <>
                                <div className="flex-shrink-0 mb-2">
                                    <EditorToolbar onFormat={handleFormat} />
                                </div>
                                <div className="flex-grow relative" data-color-mode="dark" dir={appLanguage === 'ar' ? 'rtl' : 'ltr'} data-editor-field="body">
                                    <MDEditor
                                        ref={editorRef}
                                        value={(generatedResult as ArticleContent).body}
                                        onChange={(val) => handleResultChange('body', val || '')}
                                        preview="live"
                                        previewOptions={{ remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSanitize] }}
                                        className="!h-full !w-full !flex !flex-col"
                                        style={{ background: 'transparent' }}
                                        height="100%"
                                    />
                                </div>
                                <div className="flex-shrink-0 text-right mt-2 text-sm text-gray-500">
                                    {wordCount} {t('words')}
                                </div>
                            </>
                        ) : (
                            <div className="overflow-y-auto space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('longDescription')}</label>
                                    <div data-color-mode="dark" dir={appLanguage === 'ar' ? 'rtl' : 'ltr'} data-editor-field="longDescription">
                                        <MDEditor value={(generatedResult as ProductContent).longDescription} onChange={(val) => handleResultChange('longDescription', val || '')} height={300} preview="live" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('shortDescription')}</label>
                                    <div data-editor-field="shortDescription">
                                        <textarea value={(generatedResult as ProductContent).shortDescription} onChange={e => handleResultChange('shortDescription', e.target.value)} className="text-sm w-full bg-gray-800 border border-gray-700 p-2 rounded-lg h-24 text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        )}
                         {selection && (
                            <InlineAiMenu position={{ top: selection.top, left: selection.left }} onAction={handleAiTextModify} isLoading={isModifyingText} />
                        )}
                    </main>

                    {/* AI Toolkit Sidebar */}
                    <aside className={`flex-shrink-0 bg-gray-800 border-l border-gray-700/50 transition-all duration-300 overflow-y-auto ${isToolkitOpen ? 'w-96 p-4' : 'w-0'}`}>
                         <div className={`space-y-4 ${!isToolkitOpen && 'hidden'}`}>
                            <h3 className="text-lg font-bold text-white">{t('aiToolkit')}</h3>
                            {generatedResult.type === ContentType.Article && (
                                <>
                                    <AIToolkitSection title={t('refineWithAI')} icon={<SparklesIcon/>} isOpen={true} onToggle={() => {}}>
                                        <RefineTool article={generatedResult as ArticleContent} contentLanguage={language} showNotification={showNotification} onRefined={setGeneratedResult} />
                                    </AIToolkitSection>
                                    <AIToolkitSection title={t('featuredImage')} icon={<CameraIcon/>} isOpen={true} onToggle={() => {}}>
                                        <ImageGeneratorTool article={generatedResult as ArticleContent} showNotification={showNotification} onImageChange={setGeneratedResult} />
                                    </AIToolkitSection>
                                    <AIToolkitSection title={t('seoAnalysis')} icon={<SeoIcon/>} isOpen={isSeoToolkitOpen} onToggle={() => setIsSeoToolkitOpen(p => !p)} isLoading={isAnalyzingSeo}>
                                        <SeoAnalyzerTool analysis={seoAnalysis} />
                                    </AIToolkitSection>
                                    {!selectedSite?.isVirtual && (
                                        <AIToolkitSection title={t('internalLinkAssistant')} icon={<LinkIcon/>} isOpen={isLinkToolkitOpen} onToggle={() => setIsLinkToolkitOpen(p => !p)} isLoading={isSuggestingLinks}>
                                            <InternalLinkerTool article={articleForAnalysis!} suggestions={linkSuggestions} onLinkApplied={handleApplyLinkSuggestion} />
                                        </AIToolkitSection>
                                    )}
                                </>
                            )}
                             {!isEditingSyncedPost && (
                                <button onClick={() => onContentGenerated(generatedResult)} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                                   <LibraryIcon/> <span className="ms-2">{t('saveToLibrary')}</span>
                               </button>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        );
    };
    
    const EditorToolbar = ({ onFormat }: { onFormat: (cmd: any) => void}) => {
        const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
        const buttons = [
            { cmd: 'title2', title: 'H2', icon: <HeadingIcon/>},
            { cmd: 'title3', title: 'H3', icon: <HeadingIcon/>},
            { cmd: 'title4', title: 'H4', icon: <HeadingIcon/>},
            { separator: true },
            { cmd: 'bold', title: t('bold'), icon: <BoldIcon/>},
            { cmd: 'italic', title: t('italic'), icon: <ItalicIcon/>},
            { separator: true },
            { cmd: 'unordered-list', title: t('bulletList'), icon: <ListBulletIcon/>},
            { cmd: 'ordered-list', title: t('numberedList'), icon: <ListBulletIcon/>},
            { cmd: 'quote', title: t('quote'), icon: <QuoteIcon/>},
            { cmd: 'link', title: t('addLink'), icon: <LinkIcon/>},
        ];
        
        return (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-1 flex items-center space-x-1 mb-2">
                {buttons.map((btn, i) => btn.separator ? 
                    <div key={`sep-${i}`} className="w-px h-5 bg-gray-600 mx-1"></div> :
                    <button key={btn.cmd} onClick={() => onFormat(btn.cmd)} title={btn.title} className="p-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors">
                        {btn.icon}
                    </button>
                )}
            </div>
        )
    };

    const renderCampaignResultStep = () => {
        if (!generatedCampaign) return null;
        return (
            <div className="max-w-4xl mx-auto p-8">
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">{t('generatedCampaign')}</h1>
                    <p className="text-gray-400 mt-1">{t('reviewCampaignHint')}</p>
                </header>
                <div className="bg-gray-800 rounded-lg p-6 animate-fade-in border border-gray-700/50">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2">
                        <div className="bg-gray-700/50 p-4 rounded-lg border-l-4 border-indigo-400">
                             <div className="flex justify-between items-center mb-2">
                                <h4 className="text-lg font-bold text-white">Pillar Post</h4>
                                <span className="text-xs bg-indigo-600/50 text-indigo-300 font-semibold py-1 px-2 rounded-full">Pillar</span>
                             </div>
                             <input type="text" value={generatedCampaign.pillarPost.title} onChange={e => handleCampaignArticleTitleChange('pillar', 0, e.target.value)} className="text-base font-medium w-full bg-gray-600 p-2 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"/>
                        </div>
                        <div>
                             <h4 className="text-lg font-bold text-white mb-2 mt-6">Cluster Posts</h4>
                             <div className="space-y-3">
                                {generatedCampaign.clusterPosts.map((article, index) => (
                                    <div key={article.id} className="flex items-center gap-4">
                                        <span className="text-gray-400 font-bold">{index + 1}.</span>
                                        <input type="text" value={article.title} onChange={e => handleCampaignArticleTitleChange('cluster', index, e.target.value)} className="text-base font-medium w-full bg-gray-700 p-2 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"/>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center justify-end space-x-4 rtl:space-x-reverse">
                        <button onClick={() => setWizardStep('brief')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('discard')}</button>
                        <button onClick={handleSaveCampaign} className="btn-gradient text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"><LibraryIcon /> <span className="ms-2">{t('saveCampaignToLibrary')}</span></button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="h-full">
            {wizardStep === 'brief' && renderBriefStep()}
            {wizardStep === 'generating' && renderGeneratingStep()}
            {wizardStep === 'editor' && renderEditorStep()}
            {wizardStep === 'campaign_result' && renderCampaignResultStep()}

            {isPublishModalOpen && generatedResult && (
                <PublishModal
                    content={generatedResult}
                    sites={sites}
                    isOpen={isPublishModalOpen}
                    onClose={() => setIsPublishModalOpen(false)}
                    onPublish={((generatedResult as ArticleContent).origin === 'synced') ? handleUpdate : handlePublish}
                    isPublishing={isPublishing}
                    mode={((generatedResult as ArticleContent).origin === 'synced') ? 'update' : 'publish'}
                />
            )}
        </div>
    );
};


export default NewContentView;

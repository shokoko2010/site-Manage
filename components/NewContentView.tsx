import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { ArticleContent, ContentType, GeneratedContent, Language, ProductContent, WordPressSite, SiteContext, Notification, PublishingOptions, LanguageContextType, ArticleLength, SeoAnalysis, ProductContent as ProductContentType, WritingTone, InternalLinkSuggestion, CampaignGenerationResult, MediaItem } from '../types';
import { generateArticle, generateProduct, generateFeaturedImage, generateContentCampaign, analyzeSeo, refineArticle, modifyText, generateInternalLinks, generateFreePlaceholderImages } from '../services/geminiService';
import Spinner from './common/Spinner';
import { ArticleIcon, ProductIcon, SparklesIcon, CameraIcon, CampaignIcon, SeoIcon, LibraryIcon, LinkIcon, ChevronDownIcon, ChevronUpIcon, ArrowPathIcon, CheckCircleIcon, ArrowUturnLeftIcon, Bars3Icon, HeadingIcon, BoldIcon, ItalicIcon, ListBulletIcon, QuoteIcon, PublishIcon, TextColorIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, FolderIcon } from '../constants';
import { getSiteContext, publishContent, updatePost } from '../services/wordpressService';
import PublishModal from './PublishModal';
import { LanguageContext } from '../App';
import InlineAiMenu from './InlineAiMenu';

// Props Interface
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

// Types for internal state
type SelectionInfo = { text: string; top: number; left: number; field: 'body' | 'longDescription' | 'shortDescription'; };
type WizardStep = 'brief' | 'generating' | 'editor' | 'campaign_result';

// Helper Components (defined outside the main component to prevent hook errors)

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

const EditorHeaderBar = ({ title, onTitleChange, onExit, onToolkitToggle, isToolkitOpen, onPublish, isEditing, isVirtual }: { title: string, onTitleChange: (t: string) => void, onExit: () => void, onToolkitToggle: () => void, isToolkitOpen: boolean, onPublish: () => void, isEditing: boolean, isVirtual: boolean }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    return (
        <header className="flex-shrink-0 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <button onClick={onExit} className="p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                    <ArrowUturnLeftIcon/>
                </button>
                <div className="w-px h-6 bg-gray-700"></div>
                <input 
                   type="text"
                   value={title}
                   onChange={e => onTitleChange(e.target.value)}
                   placeholder={t('tableTitle')}
                   className="text-lg font-bold bg-transparent text-white focus:outline-none w-full max-w-lg"
                />
            </div>
            <div className="flex items-center space-x-3">
                <button onClick={onToolkitToggle} className={`p-2 rounded-md ${isToolkitOpen ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'} transition-colors`} title={t('aiToolkit')}>
                    <Bars3Icon />
                </button>
                {!isVirtual && (
                    <button onClick={onPublish} className="btn-gradient text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center transition-transform hover:scale-105">
                        <PublishIcon />
                        <span className="ms-2">{isEditing ? t('updatePost') : t('publish')}</span>
                    </button>
                )}
            </div>
        </header>
    );
};

const ColorPicker = ({ onSelect, onClose }: { onSelect: (color: string) => void, onClose: () => void }) => {
    const colors = ['#FFFFFF', '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#14B8A6', '#0EA5E9', '#6366F1', '#8B5CF6', '#EC4899'];
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={ref} className="absolute z-10 top-full mt-2 bg-gray-600 p-2 rounded-lg shadow-2xl border border-gray-500 flex flex-wrap w-40">
            {colors.map(color => (
                <button key={color} onClick={() => onSelect(color)} className="w-6 h-6 m-1 rounded-full border-2 border-transparent hover:border-white transition-colors" style={{ backgroundColor: color }} />
            ))}
        </div>
    );
};

const EditorToolbar = ({ onFormat, onAdvancedFormat }: { onFormat: (cmd: any) => void, onAdvancedFormat: (type: 'color' | 'align', value: string) => void }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

    const buttons = [
        { cmd: 'title2', title: 'H2', icon: <HeadingIcon/>, type: 'basic'},
        { cmd: 'title3', title: 'H3', icon: <HeadingIcon/>, type: 'basic'},
        { cmd: 'title4', title: 'H4', icon: <HeadingIcon/>, type: 'basic'},
        { separator: true },
        { cmd: 'bold', title: t('bold'), icon: <BoldIcon/>, type: 'basic'},
        { cmd: 'italic', title: t('italic'), icon: <ItalicIcon/>, type: 'basic'},
        { separator: true },
        { cmd: 'unordered-list', title: t('bulletList'), icon: <ListBulletIcon/>, type: 'basic'},
        { cmd: 'ordered-list', title: t('numberedList'), icon: <ListBulletIcon/>, type: 'basic'},
        { cmd: 'quote', title: t('quote'), icon: <QuoteIcon/>, type: 'basic'},
        { cmd: 'link', title: t('addLink'), icon: <LinkIcon/>, type: 'basic'},
        { separator: true },
        { type: 'color', title: t('textColor'), icon: <TextColorIcon /> },
        { type: 'align', value: 'left', title: t('alignLeft'), icon: <AlignLeftIcon /> },
        { type: 'align', value: 'center', title: t('alignCenter'), icon: <AlignCenterIcon /> },
        { type: 'align', value: 'right', title: t('alignRight'), icon: <AlignRightIcon /> },
    ];
    
    return (
        <div className="relative bg-gray-800 rounded-lg border border-gray-700 p-1 flex items-center space-x-1 mb-2">
            {buttons.map((btn: any, i) => btn.separator ? 
                <div key={`sep-${i}`} className="w-px h-5 bg-gray-600 mx-1"></div> :
                <button 
                    key={btn.title} 
                    onClick={() => {
                        if (btn.type === 'basic') onFormat(btn.cmd);
                        else if (btn.type === 'color') setIsColorPickerOpen(p => !p);
                        else if (btn.type === 'align') onAdvancedFormat(btn.type, btn.value);
                    }}
                    title={btn.title} 
                    className="p-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                >
                    {btn.icon}
                </button>
            )}
            {isColorPickerOpen && <ColorPicker onSelect={(color) => { onAdvancedFormat('color', color); setIsColorPickerOpen(false); }} onClose={() => setIsColorPickerOpen(false)} />}
        </div>
    )
};

const RefineTool: React.FC<{
    article: ArticleContent;
    contentLanguage: Language;
    showNotification: (notification: Notification) => void;
    onRefined: (content: GeneratedContent) => void;
}> = ({ article, contentLanguage, showNotification, onRefined }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [refineInstruction, setRefineInstruction] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    
    const handleRefine = async (isAutoRefine: boolean = false) => {
        setIsRefining(true);
        try {
            const instruction = isAutoRefine ? 'Auto-improve this article. Focus on clarity, flow, grammar, and SEO.' : refineInstruction;
            const refinedContent = await refineArticle(article, instruction, contentLanguage);
            onRefined({ ...article, ...refinedContent });
            showNotification({ message: t('articleImproved'), type: 'success' });
        } catch (err) {
            showNotification({ message: err instanceof Error ? err.message : t('errorUnknown'), type: 'error' });
        } finally {
            setIsRefining(false);
        }
    };


    return (
        <div className="space-y-3">
             <button
                onClick={() => handleRefine(true)}
                disabled={isRefining}
                className="w-full flex items-center justify-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 text-base"
            >
                {isRefining ? <Spinner size="sm" /> : <SparklesIcon />}
                <span className="ms-2">{isRefining ? t('improvingArticle') : t('autoImproveArticle')}</span>
            </button>

            <div className="flex items-center text-xs text-gray-500">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-2">OR</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>

            <textarea
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
                placeholder={t('refinementPlaceholder')}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={2}
                disabled={isRefining}
            />
            <button
                onClick={() => handleRefine(false)}
                disabled={isRefining || !refineInstruction}
                className="w-full flex items-center justify-center py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="ms-2">{isRefining ? t('refiningArticle') : t('refineWithInstruction')}</span>
            </button>
        </div>
    );
};

const ImageGeneratorTool: React.FC<{
    article: ArticleContent;
    showNotification: (notification: Notification) => void;
    onImageChange: (updates: Partial<ArticleContent>) => void;
    siteContext: SiteContext | null;
    isContextLoading: boolean;
}> = ({ article, showNotification, onImageChange, siteContext, isContextLoading }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatorMode, setGeneratorMode] = useState<'professional' | 'free'>('professional');
    const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate');

    const handleGenerateImages = async () => {
        setIsGenerating(true);
        onImageChange({ generatedImageOptions: [] });
        showNotification({ message: t('imageGenStarted'), type: 'info' });
        try {
            let images: string[] = [];
            if (generatorMode === 'professional') {
                const prompt = `Photorealistic image for a blog post titled "${article.title}". The theme is: ${article.metaDescription}. 16:9 aspect ratio.`;
                images = await generateFeaturedImage(prompt);
            } else {
                images = await generateFreePlaceholderImages(article.title);
            }
            onImageChange({ generatedImageOptions: images });
        } catch (err) {
            showNotification({ message: t('imageGenFail'), type: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelectImage = (imgBase64: string) => {
        onImageChange({
            featuredImage: imgBase64,
            featuredMediaId: undefined,
            featuredMediaUrl: undefined,
        });
    };

    const handleSelectFromLibrary = (media: MediaItem) => {
        onImageChange({
            featuredImage: undefined,
            generatedImageOptions: [],
            featuredMediaId: media.id,
            featuredMediaUrl: media.source_url,
        });
    };

    const previewSrc = article.featuredMediaUrl || (article.featuredImage ? `data:image/jpeg;base64,${article.featuredImage}` : null);

    return (
        <div className="space-y-3">
            <div className="bg-gray-800/80 rounded-lg p-1 flex items-center text-sm border border-gray-600">
                <button onClick={() => setActiveTab('generate')} className={`flex-1 py-1 rounded-md transition-colors flex items-center justify-center space-x-2 ${activeTab === 'generate' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                    <CameraIcon /> <span>{t('generateImage')}</span>
                </button>
                <button onClick={() => setActiveTab('library')} disabled={!siteContext} className={`flex-1 py-1 rounded-md transition-colors flex items-center justify-center space-x-2 ${activeTab === 'library' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'} disabled:text-gray-500 disabled:cursor-not-allowed`}>
                    <FolderIcon /> <span>{t('mediaLibrary')}</span>
                </button>
            </div>

            {previewSrc && (
                <div className="rounded-lg overflow-hidden border-2 border-indigo-500">
                    <img src={previewSrc} alt="Selected featured image" className="w-full h-40 object-cover" />
                </div>
            )}

            {activeTab === 'generate' && (
                <>
                    <div className="bg-gray-800/80 rounded-lg p-1 flex items-center text-sm border border-gray-600">
                        <button onClick={() => setGeneratorMode('professional')} className={`flex-1 py-1 rounded-md transition-colors ${generatorMode === 'professional' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t('professionalGenerator')}</button>
                        <button onClick={() => setGeneratorMode('free')} className={`flex-1 py-1 rounded-md transition-colors ${generatorMode === 'free' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t('freeGenerator')}</button>
                    </div>
                    <p className="text-xs text-gray-500 text-center px-2">
                        {generatorMode === 'professional' ? t('professionalGeneratorHint') : t('freeGeneratorHint')}
                    </p>

                    <button onClick={handleGenerateImages} disabled={isGenerating} className="w-full flex items-center justify-center py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-semibold transition-colors disabled:opacity-50">
                        {isGenerating ? <Spinner size="sm" /> : <SparklesIcon />}
                        <span className="ms-2">{isGenerating ? t('generatingImages') : t('generateImages')}</span>
                    </button>

                    {article.generatedImageOptions && article.generatedImageOptions.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                            {article.generatedImageOptions.map((img, index) => (
                                <button key={index} onClick={() => handleSelectImage(img)} className={`rounded-lg overflow-hidden border-2 transition-colors ${article.featuredImage === img ? 'border-indigo-500' : 'border-transparent hover:border-indigo-400'}`}>
                                    <img src={`data:image/jpeg;base64,${img}`} alt={`Generated image option ${index + 1}`} className="w-full h-24 object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === 'library' && (
                <div className="max-h-96 overflow-y-auto">
                    {isContextLoading ? (
                        <div className="flex justify-center items-center h-32"><Spinner /></div>
                    ) : siteContext && siteContext.media.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {siteContext.media.map(media => (
                                <button key={media.id} onClick={() => handleSelectFromLibrary(media)} className={`rounded-lg overflow-hidden border-2 transition-colors ${article.featuredMediaId === media.id ? 'border-indigo-500' : 'border-transparent hover:border-indigo-400'}`}>
                                    <img src={media.source_url} alt={media.alt_text} className="w-full h-24 object-cover" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-10">{t('noMediaFound')}</p>
                    )}
                </div>
            )}
        </div>
    );
};

const SeoAnalyzerTool: React.FC<{ analysis: SeoAnalysis }> = ({ analysis }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const scoreColor = analysis.score >= 80 ? 'text-green-400' : analysis.score >= 50 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="space-y-3">
            <div className="text-center">
                <p className="text-gray-400 text-sm">{t('seoScore')}</p>
                <p className={`text-4xl font-bold ${scoreColor}`}>{analysis.score}<span className="text-lg">/100</span></p>
            </div>
            <div>
                 <p className="text-gray-300 font-semibold text-sm mb-2">{t('seoSuggestions')}</p>
                 <ul className="space-y-2 text-sm text-gray-400">
                    {analysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                            <CheckCircleIcon className="w-4 h-4 text-green-500 me-2 mt-0.5 flex-shrink-0" />
                            <span>{suggestion}</span>
                        </li>
                    ))}
                 </ul>
            </div>
        </div>
    );
};

const InternalLinkerTool: React.FC<{
    suggestions: InternalLinkSuggestion[];
    onLinkApplied: (suggestion: InternalLinkSuggestion) => void;
}> = ({ suggestions, onLinkApplied }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    
    if (suggestions.length === 0) {
        return <p className="text-sm text-gray-500">{t('noLinksFound')}</p>;
    }
    
    return (
        <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-gray-800/50 p-3 rounded-lg border border-gray-600">
                    <p className="text-sm text-gray-300">
                        {t('linkSuggestionText', { textToLink: `"${suggestion.textToLink}"`, postTitle: `"${suggestion.postTitle}"` })}
                    </p>
                    <button
                        onClick={() => onLinkApplied(suggestion)}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1 px-3 rounded-md mt-2 transition-colors"
                    >
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
    
    // Global States
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Content state
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
    const [isThinkingEnabled, setIsThinkingEnabled] = useState(true);

    // Editor & Toolkit states
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
    
    // Site Context for Editor
    const [siteContext, setSiteContext] = useState<SiteContext | null>(null);
    const [isContextLoading, setIsContextLoading] = useState(false);
    
    // Derived states
    const articleForAnalysis = generatedResult?.type === ContentType.Article ? (generatedResult as ArticleContent) : null;
    const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);

    const wordCount = useMemo(() => {
        if (!generatedResult || generatedResult.type !== ContentType.Article) return 0;
        const body = (generatedResult as ArticleContent).body;
        return body ? body.trim().split(/\s+/).filter(Boolean).length : 0;
    }, [generatedResult]);
    
    const sanitizeSchema = useMemo(() => ({
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        span: [...(defaultSchema.attributes?.span || []), ['style', /^color: *[#a-zA-Z0-9(),]+;?$/]],
        p: [...(defaultSchema.attributes?.p || []), ['style', /^text-align: *(left|right|center|justify);?$/]],
        div: [...(defaultSchema.attributes?.div || []), ['style', /^text-align: *(left|right|center|justify);?$/]],
      },
    }), []);


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


    // Handle site selection changes
    useEffect(() => {
        if (!selectedSiteId && sites.length > 0) {
            setSelectedSiteId(sites[0].id);
        }
        if (selectedSite?.isVirtual) {
            setUseGoogleSearch(true);
        }
    }, [sites, selectedSiteId, selectedSite?.isVirtual]);

    useEffect(() => {
        if (selectedSite && !selectedSite.isVirtual) {
            setIsContextLoading(true);
            getSiteContext(selectedSite)
                .then(setSiteContext)
                .catch(err => {
                    console.error("Failed to load site context:", err);
                    showNotification({ message: 'Failed to load site library data.', type: 'error' });
                    setSiteContext(null);
                })
                .finally(() => setIsContextLoading(false));
        } else {
            setSiteContext(null);
        }
    }, [selectedSite]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setWizardStep('generating');

        try {
            if (activeTab === ContentType.Article) await handleGenerateArticle();
            else if (activeTab === ContentType.Product) await handleGenerateProduct();
            else if (activeTab === ContentType.Campaign) await handleGenerateCampaign();
        } catch (err) {
            const message = err instanceof Error ? err.message : t('errorUnknown');
            setError(message);
            showNotification({ message, type: 'error' });
            setWizardStep('brief');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateArticle = async () => {
        if (!articleTopic) throw new Error(t('errorAllFieldsRequired'));
        const result = await generateArticle(articleTopic, articleKeywords, tone, language, articleLength, useGoogleSearch, isThinkingEnabled, siteContext);
        setGeneratedResult({ ...result, siteId: selectedSiteId, origin: 'new' });
        setWizardStep('editor');
    };

    const handleGenerateProduct = async () => {
        if (!productName) throw new Error(t('errorAllFieldsRequired'));
        const result = await generateProduct(productName, productFeatures, language, isThinkingEnabled);
        setGeneratedResult({ ...result, siteId: selectedSiteId });
        setWizardStep('editor');
    };
    
    const handleGenerateCampaign = async () => {
        if (!campaignTopic || !selectedSiteId) throw new Error(t('errorAllFieldsRequired'));
        const campaignResult = await generateContentCampaign(campaignTopic, numArticles, language, isThinkingEnabled);
        const updatedPillar = { ...campaignResult.pillarPost, siteId: selectedSiteId };
        const updatedClusters = campaignResult.clusterPosts.map(c => ({...c, siteId: selectedSiteId}));
        setGeneratedCampaign({ pillarPost: updatedPillar, clusterPosts: updatedClusters });
        setWizardStep('campaign_result');
    };

    const updateGeneratedResult = (updates: Partial<GeneratedContent>) => {
        if (!generatedResult) return;
        setGeneratedResult(prev => {
             if (!prev) return null;
             return { ...prev, ...updates } as GeneratedContent;
        });
    };
    
    const handleAnalyzeSeo = async () => {
        if (!articleForAnalysis) return;
        setIsAnalyzingSeo(true);
        setSeoAnalysis(null);
        try {
            const result = await analyzeSeo(articleForAnalysis.title, articleForAnalysis.body);
            setSeoAnalysis(result);
        } catch (err) {
            showNotification({ message: err instanceof Error ? err.message : t('errorUnknown'), type: 'error' });
        } finally {
            setIsAnalyzingSeo(false);
        }
    };

    const handleSuggestLinks = async () => {
        if (!articleForAnalysis || !selectedSite || selectedSite.isVirtual || !siteContext) {
            showNotification({ message: 'Internal linking requires a connected site with loaded context.', type: 'info'});
            return;
        };
        setIsSuggestingLinks(true);
        setLinkSuggestions(null);
        try {
            if (!siteContext.recentPosts || siteContext.recentPosts.length === 0) {
                 setLinkSuggestions([]);
                 return;
            }
            const results = await generateInternalLinks(articleForAnalysis.body, siteContext);
            setLinkSuggestions(results);
        } catch (err) {
            showNotification({ message: err instanceof Error ? err.message : t('errorUnknown'), type: 'error' });
        } finally {
            setIsSuggestingLinks(false);
        }
    };


    const handlePublishOrUpdate = async (options: PublishingOptions) => {
        const siteToPublish = sites.find(s => s.id === options.siteId);
        if (!generatedResult || !siteToPublish) return;
        setIsPublishing(true);
        try {
            const isUpdate = (generatedResult as ArticleContent)?.origin === 'synced';
            const postId = (generatedResult as ArticleContent)?.postId;
            
            const result = isUpdate && postId
                ? await updatePost(siteToPublish, postId, generatedResult as ArticleContent, options)
                : await publishContent(siteToPublish, generatedResult, options);
            
            const successMsgKey = isUpdate ? 'updateSuccess' : 'publishSuccess';
            showNotification({ message: t(successMsgKey, { url: result.postUrl }), type: 'success' });
            setIsPublishModalOpen(false);
            onExit();
        } catch (err) {
            const errorMsgKey = (generatedResult as ArticleContent)?.origin === 'synced' ? 'updateFail' : 'publishFail';
            showNotification({ message: t(errorMsgKey, { error: err instanceof Error ? String(err) : String(err) }), type: 'error' });
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
        setGeneratedCampaign(prev => {
            if (!prev) return null;
            const updated = { ...prev };
            if (type === 'pillar') updated.pillarPost.title = newTitle;
            else updated.clusterPosts[index].title = newTitle;
            return updated;
        });
    };
    
    const handleTextSelection = (event: React.MouseEvent<HTMLDivElement>) => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
            const text = selection.toString().trim();
            if (text.length > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                
                let target = event.target as HTMLElement;
                let field: SelectionInfo['field'] | null = null;
                while (target && !field) {
                    const fieldAttribute = target.getAttribute('data-editor-field');
                    if (fieldAttribute) {
                        field = fieldAttribute as SelectionInfo['field'];
                    }
                    target = target.parentElement as HTMLElement;
                }
                
                if (field && resultViewRef.current) {
                   const containerRect = resultViewRef.current.getBoundingClientRect();
                    setSelection({
                        text: text,
                        top: rect.top - containerRect.top,
                        left: rect.left - containerRect.left + rect.width / 2,
                        field: field
                    });
                }
            } else {
                 setSelection(null);
            }
        } else {
            setSelection(null);
        }
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
                (newResult as any)[selection.field] = currentText.replace(selection.text, modifiedText);
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
        updateGeneratedResult({body: newBody});
        setLinkSuggestions(prev => prev ? prev.filter(s => s.textToLink !== suggestion.textToLink) : null);
    };

     const handleFormat = (command: any) => {
        if (editorRef.current) {
            editorRef.current.executeCommand(command, command.replace('title',''));
        }
    };

    const handleAdvancedFormat = (type: 'color' | 'align', value: string) => {
        const editor = editorRef.current?.textarea;
        if (!editor || !generatedResult) return;

        const selectionStart = editor.selectionStart;
        const selectionEnd = editor.selectionEnd;
        const currentBody = (generatedResult as ArticleContent).body;
        
        let newBody;
        if (type === 'color') {
            const selectedText = currentBody.substring(selectionStart, selectionEnd);
            const replacement = `<span style="color:${value};">${selectedText}</span>`;
            newBody = currentBody.substring(0, selectionStart) + replacement + currentBody.substring(selectionEnd);
        } else { // align
            const lineStart = currentBody.lastIndexOf('\n', selectionStart - 1) + 1;
            const lineEnd = currentBody.indexOf('\n', selectionEnd);
            const finalLineEnd = lineEnd === -1 ? currentBody.length : lineEnd;
            const lineText = currentBody.substring(lineStart, finalLineEnd);
            
            // Remove existing alignment tags if any
            const cleanedLine = lineText.replace(/<p style="text-align:.*;">(.*?)<\/p>/, '$1');
            const replacement = `<p style="text-align:${value};">${cleanedLine}</p>`;
            newBody = currentBody.substring(0, lineStart) + replacement + currentBody.substring(finalLineEnd);
        }
        
        updateGeneratedResult({body: newBody});
    };


    const renderBriefStep = () => {
        return (
            <div className="fixed inset-0 bg-gray-900 z-40 flex items-center justify-center p-4 animate-fade-in-fast">
                <div className="w-full max-w-4xl mx-auto">
                    <button onClick={onExit} className="absolute top-4 right-4 text-gray-500 hover:text-white">&times;</button>
                     <h1 className="text-3xl font-bold text-white text-center">{t('createNewContent')}</h1>
                    <p className="text-gray-400 mt-2 text-center mb-8">{t('createNewContentHint')}</p>
    
                    <div className="bg-gray-800 rounded-2xl p-2 flex items-center justify-center w-max mx-auto mb-6 border border-gray-700/50">
                        {(Object.keys(ContentType) as Array<keyof typeof ContentType>).map(key => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(ContentType[key])}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-xl transition-colors ${activeTab === ContentType[key] ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-700/50'}`}
                            >
                                {t(ContentType[key].toLowerCase() as any)}
                            </button>
                        ))}
                    </div>
    
                    <form onSubmit={handleGenerate} className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700/50">
                        {/* Common fields */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('writingTone')}</label>
                                <select value={tone} onChange={e => setTone(e.target.value as WritingTone)} className="w-full bg-gray-700 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {Object.values(WritingTone).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('language')}</label>
                                <select value={language} onChange={e => setLanguage(e.target.value as Language)} className="w-full bg-gray-700 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                         </div>
                        
                        {/* Article Form */}
                        {activeTab === ContentType.Article && (
                           <div className="space-y-4">
                               <input type="text" value={articleTopic} onChange={e => setArticleTopic(e.target.value)} placeholder={t('topicTitlePlaceholder')} className="w-full text-lg bg-gray-700 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                               <input type="text" value={articleKeywords} onChange={e => setArticleKeywords(e.target.value)} placeholder={t('keywordsPlaceholder')} className="w-full bg-gray-700 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <select value={articleLength} onChange={e => setArticleLength(e.target.value as ArticleLength)} className="w-full bg-gray-700 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {Object.values(ArticleLength).map(len => <option key={len} value={len}>{len}</option>)}
                                </select>
                           </div>
                        )}
                        
                        {/* Product Form */}
                        {activeTab === ContentType.Product && (
                            <div className="space-y-4">
                                <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder={t('productNamePlaceholder')} className="w-full text-lg bg-gray-700 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <textarea value={productFeatures} onChange={e => setProductFeatures(e.target.value)} placeholder={t('productFeaturesPlaceholder')} rows={4} className="w-full bg-gray-700 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        )}
                        
                         {/* Campaign Form */}
                        {activeTab === ContentType.Campaign && (
                            <div className="space-y-4">
                                <input type="text" value={campaignTopic} onChange={e => setCampaignTopic(e.target.value)} placeholder={t('mainTopicPlaceholder')} className="w-full text-lg bg-gray-700 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('numArticles')}</label>
                                    <input type="number" value={numArticles} onChange={e => setNumArticles(parseInt(e.target.value, 10))} min="2" max="10" className="w-full bg-gray-700 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                        )}

                        <div className="mt-6 border-t border-gray-700 pt-6 space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('generateForSite')}</label>
                                <select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} className="w-full bg-gray-700 border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {sites.length > 0 ? sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>) : <option>{t('noSitesAvailable')}</option>}
                                </select>
                            </div>
                            {activeTab === ContentType.Article && !selectedSite?.isVirtual && (
                                <div className="flex items-center">
                                    <input id="use-google-search" type="checkbox" checked={useGoogleSearch} onChange={e => setUseGoogleSearch(e.target.checked)} className="h-4 w-4 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500 bg-gray-700" />
                                    <label htmlFor="use-google-search" className="ms-2 text-sm text-gray-200">{t('useGoogleSearch')}</label>
                                </div>
                            )}
                            <div className="flex items-start pt-2">
                                <input id="enable-thinking" type="checkbox" checked={isThinkingEnabled} onChange={e => setIsThinkingEnabled(e.target.checked)} className="h-4 w-4 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500 bg-gray-700 mt-0.5 flex-shrink-0" />
                                <div className="ms-3">
                                    <label htmlFor="enable-thinking" className="text-sm font-medium text-gray-200">{t('enableThinking')}</label>
                                    <p className="text-xs text-gray-400">{t('enableThinkingHint')}</p>
                                </div>
                            </div>
                            <button type="submit" className="w-full btn-gradient text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center text-lg transition-transform hover:scale-105" disabled={isLoading}>
                                {isLoading ? <Spinner /> : <><SparklesIcon className="me-2" /> {activeTab === ContentType.Campaign ? t('generateCampaign') : t('generateContent')}</>}
                            </button>
                        </div>
    
                        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                    </form>
                </div>
            </div>
        );
    };

    const renderGeneratingStep = () => (
        <div className="fixed inset-0 bg-gray-900 z-40 flex flex-col items-center justify-center text-center">
            <Spinner size="lg"/>
            <h1 className="text-3xl font-bold text-white mt-6">{t('step2_generating_title')}</h1>
            <p className="text-gray-400 mt-2">{t('step2_generating_hint')}</p>
        </div>
    );
    
    const renderEditorStep = () => {
        if (!generatedResult) return <div className="fixed inset-0 bg-gray-900 z-40 flex items-center justify-center"><Spinner /></div>;
        
        const isEditingSyncedPost = (generatedResult as ArticleContent)?.origin === 'synced';
        
        return(
            <div className="fixed inset-0 bg-gray-900 z-40 flex flex-col animate-fade-in-fast">
                <EditorHeaderBar 
                    title={generatedResult.title}
                    onTitleChange={(newTitle) => updateGeneratedResult({ title: newTitle })}
                    onExit={onExit}
                    onToolkitToggle={() => setIsToolkitOpen(p => !p)}
                    isToolkitOpen={isToolkitOpen}
                    onPublish={() => setIsPublishModalOpen(true)}
                    isEditing={isEditingSyncedPost}
                    isVirtual={selectedSite?.isVirtual === true}
                />
                
                <div className="flex-grow flex items-stretch overflow-hidden">
                    <main ref={resultViewRef} className="flex-grow flex flex-col p-4 md:p-6 lg:p-8" onMouseUp={handleTextSelection}>
                        {generatedResult.type === ContentType.Article ? (
                             <>
                                <div className="flex-shrink-0">
                                    <EditorToolbar onFormat={handleFormat} onAdvancedFormat={handleAdvancedFormat} />
                                </div>
                                <div className="flex-grow relative" data-color-mode="dark" dir={language === 'Arabic' ? 'rtl' : 'ltr'} data-editor-field="body">
                                    <MDEditor
                                        ref={editorRef}
                                        value={(generatedResult as ArticleContent).body}
                                        onChange={(val) => updateGeneratedResult({ body: val || '' })}
                                        preview="live"
                                        previewOptions={{ remarkPlugins: [remarkGfm], rehypePlugins: [[rehypeSanitize, sanitizeSchema]] }}
                                        className="!h-full !w-full !flex !flex-col"
                                        style={{ background: 'transparent', border: 0 }}
                                        textareaProps={{
                                            className: `!text-lg !leading-relaxed ${language === 'Arabic' ? '!text-center' : ''}`
                                        }}
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
                                    <div data-color-mode="dark" dir={language === 'Arabic' ? 'rtl' : 'ltr'} data-editor-field="longDescription">
                                        <MDEditor value={(generatedResult as ProductContent).longDescription} onChange={(val) => updateGeneratedResult({ longDescription: val || '' })} height={300} preview="live" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('shortDescription')}</label>
                                    <div data-editor-field="shortDescription">
                                        <textarea value={(generatedResult as ProductContent).shortDescription} onChange={e => updateGeneratedResult({ shortDescription: e.target.value })} className="text-sm w-full bg-gray-800 border border-gray-700 p-2 rounded-lg h-24 text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        )}
                         {selection && <InlineAiMenu position={{ top: selection.top, left: selection.left }} onAction={handleAiTextModify} isLoading={isModifyingText} />}
                    </main>

                    <aside className={`flex-shrink-0 bg-gray-800 border-l border-gray-700/50 transition-all duration-300 overflow-y-auto ${isToolkitOpen ? 'w-96 p-4' : 'w-0'}`}>
                         <div className={`space-y-4 ${!isToolkitOpen && 'hidden'}`}>
                            <h3 className="text-lg font-bold text-white">{t('aiToolkit')}</h3>
                            {generatedResult.type === ContentType.Article && (
                                <>
                                    <AIToolkitSection title={t('refineWithAI')} icon={<SparklesIcon/>} isOpen={true} onToggle={() => {}}>
                                        <RefineTool article={generatedResult as ArticleContent} contentLanguage={language} showNotification={showNotification} onRefined={setGeneratedResult} />
                                    </AIToolkitSection>
                                    <AIToolkitSection title={t('featuredImage')} icon={<CameraIcon/>} isOpen={true} onToggle={() => {}}>
                                        <ImageGeneratorTool
                                            article={generatedResult as ArticleContent}
                                            showNotification={showNotification}
                                            onImageChange={updateGeneratedResult}
                                            siteContext={siteContext}
                                            isContextLoading={isContextLoading}
                                        />
                                    </AIToolkitSection>
                                    
                                    <AIToolkitSection title={t('seoAnalysis')} icon={<SeoIcon/>} isOpen={isSeoToolkitOpen} onToggle={() => setIsSeoToolkitOpen(p => !p)} isLoading={isAnalyzingSeo}>
                                        {seoAnalysis ? (
                                            <div className="space-y-3">
                                                <SeoAnalyzerTool analysis={seoAnalysis} />
                                                <button onClick={handleAnalyzeSeo} disabled={isAnalyzingSeo} className="w-full mt-2 flex items-center justify-center py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 text-sm">
                                                    {isAnalyzingSeo ? <Spinner size="sm" /> : <ArrowPathIcon />}
                                                    <span className="ms-2">{t('reAnalyze')}</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-sm text-gray-400 mb-3">{t('seoAnalysisHint')}</p>
                                                <button onClick={handleAnalyzeSeo} disabled={isAnalyzingSeo} className="w-full flex items-center justify-center py-2 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-semibold transition-colors disabled:opacity-50">
                                                    {isAnalyzingSeo ? <Spinner size="sm" /> : <SeoIcon />}
                                                    <span className="ms-2">{t('analyzeNow')}</span>
                                                </button>
                                            </div>
                                        )}
                                    </AIToolkitSection>

                                    {!selectedSite?.isVirtual && (
                                        <AIToolkitSection title={t('internalLinkAssistant')} icon={<LinkIcon/>} isOpen={isLinkToolkitOpen} onToggle={() => setIsLinkToolkitOpen(p => !p)} isLoading={isSuggestingLinks}>
                                            {linkSuggestions ? (
                                                <div className="space-y-3">
                                                    <InternalLinkerTool suggestions={linkSuggestions} onLinkApplied={handleApplyLinkSuggestion} />
                                                    <button onClick={handleSuggestLinks} disabled={isSuggestingLinks} className="w-full mt-2 flex items-center justify-center py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 text-sm">
                                                        {isSuggestingLinks ? <Spinner size="sm" /> : <ArrowPathIcon />}
                                                        <span className="ms-2">{t('findLinksAgain')}</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                 <div className="text-center">
                                                    <p className="text-sm text-gray-400 mb-3">{t('internalLinkAssistantHint')}</p>
                                                    <button onClick={handleSuggestLinks} disabled={isSuggestingLinks} className="w-full flex items-center justify-center py-2 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-semibold transition-colors disabled:opacity-50">
                                                        {isSuggestingLinks ? <Spinner size="sm" /> : <LinkIcon />}
                                                        <span className="ms-2">{t('findLinks')}</span>
                                                    </button>
                                                </div>
                                            )}
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
                {isPublishModalOpen && generatedResult && (
                    <PublishModal
                        isOpen={isPublishModalOpen}
                        onClose={() => setIsPublishModalOpen(false)}
                        onPublish={handlePublishOrUpdate}
                        content={generatedResult}
                        sites={sites}
                        isPublishing={isPublishing}
                        mode={isEditingSyncedPost ? 'update' : 'publish'}
                    />
                )}
            </div>
        );
    };

    const renderCampaignResultStep = () => {
         if (!generatedCampaign) return null;
        return (
            <div className="fixed inset-0 bg-gray-900 z-40 flex flex-col items-center justify-center p-4 animate-fade-in-fast">
                <div className="w-full max-w-4xl bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700/50">
                    <h1 className="text-3xl font-bold text-white text-center">{t('generatedCampaign')}</h1>
                    <p className="text-gray-400 mt-2 text-center mb-8">{t('reviewCampaignHint')}</p>
                    
                    <div className="space-y-6 max-h-[60vh] overflow-y-auto p-2">
                        {/* Pillar Post */}
                        <div className="bg-indigo-900/50 p-4 rounded-lg border border-indigo-700">
                             <h3 className="text-lg font-semibold text-indigo-300 mb-2">Pillar Post</h3>
                             <input 
                                type="text"
                                value={generatedCampaign.pillarPost.title}
                                onChange={e => handleCampaignArticleTitleChange('pillar', 0, e.target.value)}
                                className="w-full bg-gray-700 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Cluster Posts */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-300">Cluster Posts ({generatedCampaign.clusterPosts.length})</h3>
                            {generatedCampaign.clusterPosts.map((post, index) => (
                                 <input
                                    key={index}
                                    type="text"
                                    value={post.title}
                                    onChange={e => handleCampaignArticleTitleChange('cluster', index, e.target.value)}
                                    className="w-full bg-gray-700 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between items-center">
                        <button onClick={onExit} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">{t('discard')}</button>
                        <button onClick={handleSaveCampaign} className="btn-gradient text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center text-lg transition-transform hover:scale-105">
                           {t('saveCampaignToLibrary')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    // Main render logic
    switch (wizardStep) {
        case 'brief':
            return renderBriefStep();
        case 'generating':
            return renderGeneratingStep();
        case 'editor':
            return renderEditorStep();
        case 'campaign_result':
            return renderCampaignResultStep();
        default:
            return renderBriefStep();
    }
};


export default NewContentView;
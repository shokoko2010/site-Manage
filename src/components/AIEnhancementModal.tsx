import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import Spinner from './common/Spinner';
import { useLanguage } from '../contexts/LanguageContext';
import { 
    CONTENT_TEMPLATES, 
    generateContentWithTemplate, 
    customizeContentStyle, 
    generateImageForContent, 
    summarizeContent, 
    paraphraseContent, 
    ensureGDPRCompliance,
    type ContentTemplate,
    type ContentStyleOptions,
    type ImageGenerationOptions,
    type SummarizationOptions,
    type GDPRSettings
} from '../services/aiEnhancementService';
import { ArticleContent, Language, WritingTone, ArticleLength, GeneratedContent } from '../types/types';
import { SparklesIcon, DocumentTextIcon, PhotoIcon, ChatBubbleLeftIcon, ArrowPathIcon, ShieldCheckIcon, SettingsIcon, CheckCircleIcon } from '../lib/constants';

interface AIEnhancementModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: ArticleContent;
    onContentUpdate: (content: ArticleContent) => void;
    showNotification: (notification: { message: string; type: 'success' | 'error' | 'info' }) => void;
}

type EnhancementType = 'template' | 'style' | 'image' | 'summary' | 'paraphrase' | 'gdpr';

const AIEnhancementModal: React.FC<AIEnhancementModalProps> = ({ 
    isOpen, 
    onClose, 
    content, 
    onContentUpdate, 
    showNotification 
}) => {
    const { t } = useLanguage();
    const [selectedEnhancement, setSelectedEnhancement] = useState<EnhancementType>('template');
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<any>(null);
    
    // Template generation state
    const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate>(CONTENT_TEMPLATES[0]);
    const [topic, setTopic] = useState(content.title);
    const [keywords, setKeywords] = useState('');
    
    // Style customization state
    const [styleOptions, setStyleOptions] = useState<ContentStyleOptions>({
        tone: WritingTone.Friendly,
        formality: 'neutral',
        perspective: 'third_person',
        vocabulary: 'standard',
        sentenceStructure: 'mixed',
        targetAudience: 'general audience'
    });
    
    // Image generation state
    const [imageOptions, setImageOptions] = useState<ImageGenerationOptions>({
        style: 'professional',
        size: '1024x1024',
        quality: 'standard',
        promptEnhancement: true
    });
    const [imageDescription, setImageDescription] = useState('');
    
    // Summarization state
    const [summaryOptions, setSummaryOptions] = useState<SummarizationOptions>({
        length: 'medium',
        format: 'paragraph',
        includeKeywords: true,
        includeSummary: true
    });
    
    // GDPR state
    const [gdprSettings, setGdprSettings] = useState<GDPRSettings>({
        enabled: true,
        anonymizeData: true,
        dataRetentionDays: 90,
        consentRequired: true,
        userConsent: false
    });

    const enhancementTypes = [
        {
            id: 'template' as EnhancementType,
            name: 'Content Templates',
            description: 'Generate content using predefined structures',
            icon: <DocumentTextIcon className="w-6 h-6" />
        },
        {
            id: 'style' as EnhancementType,
            name: 'Style Customization',
            description: 'Customize tone, formality, and writing style',
            icon: <SettingsIcon className="w-6 h-6" />
        },
        {
            id: 'image' as EnhancementType,
            name: 'Image Generation',
            description: 'Generate AI images for your content',
            icon: <PhotoIcon className="w-6 h-6" />
        },
        {
            id: 'summary' as EnhancementType,
            name: 'Content Summarization',
            description: 'Create summaries and extract key points',
            icon: <ChatBubbleLeftIcon className="w-6 h-6" />
        },
        {
            id: 'paraphrase' as EnhancementType,
            name: 'Content Paraphrasing',
            description: 'Rewrite content while preserving meaning',
            icon: <ArrowPathIcon className="w-6 h-6" />
        },
        {
            id: 'gdpr' as EnhancementType,
            name: 'GDPR Compliance',
            description: 'Ensure content meets privacy regulations',
            icon: <ShieldCheckIcon className="w-6 h-6" />
        }
    ];

    const handleEnhancement = async () => {
        setIsProcessing(true);
        setResults(null);

        try {
            let result;

            switch (selectedEnhancement) {
                case 'template':
                    result = await generateContentWithTemplate(
                        selectedTemplate,
                        topic,
                        keywords,
                        styleOptions,
                        content.language,
                        ArticleLength.Medium
                    );
                    onContentUpdate(result);
                    showNotification({ message: 'Content generated successfully using template!', type: 'success' });
                    break;

                case 'style':
                    result = await customizeContentStyle(content, styleOptions);
                    onContentUpdate(result);
                    showNotification({ message: 'Content style customized successfully!', type: 'success' });
                    break;

                case 'image':
                    const images = await generateImageForContent(content, imageOptions, imageDescription);
                    setResults({ images, imageOptions });
                    showNotification({ message: 'Images generated successfully!', type: 'success' });
                    break;

                case 'summary':
                    const summary = await summarizeContent(content, summaryOptions);
                    setResults(summary);
                    showNotification({ message: 'Content summarized successfully!', type: 'success' });
                    break;

                case 'paraphrase':
                    const paraphrased = await paraphraseContent(content, styleOptions);
                    onContentUpdate(paraphrased);
                    showNotification({ message: 'Content paraphrased successfully!', type: 'success' });
                    break;

                case 'gdpr':
                    const gdprResult = await ensureGDPRCompliance(content);
                    setResults(gdprResult);
                    showNotification({ message: 'GDPR compliance check completed!', type: 'success' });
                    break;
            }
        } catch (error) {
            console.error('Enhancement error:', error);
            showNotification({ 
                message: `Failed to process enhancement: ${error instanceof Error ? error.message : 'Unknown error'}`, 
                type: 'error' 
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const renderTemplateOptions = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Template</label>
                <div className="grid grid-cols-1 gap-3">
                    {CONTENT_TEMPLATES.map(template => (
                        <button
                            key={template.id}
                            onClick={() => setSelectedTemplate(template)}
                            className={`p-4 text-left rounded-lg border transition-colors ${
                                selectedTemplate.id === template.id
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : 'border-gray-600 hover:border-gray-500'
                            }`}
                        >
                            <h3 className="font-semibold text-white">{template.name}</h3>
                            <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                            <div className="mt-2">
                                <span className="text-xs text-indigo-400">
                                    {template.sections.length} sections • {template.tone}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Topic</label>
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter topic or title..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Keywords (comma-separated)</label>
                <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="keyword1, keyword2, keyword3..."
                />
            </div>
        </div>
    );

    const renderStyleOptions = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tone</label>
                    <select
                        value={styleOptions.tone}
                        onChange={(e) => setStyleOptions(prev => ({ ...prev, tone: e.target.value as WritingTone }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {Object.values(WritingTone).map(tone => (
                            <option key={tone} value={tone}>{tone}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Formality</label>
                    <select
                        value={styleOptions.formality}
                        onChange={(e) => setStyleOptions(prev => ({ ...prev, formality: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="very_casual">Very Casual</option>
                        <option value="casual">Casual</option>
                        <option value="neutral">Neutral</option>
                        <option value="formal">Formal</option>
                        <option value="very_formal">Very Formal</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Perspective</label>
                    <select
                        value={styleOptions.perspective}
                        onChange={(e) => setStyleOptions(prev => ({ ...prev, perspective: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="first_person">First Person</option>
                        <option value="second_person">Second Person</option>
                        <option value="third_person">Third Person</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Vocabulary</label>
                    <select
                        value={styleOptions.vocabulary}
                        onChange={(e) => setStyleOptions(prev => ({ ...prev, vocabulary: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="simple">Simple</option>
                        <option value="standard">Standard</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                <input
                    type="text"
                    value={styleOptions.targetAudience}
                    onChange={(e) => setStyleOptions(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., beginners, experts, general audience..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cultural Context (optional)</label>
                <input
                    type="text"
                    value={styleOptions.culturalContext || ''}
                    onChange={(e) => setStyleOptions(prev => ({ ...prev, culturalContext: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Western, Asian, Business casual..."
                />
            </div>
        </div>
    );

    const renderImageOptions = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Image Description (optional)</label>
                <textarea
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Describe the image you want to generate..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Style</label>
                    <select
                        value={imageOptions.style}
                        onChange={(e) => setImageOptions(prev => ({ ...prev, style: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="realistic">Realistic</option>
                        <option value="cartoon">Cartoon</option>
                        <option value="artistic">Artistic</option>
                        <option value="minimalist">Minimalist</option>
                        <option value="professional">Professional</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Size</label>
                    <select
                        value={imageOptions.size}
                        onChange={(e) => setImageOptions(prev => ({ ...prev, size: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="1024x1024">1024x1024 (Square)</option>
                        <option value="1792x1024">1792x1024 (Landscape)</option>
                        <option value="1024x1792">1024x1792 (Portrait)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quality</label>
                    <select
                        value={imageOptions.quality}
                        onChange={(e) => setImageOptions(prev => ({ ...prev, quality: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="standard">Standard</option>
                        <option value="hd">HD</option>
                    </select>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="promptEnhancement"
                        checked={imageOptions.promptEnhancement}
                        onChange={(e) => setImageOptions(prev => ({ ...prev, promptEnhancement: e.target.checked }))}
                        className="mr-2"
                    />
                    <label htmlFor="promptEnhancement" className="text-sm text-gray-300">
                        Enhance prompt automatically
                    </label>
                </div>
            </div>
        </div>
    );

    const renderSummaryOptions = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Length</label>
                    <select
                        value={summaryOptions.length}
                        onChange={(e) => setSummaryOptions(prev => ({ ...prev, length: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="very_short">Very Short</option>
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long</option>
                        <option value="detailed">Detailed</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
                    <select
                        value={summaryOptions.format}
                        onChange={(e) => setSummaryOptions(prev => ({ ...prev, format: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="paragraph">Paragraph</option>
                        <option value="bullets">Bullet Points</option>
                        <option value="numbered">Numbered List</option>
                        <option value="outline">Outline</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="includeKeywords"
                        checked={summaryOptions.includeKeywords}
                        onChange={(e) => setSummaryOptions(prev => ({ ...prev, includeKeywords: e.target.checked }))}
                        className="mr-2"
                    />
                    <label htmlFor="includeKeywords" className="text-sm text-gray-300">
                        Include keywords
                    </label>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="includeSummary"
                        checked={summaryOptions.includeSummary}
                        onChange={(e) => setSummaryOptions(prev => ({ ...prev, includeSummary: e.target.checked }))}
                        className="mr-2"
                    />
                    <label htmlFor="includeSummary" className="text-sm text-gray-300">
                        Include summary
                    </label>
                </div>
            </div>
        </div>
    );

    const renderGDPROptions = () => (
        <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="font-semibold text-white mb-2">GDPR Compliance Settings</h3>
                <p className="text-sm text-gray-400">
                    This will analyze your content for GDPR compliance and make necessary adjustments to ensure privacy regulation adherence.
                </p>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-300">Enable GDPR Compliance</label>
                        <p className="text-xs text-gray-500">Apply GDPR rules to content processing</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={gdprSettings.enabled}
                        onChange={(e) => setGdprSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="toggle"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-300">Anonymize Personal Data</label>
                        <p className="text-xs text-gray-500">Remove emails, phones, and personal info</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={gdprSettings.anonymizeData}
                        onChange={(e) => setGdprSettings(prev => ({ ...prev, anonymizeData: e.target.checked }))}
                        className="toggle"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-300">Data Retention Period</label>
                        <p className="text-xs text-gray-500">Days to keep generated content</p>
                    </div>
                    <select
                        value={gdprSettings.dataRetentionDays}
                        onChange={(e) => setGdprSettings(prev => ({ ...prev, dataRetentionDays: parseInt(e.target.value) }))}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    >
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="365">1 year</option>
                    </select>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-300">Require User Consent</label>
                        <p className="text-xs text-gray-500">Need explicit consent for data processing</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={gdprSettings.consentRequired}
                        onChange={(e) => setGdprSettings(prev => ({ ...prev, consentRequired: e.target.checked }))}
                        className="toggle"
                    />
                </div>
            </div>
        </div>
    );

    const renderResults = () => {
        if (!results) return null;

        switch (selectedEnhancement) {
            case 'image':
                return (
                    <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <h3 className="font-semibold text-white mb-3 flex items-center">
                            <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
                            Generated Images
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {results.images.map((image: string, index: number) => (
                                <div key={index} className="text-center">
                                    <img 
                                        src={image} 
                                        alt={`Generated image ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-600"
                                    />
                                    <p className="text-xs text-gray-400 mt-2">
                                        {results.imageOptions.style} • {results.imageOptions.size}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'summary':
                return (
                    <div className="mt-6 space-y-4">
                        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                            <h3 className="font-semibold text-white mb-2 flex items-center">
                                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
                                Summary
                            </h3>
                            <p className="text-gray-300">{results.summary}</p>
                        </div>
                        
                        {results.keywords.length > 0 && (
                            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                <h4 className="font-medium text-white mb-2">Keywords</h4>
                                <div className="flex flex-wrap gap-2">
                                    {results.keywords.map((keyword: string, index: number) => (
                                        <span key={index} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {results.keyPoints.length > 0 && (
                            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                <h4 className="font-medium text-white mb-2">Key Points</h4>
                                <ul className="space-y-1">
                                    {results.keyPoints.map((point: string, index: number) => (
                                        <li key={index} className="text-gray-300 text-sm flex items-start">
                                            <span className="text-indigo-400 mr-2">•</span>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                );

            case 'gdpr':
                return (
                    <div className="mt-6 space-y-4">
                        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                            <h3 className="font-semibold text-white mb-2 flex items-center">
                                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
                                Compliance Report
                            </h3>
                            <div className="text-gray-300 text-sm whitespace-pre-line">{results.complianceReport}</div>
                        </div>
                        
                        {results.issuesFound.length > 0 && (
                            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                                <h4 className="font-medium text-red-300 mb-2">Issues Found</h4>
                                <ul className="space-y-1">
                                    {results.issuesFound.map((issue: string, index: number) => (
                                        <li key={index} className="text-red-300 text-sm flex items-start">
                                            <span className="text-red-400 mr-2">•</span>
                                            {issue}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {results.recommendations.length > 0 && (
                            <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                                <h4 className="font-medium text-blue-300 mb-2">Recommendations</h4>
                                <ul className="space-y-1">
                                    {results.recommendations.map((rec: string, index: number) => (
                                        <li key={index} className="text-blue-300 text-sm flex items-start">
                                            <span className="text-blue-400 mr-2">•</span>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    const renderEnhancementContent = () => {
        switch (selectedEnhancement) {
            case 'template':
                return renderTemplateOptions();
            case 'style':
                return renderStyleOptions();
            case 'image':
                return renderImageOptions();
            case 'summary':
                return renderSummaryOptions();
            case 'paraphrase':
                return renderStyleOptions(); // Reuse style options for paraphrasing
            case 'gdpr':
                return renderGDPROptions();
            default:
                return null;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Content Enhancements">
            <div className="space-y-6">
                {/* Enhancement Type Selection */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Select Enhancement Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {enhancementTypes.map(type => (
                            <button
                                key={type.id}
                                onClick={() => setSelectedEnhancement(type.id)}
                                className={`p-4 text-left rounded-lg border transition-all ${
                                    selectedEnhancement === type.id
                                        ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20'
                                        : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                                }`}
                            >
                                <div className="flex items-center mb-2">
                                    <div className="text-indigo-400">
                                        {type.icon}
                                    </div>
                                </div>
                                <h4 className="font-semibold text-white">{type.name}</h4>
                                <p className="text-xs text-gray-400 mt-1">{type.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Enhancement Options */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        {enhancementTypes.find(t => t.id === selectedEnhancement)?.name} Options
                    </h3>
                    {renderEnhancementContent()}
                </div>

                {/* Results */}
                {renderResults()}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleEnhancement}
                        disabled={isProcessing}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isProcessing ? (
                            <>
                                <Spinner className="w-4 h-4 mr-2" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-4 h-4 mr-2" />
                                Apply Enhancement
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AIEnhancementModal;
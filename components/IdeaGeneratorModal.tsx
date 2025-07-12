import React, { useState, useEffect, useContext } from 'react';
import { WordPressSite, GeneratedIdea, LanguageContextType } from '../types';
import Modal from './common/Modal';
import Spinner from './common/Spinner';
import { fetchAllPostsFromAllSites } from '../services/wordpressService';
import { generateIdeasFromAnalytics } from '../services/geminiService';
import { LanguageContext } from '../App';
import { LightbulbIcon, SparklesIcon } from '../constants';

interface IdeaGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onIdeaSelect: (title: string) => void;
    sites: WordPressSite[];
}

const IdeaGeneratorModal: React.FC<IdeaGeneratorModalProps> = ({ isOpen, onClose, onIdeaSelect, sites }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
    const [loadingMessage, setLoadingMessage] = useState(t('analyzingPerformance'));

    useEffect(() => {
        if (isOpen) {
            const generate = async () => {
                setIsLoading(true);
                setError('');
                setIdeas([]);
                try {
                    // 1. Fetch all posts from all connected sites
                    setLoadingMessage(t('analyzingPerformance'));
                    const allPosts = await fetchAllPostsFromAllSites(sites);

                    if (allPosts.length < 3) {
                        setError(t('noDataForIdeas'));
                        setIsLoading(false);
                        return;
                    }

                    // 2. Identify top-performing posts (e.g., top 10 by views)
                    const topPosts = allPosts
                        .filter(p => p.performance_stats && p.performance_stats.views > 0)
                        .sort((a, b) => (b.performance_stats?.views ?? 0) - (a.performance_stats?.views ?? 0))
                        .slice(0, 10);
                    
                    if (topPosts.length < 3) {
                        setError(t('noDataForIdeas'));
                        setIsLoading(false);
                        return;
                    }

                    // 3. Generate ideas from analytics
                    setLoadingMessage(t('generatingIdeas'));
                    const generatedIdeas = await generateIdeasFromAnalytics(topPosts);
                    setIdeas(generatedIdeas);

                } catch (err) {
                    setError(err instanceof Error ? err.message : t('errorUnknown'));
                } finally {
                    setIsLoading(false);
                }
            };
            generate();
        }
    }, [isOpen, sites, t]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Spinner size="lg" />
                    <p className="mt-4 text-gray-300">{loadingMessage}</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
                    <p className="font-semibold">Error</p>
                    <p>{error}</p>
                </div>
            );
        }
        return (
            <div className="space-y-4">
                <p className="text-sm text-gray-400 text-center">{t('ideaGeneratorHint')}</p>
                {ideas.map((idea, index) => (
                    <div key={index} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600/50">
                        <h4 className="font-bold text-white text-lg flex items-center">
                            <LightbulbIcon />
                            <span className="ms-2">{idea.title}</span>
                        </h4>
                        <p className="text-xs text-gray-400 mt-1 mb-3 italic">
                           <span className="font-semibold">{t('ideaJustification')}</span> {idea.justification}
                        </p>
                        <button 
                            onClick={() => onIdeaSelect(idea.title)}
                            className="w-full btn-gradient text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                        >
                            <SparklesIcon />
                            <span className="ms-2">{t('startWritingThisArticle')}</span>
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Modal title={t('ideaGeneratorTitle')} onClose={onClose} size="xl">
            <div className="max-h-[70vh] overflow-y-auto p-1">
                {renderContent()}
            </div>
        </Modal>
    );
};

export default IdeaGeneratorModal;
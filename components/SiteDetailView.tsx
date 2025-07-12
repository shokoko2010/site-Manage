import React, { useState, useEffect, useContext, useMemo } from 'react';
import TurndownService from 'turndown';
import DOMPurify from 'dompurify';
import { WordPressSite, SitePost, LanguageContextType, ArticleContent, ContentType, Notification, Language } from '../types';
import { fetchAllPosts } from '../services/wordpressService';
import Spinner from './common/Spinner';
import { LanguageContext } from '../App';
import { EditIcon } from '../constants';

interface SiteDetailViewProps {
    site: WordPressSite;
    onEdit: (content: ArticleContent) => void;
    onBack: () => void;
    showNotification: (notification: Notification) => void;
}

type SortKey = 'title' | 'status' | 'date' | 'views' | 'comments';

const SortIndicator = ({ direction }: { direction: 'asc' | 'desc' | null }) => {
    if (!direction) return <span className="text-gray-500 ms-1 opacity-50">▲▼</span>;
    return <span className="ms-1">{direction === 'asc' ? '▲' : '▼'}</span>;
};


const SiteDetailView: React.FC<SiteDetailViewProps> = ({ site, onEdit, onBack, showNotification }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [posts, setPosts] = useState<SitePost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

    const turndownService = useMemo(() => new TurndownService({ headingStyle: 'atx' }), []);

    useEffect(() => {
        const loadPosts = async () => {
            setIsLoading(true);
            setError('');
            try {
                const fetchedPosts = await fetchAllPosts(site);
                setPosts(fetchedPosts);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : t('errorUnknown');
                setError(errorMessage);
                showNotification({ message: errorMessage, type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };

        loadPosts();
    }, [site, t, showNotification]);

    const sortedPosts = useMemo(() => {
        let sortablePosts = [...posts];
        if (sortConfig.key) {
            sortablePosts.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortConfig.key) {
                    case 'title':
                        aValue = a.title.rendered.toLowerCase();
                        bValue = b.title.rendered.toLowerCase();
                        break;
                    case 'views':
                        aValue = a.performance_stats?.views ?? -1;
                        bValue = b.performance_stats?.views ?? -1;
                        break;
                    case 'comments':
                        aValue = a.performance_stats?.comments ?? -1;
                        bValue = b.performance_stats?.comments ?? -1;
                        break;
                    default: // Handles 'status' and 'date'
                        aValue = a[sortConfig.key as keyof SitePost];
                        bValue = b[sortConfig.key as keyof SitePost];
                        break;
                }
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortablePosts;
    }, [posts, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const handleEditPost = (post: SitePost) => {
        // Sanitize HTML before converting to prevent any potential XSS from post content
        const sanitizedHtml = DOMPurify.sanitize(post.content.rendered);
        // Convert the post's HTML content to Markdown for the editor
        const markdown = turndownService.turndown(sanitizedHtml);

        const articleForEdit: ArticleContent = {
            id: `synced_${post.id}`,
            type: ContentType.Article,
            title: post.title.rendered,
            // Meta description isn't typically available, so we leave it blank for the AI to generate if needed.
            metaDescription: '', 
            body: markdown,
            status: 'draft', // internal status, not WP status
            createdAt: new Date(post.date),
            language: site.url.includes('.ar') ? Language.Arabic : Language.English, // Basic language detection
            siteId: site.id,
            postId: post.id,
            origin: 'synced',
        };
        onEdit(articleForEdit);
    };

    const SortableHeader = ({ sortKey, label }: { sortKey: SortKey, label: string }) => (
        <th 
            scope="col" 
            className="px-6 py-3 text-start text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600/50 transition-colors"
            onClick={() => requestSort(sortKey)}
        >
            <div className="flex items-center">
                {label}
                <SortIndicator direction={sortConfig.key === sortKey ? sortConfig.direction : null} />
            </div>
        </th>
    );

    return (
        <div className="p-8 h-full">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('siteDetailTitle')}</h1>
                    <p className="text-gray-400 mt-1">{t('siteDetailHint')} for <span className="font-semibold text-white">{site.name}</span></p>
                </div>
                <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-2 px-3 rounded-md transition-colors">
                    {t('backToDashboard')}
                </button>
            </header>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                 <div className="overflow-x-auto">
                    {isLoading ? (
                         <div className="flex justify-center items-center h-64">
                            <Spinner />
                            <p className="ms-4 text-gray-400">{t('fetchingPosts')}</p>
                         </div>
                    ) : error ? (
                        <div className="text-center py-16 text-red-400">{error}</div>
                    ) : posts.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700/50">
                                <tr>
                                    <SortableHeader sortKey="title" label={t('postTitle')} />
                                    <SortableHeader sortKey="status" label={t('postStatus')} />
                                    <SortableHeader sortKey="date" label={t('postDate')} />
                                    <SortableHeader sortKey="views" label={t('views')} />
                                    <SortableHeader sortKey="comments" label={t('comments')} />
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">{t('tableActions')}</span></th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-gray-700">
                                {sortedPosts.map(post => (
                                    <tr key={post.id} className="hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <a href={post.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white hover:text-blue-400 transition-colors max-w-xs block truncate">
                                                {post.title.rendered}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-200 capitalize">
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {new Date(post.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">
                                            {post.performance_stats?.views ?? <span className="text-gray-600">-</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">
                                            {post.performance_stats?.comments ?? <span className="text-gray-600">-</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                                            <button onClick={() => handleEditPost(post)} className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded-md inline-flex items-center font-semibold">
                                                <EditIcon />
                                                <span className="ms-1.5">{t('editAndImprove')}</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <div className="text-center py-16">
                            <p className="text-gray-400">{t('noPostsFound')}</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SiteDetailView;
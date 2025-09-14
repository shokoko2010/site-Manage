import React, { useState, useEffect, useMemo } from 'react';
import { GeneratedContent, ContentFilter, SearchResult, BulkOperation, ContentType } from '../types/types';
import { ContentManagementService } from '../services/contentManagementService';
import { useLanguage } from '../contexts/LanguageContext';
import { SettingsIcon, TagIcon, FolderIcon, CalendarIcon, UsersIcon, ClockIcon, TrashIcon, EyeIcon, EditIcon, FolderIcon as ArchiveIcon, PlusCircleIcon as PlusIcon } from '../lib/constants';

interface AdvancedContentManagerProps {
  contentLibrary: GeneratedContent[];
  onUpdateContent: (contentId: string, updates: Partial<GeneratedContent>) => void;
  onDeleteContent: (contentId: string) => void;
  onEditContent: (content: GeneratedContent) => void;
  sites: { id: string; name: string }[];
}

const AdvancedContentManager: React.FC<AdvancedContentManagerProps> = ({
  contentLibrary,
  onUpdateContent,
  onDeleteContent,
  onEditContent,
  sites
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<ContentFilter>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [filteredContent, setFilteredContent] = useState<GeneratedContent[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Get all available options for filters
  const filterOptions = useMemo(() => ({
    categories: ContentManagementService.getAllCategories(contentLibrary),
    tags: ContentManagementService.getAllTags(contentLibrary),
    authors: ContentManagementService.getAllAuthors(contentLibrary),
    sites: sites
  }), [contentLibrary, sites]);

  // Apply filters and search
  useEffect(() => {
    let result = contentLibrary;

    // Apply search if query exists
    if (searchQuery.trim()) {
      const searchResult = ContentManagementService.searchContent(result, searchQuery);
      setSearchResults(searchResult);
      result = searchResult.map(sr => sr.content);
    } else {
      setSearchResults([]);
    }

    // Apply filters
    if (Object.keys(activeFilter).length > 0) {
      result = ContentManagementService.filterContent(result, activeFilter);
    }

    setFilteredContent(result);
  }, [contentLibrary, searchQuery, activeFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedContent(filteredContent.map(c => c.id));
    } else {
      setSelectedContent([]);
    }
  };

  const handleSelectContent = (contentId: string) => {
    setSelectedContent(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const handleBulkOperation = (operation: BulkOperation['type'], data?: any) => {
    if (selectedContent.length === 0) return;

    const bulkOp: BulkOperation = {
      type: operation,
      contentIds: selectedContent,
      data
    };

    const updatedContent = ContentManagementService.executeBulkOperation(contentLibrary, bulkOp);

    // Update the content library
    updatedContent.forEach(content => {
      onUpdateContent(content.id, content);
    });

    // Clear selection
    setSelectedContent([]);
    setShowBulkActions(false);
  };

  const handleAddCategories = (categories: string[]) => {
    selectedContent.forEach(contentId => {
      const content = contentLibrary.find(c => c.id === contentId);
      if (content) {
        const updated = ContentManagementService.addCategories(content, categories);
        onUpdateContent(contentId, updated);
      }
    });
    setSelectedContent([]);
  };

  const handleAddTags = (tags: string[]) => {
    selectedContent.forEach(contentId => {
      const content = contentLibrary.find(c => c.id === contentId);
      if (content) {
        const updated = ContentManagementService.addTags(content, tags);
        onUpdateContent(contentId, updated);
      }
    });
    setSelectedContent([]);
  };

  const clearFilters = () => {
    setActiveFilter({});
    setSearchQuery('');
  };

  const hasActiveFilters = Object.keys(activeFilter).length > 0 || searchQuery.trim() !== '';

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">{t('advancedContentManagement')}</h1>
        <p className="text-gray-400">{t('advancedContentManagementHint')}</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5">
            <SettingsIcon />
          </div>
          <input
            type="text"
            placeholder={t('searchContent')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="w-4 h-4 mr-2 inline-block">
                <TagIcon />
              </span>
              {t('filters')}
              {hasActiveFilters && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {Object.keys(activeFilter).length + (searchQuery ? 1 : 0)}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <span className="w-4 h-4 mr-2 inline-block">
                  <TrashIcon />
                </span>
                {t('clearFilters')}
              </button>
            )}
          </div>

          <div className="text-sm text-gray-400">
            {t('showing')} {filteredContent.length} {t('of')} {contentLibrary.length} {t('items')}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('status')}</label>
                <select
                  multiple
                  value={activeFilter.status || []}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value as any);
                    setActiveFilter(prev => ({ ...prev, status: values.length > 0 ? values : undefined }));
                  }}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="draft">{t('draft')}</option>
                  <option value="published">{t('published')}</option>
                  <option value="scheduled">{t('scheduled')}</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('contentType')}</label>
                <select
                  multiple
                  value={activeFilter.type || []}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value as ContentType);
                    setActiveFilter(prev => ({ ...prev, type: values.length > 0 ? values : undefined }));
                  }}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ARTICLE">{t('article')}</option>
                  <option value="PRODUCT">{t('product')}</option>
                </select>
              </div>

              {/* Site Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('site')}</label>
                <select
                  value={activeFilter.siteId || ''}
                  onChange={(e) => {
                    setActiveFilter(prev => ({ 
                      ...prev, 
                      siteId: e.target.value ? e.target.value : undefined 
                    }));
                  }}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t('allSites')}</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              {/* Categories Filter */}
              {filterOptions.categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('categories')}</label>
                  <select
                    multiple
                    value={activeFilter.categories || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setActiveFilter(prev => ({ ...prev, categories: values.length > 0 ? values : undefined }));
                    }}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {filterOptions.categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tags Filter */}
              {filterOptions.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('tags')}</label>
                  <select
                    multiple
                    value={activeFilter.tags || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setActiveFilter(prev => ({ ...prev, tags: values.length > 0 ? values : undefined }));
                    }}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {filterOptions.tags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Author Filter */}
              {filterOptions.authors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('author')}</label>
                  <select
                    value={activeFilter.author || ''}
                    onChange={(e) => {
                      setActiveFilter(prev => ({ 
                        ...prev, 
                        author: e.target.value ? e.target.value : undefined 
                      }));
                    }}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t('allAuthors')}</option>
                    {filterOptions.authors.map(author => (
                      <option key={author} value={author}>{author}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedContent.length > 0 && (
        <div className="bg-indigo-900/20 border border-indigo-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-white font-medium">
                {selectedContent.length} {t('itemsSelected')}
              </span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkOperation('publish')}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  {t('publish')}
                </button>
                <button
                  onClick={() => handleBulkOperation('unpublish')}
                  className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  {t('unpublish')}
                </button>
                <button
                  onClick={() => handleBulkOperation('delete')}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  {t('delete')}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder={t('addCategories')}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const categories = e.currentTarget.value.split(',').map(c => c.trim()).filter(c => c);
                    if (categories.length > 0) {
                      handleAddCategories(categories);
                      e.currentTarget.value = '';
                    }
                  }
                }}
                className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder={t('addTags')}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const tags = e.currentTarget.value.split(',').map(t => t.trim()).filter(t => t);
                    if (tags.length > 0) {
                      handleAddTags(tags);
                      e.currentTarget.value = '';
                    }
                  }
                }}
                className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedContent.length === filteredContent.length && filteredContent.length > 0}
              onChange={handleSelectAll}
              className="mr-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-gray-300">
              <div className="col-span-4">{t('title')}</div>
              <div className="col-span-2">{t('type')}</div>
              <div className="col-span-2">{t('status')}</div>
              <div className="col-span-2">{t('modified')}</div>
              <div className="col-span-2">{t('actions')}</div>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-700">
          {filteredContent.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">{t('noContentFound')}</p>
            </div>
          ) : (
            filteredContent.map(content => (
              <div key={content.id} className="px-4 py-3 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedContent.includes(content.id)}
                    onChange={() => handleSelectContent(content.id)}
                    className="mr-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <div className="text-white font-medium">{content.title}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        <span className="flex items-center mr-3">
                          {content.type}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        content.type === 'ARTICLE' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-purple-600 text-white'
                      }`}>
                        {content.type === 'ARTICLE' ? t('article') : t('product')}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        content.status === 'PUBLISHED' 
                          ? 'bg-green-600 text-white'
                          : content.scheduledFor
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-600 text-white'
                      }`}>
                        {content.status === 'PUBLISHED' ? t('published') : 
                         content.scheduledFor ? t('scheduled') : t('draft')}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-gray-400">
                      {content.updatedAt 
                        ? new Date(content.updatedAt).toLocaleDateString()
                        : new Date(content.createdAt).toLocaleDateString()
                      }
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEditContent(content)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title={t('edit')}
                        >
                          <span className="w-4 h-4 inline-block">
                            <EditIcon />
                          </span>
                        </button>
                        <button
                          onClick={() => onDeleteContent(content.id)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          title={t('delete')}
                        >
                          <span className="w-4 h-4 inline-block">
                            <TrashIcon />
                          </span>
                        </button>
                        {content.postLink && (
                          <a
                            href={content.postLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                            title={t('view')}
                          >
                            <span className="w-4 h-4 inline-block">
                              <EyeIcon />
                            </span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedContentManager;
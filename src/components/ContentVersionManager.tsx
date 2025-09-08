import React, { useState, useEffect } from 'react';
import { GeneratedContent, ContentVersion } from '../types/types';
import { ContentManagementService } from '../services/contentManagementService';
import { useLanguage } from '../contexts/LanguageContext';
import { ClockIcon, UsersIcon, DocumentTextIcon, ArrowPathIcon, EyeIcon, TrashIcon, PlusCircleIcon } from '../lib/constants';

interface ContentVersionManagerProps {
  content: GeneratedContent;
  onRestoreVersion: (content: GeneratedContent) => void;
  onUpdateContent: (contentId: string, updates: Partial<GeneratedContent>) => void;
}

const ContentVersionManager: React.FC<ContentVersionManagerProps> = ({
  content,
  onRestoreVersion,
  onUpdateContent
}) => {
  const { t } = useLanguage();
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [newVersionNote, setNewVersionNote] = useState('');

  useEffect(() => {
    // Load versions from localStorage or initialize
    const savedVersions = localStorage.getItem(`versions_${content.id}`);
    if (savedVersions) {
      setVersions(JSON.parse(savedVersions));
    } else if (content.versions) {
      setVersions(content.versions);
    }
  }, [content.id]);

  const createNewVersion = () => {
    if (!newVersionNote.trim()) return;

    const newVersion = ContentManagementService.createVersion(content, newVersionNote);
    const updatedVersions = [...versions, newVersion];
    
    setVersions(updatedVersions);
    localStorage.setItem(`versions_${content.id}`, JSON.stringify(updatedVersions));
    
    // Update content with new version info
    onUpdateContent(content.id, {
      version: newVersion.version,
      lastModified: new Date(),
      versions: updatedVersions
    });

    setNewVersionNote('');
  };

  const restoreVersion = (version: ContentVersion) => {
    const restoredContent = ContentManagementService.restoreVersion(content, version);
    onRestoreVersion(restoredContent);
  };

  const deleteVersion = (versionId: string) => {
    const updatedVersions = versions.filter(v => v.id !== versionId);
    setVersions(updatedVersions);
    localStorage.setItem(`versions_${content.id}`, JSON.stringify(updatedVersions));
    
    // Update content
    onUpdateContent(content.id, {
      versions: updatedVersions
    });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const compareVersions = (version1: ContentVersion, version2: ContentVersion) => {
    const differences = [];
    
    if (version1.title !== version2.title) {
      differences.push({
        field: 'title',
        oldValue: version1.title,
        newValue: version2.title
      });
    }
    
    if (version1.body !== version2.body) {
      differences.push({
        field: 'body',
        oldValue: version1.body,
        newValue: version2.body
      });
    }
    
    if (version1.metaDescription !== version2.metaDescription) {
      differences.push({
        field: 'metaDescription',
        oldValue: version1.metaDescription || '',
        newValue: version2.metaDescription || ''
      });
    }
    
    return differences;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <ClockIcon className="w-5 h-5 mr-2" />
          {t('versionHistory')}
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder={t('versionNote')}
              value={newVersionNote}
              onChange={(e) => setNewVersionNote(e.target.value)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button
              onClick={createNewVersion}
              disabled={!newVersionNote.trim()}
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
            >
              <PlusCircleIcon className="w-4 h-4 mr-1" />
              {t('saveVersion')}
            </button>
          </div>
        </div>
      </div>

      {/* Current Version Info */}
      <div className="bg-gray-900 rounded-lg p-4 mb-6 border-2 border-indigo-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{t('currentVersion')}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span className="flex items-center">
                <UserIcon className="w-4 h-4 mr-1" />
                {content.author || t('unknown')}
              </span>
              <span className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                {formatDate(content.lastModified || content.createdAt)}
              </span>
              <span className="flex items-center">
                <DocumentTextIcon className="w-4 h-4 mr-1" />
                {t('version')} {content.version || 1}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">
              {ContentManagementService.calculateWordCount(content)} {t('words')}
            </div>
            <div className="text-sm text-gray-400">
              {content.seoScore || 0}/100 {t('seoScore')}
            </div>
          </div>
        </div>
      </div>

      {/* Version History */}
      <div className="space-y-4">
        {versions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('noVersionsAvailable')}</p>
          </div>
        ) : (
          versions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((version, index) => (
              <div key={version.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h4 className="font-semibold text-white">
                        {t('version')} {version.version}
                      </h4>
                      <span className="text-sm text-gray-400">
                        {formatDate(version.createdAt)}
                      </span>
                      <span className="text-sm text-gray-400">
                        {t('by')} {version.author}
                      </span>
                      {version.isCurrent && (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                          {t('current')}
                        </span>
                      )}
                    </div>
                    
                    {version.changeLog && (
                      <p className="text-sm text-gray-300 mb-2">
                        <strong>{t('changes')}:</strong> {version.changeLog}
                      </p>
                    )}
                    
                    <div className="text-sm text-gray-400">
                      {ContentManagementService.calculateWordCount({ ...content, title: version.title, body: version.body })} {t('words')}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedVersion(version)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title={t('viewDetails')}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    
                    {!version.isCurrent && (
                      <button
                        onClick={() => restoreVersion(version)}
                        className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                        title={t('restoreVersion')}
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                      </button>
                    )}
                    
                    {!version.isCurrent && (
                      <button
                        onClick={() => deleteVersion(version.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title={t('deleteVersion')}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Version Detail Modal */}
      {selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {t('version')} {selectedVersion.version} {t('details')}
                </h3>
                <button
                  onClick={() => setSelectedVersion(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">{t('title')}</h4>
                  <p className="text-gray-300">{selectedVersion.title}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">{t('content')}</h4>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-gray-300 whitespace-pre-wrap font-sans">
                      {selectedVersion.body}
                    </pre>
                  </div>
                </div>

                {selectedVersion.metaDescription && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">{t('metaDescription')}</h4>
                    <p className="text-gray-300">{selectedVersion.metaDescription}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">{t('author')}:</span>
                    <span className="text-white ml-2">{selectedVersion.author}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('created')}:</span>
                    <span className="text-white ml-2">{formatDate(selectedVersion.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('wordCount')}:</span>
                    <span className="text-white ml-2">
                      {ContentManagementService.calculateWordCount({ ...content, title: selectedVersion.title, body: selectedVersion.body })}
                    </span>
                  </div>
                </div>

                {selectedVersion.changeLog && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">{t('changeLog')}</h4>
                    <p className="text-gray-300">{selectedVersion.changeLog}</p>
                  </div>
                )}

                {/* Comparison with current version */}
                {versions.length > 0 && !selectedVersion.isCurrent && (
                  <div>
                    <button
                      onClick={() => setShowComparison(!showComparison)}
                      className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      {showComparison ? t('hideComparison') : t('showComparison')}
                    </button>
                    
                    {showComparison && (
                      <div className="bg-gray-900 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-4">{t('comparisonWithCurrent')}</h4>
                        {(() => {
                          const currentVersion = {
                            title: content.title,
                            body: content.body,
                            metaDescription: content.metaDescription || ''
                          };
                          const differences = compareVersions(selectedVersion, currentVersion);
                          
                          if (differences.length === 0) {
                            return <p className="text-gray-400">{t('noDifferences')}</p>;
                          }
                          
                          return differences.map((diff, index) => (
                            <div key={index} className="mb-4">
                              <h5 className="text-white font-medium mb-2 capitalize">{diff.field}</h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm text-gray-400">{t('oldVersion')}</label>
                                  <div className="bg-red-900/20 border border-red-700 rounded p-2 text-red-300 text-sm">
                                    {diff.oldValue.length > 100 ? diff.oldValue.substring(0, 100) + '...' : diff.oldValue}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm text-gray-400">{t('currentVersion')}</label>
                                  <div className="bg-green-900/20 border border-green-700 rounded p-2 text-green-300 text-sm">
                                    {diff.newValue.length > 100 ? diff.newValue.substring(0, 100) + '...' : diff.newValue}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!selectedVersion.isCurrent && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setSelectedVersion(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    {t('close')}
                  </button>
                  <button
                    onClick={() => {
                      restoreVersion(selectedVersion);
                      setSelectedVersion(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    {t('restoreThisVersion')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentVersionManager;
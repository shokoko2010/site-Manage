import React, { useContext } from 'react';
import { WordPressSite, LanguageContextType } from '../types';
import { GlobeIcon, TrashIcon } from '../constants';
import { LanguageContext } from '../App';

interface SiteCardProps {
  site: WordPressSite;
  onRemove: (siteId: string) => void;
}

const SiteCard: React.FC<SiteCardProps> = ({ site, onRemove }) => {
  const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col justify-between transition-transform transform hover:-translate-y-1 relative">
      <div>
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-white mb-1 pr-16">{site.name}</h3>
            <button onClick={() => onRemove(site.id)} className="text-gray-500 hover:text-red-400 transition-colors absolute top-5 right-5">
                <TrashIcon />
            </button>
        </div>
        {site.isVirtual && (
            <span className="absolute top-4 right-14 text-xs bg-purple-600 text-white font-semibold py-1 px-2 rounded">{t('virtualSite')}</span>
        )}
        <a href={site.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors mb-4">
          <GlobeIcon />
          <span className="ms-2 truncate">{site.url}</span>
        </a>
        
        {site.isVirtual ? (
            <div className="text-center text-sm mt-4 py-8 border-t border-b border-gray-700">
                <p className="text-gray-400">{t('virtualSiteInfo')}</p>
            </div>
        ) : (
            <div className="grid grid-cols-3 gap-2 text-center text-sm mt-4">
              <div>
                <p className="font-bold text-lg text-white">{site.stats.posts}</p>
                <p className="text-gray-400">{t('article')+'s'}</p>
              </div>
              <div>
                <p className="font-bold text-lg text-white">{site.stats.pages}</p>
                <p className="text-gray-400">Pages</p>
              </div>
              <div>
                <p className="font-bold text-lg text-white">{site.stats.products}</p>
                <p className="text-gray-400">{t('product')+'s'}</p>
              </div>
            </div>
        )}
      </div>
      <div className="mt-6 text-end">
        {!site.isVirtual && (
            <button className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-2 px-3 rounded-md transition-colors">
                {t('manageSite')}
            </button>
        )}
      </div>
    </div>
  );
};

export default SiteCard;
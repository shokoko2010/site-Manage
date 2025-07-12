import React, { useContext } from 'react';
import { WordPressSite, LanguageContextType } from '../types';
import { GlobeIcon, TrashIcon, ArticleIcon, ProductIcon, DocumentTextIcon, ChevronRightIcon } from '../constants';
import { LanguageContext } from '../App';

interface SiteCardProps {
  site: WordPressSite;
  onRemove: (siteId: string) => void;
  onManage: (site: WordPressSite) => void;
}

const StatItem = ({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => (
    <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
        <div className="text-gray-400">{icon}</div>
        <div>
            <p className="font-bold text-base text-white">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
        </div>
    </div>
);

const SiteCard: React.FC<SiteCardProps> = ({ site, onRemove, onManage }) => {
  const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-5 flex flex-col justify-between border border-gray-700/50 transition-all duration-300 hover:border-indigo-500/50 hover:shadow-indigo-500/10">
      <div>
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-white pr-8">{site.name}</h3>
            {site.isVirtual && (
                <span className="text-xs bg-purple-600/50 text-purple-300 border border-purple-500/50 font-semibold py-1 px-2 rounded-full">{t('virtualSite')}</span>
            )}
        </div>
        <a href={site.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-sky-400 hover:text-sky-300 transition-colors mb-4 group">
          <GlobeIcon />
          <span className="ms-2 truncate group-hover:underline">{site.url}</span>
        </a>
        
        {site.isVirtual ? (
            <div className="text-center text-sm mt-4 py-8 border-t border-b border-gray-700">
                <p className="text-gray-400">{t('virtualSiteInfo')}</p>
            </div>
        ) : (
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-700">
              <StatItem icon={<ArticleIcon/>} value={site.stats.posts} label={t('article')+'s'} />
              <StatItem icon={<DocumentTextIcon/>} value={site.stats.pages} label={'Pages'} />
              <StatItem icon={<ProductIcon/>} value={site.stats.products} label={t('product')+'s'} />
            </div>
        )}
      </div>
      <div className="mt-6 flex items-center justify-between">
         <button onClick={() => onRemove(site.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1">
            <TrashIcon />
        </button>
        {!site.isVirtual && (
            <button onClick={() => onManage(site)} className="btn-gradient text-white text-xs font-semibold py-2 px-4 rounded-lg transition-transform hover:scale-105 flex items-center">
                {t('manageSite')}
                <ChevronRightIcon />
            </button>
        )}
      </div>
    </div>
  );
};

export default SiteCard;
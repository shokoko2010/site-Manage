import React, { memo, useCallback } from 'react';
import { WordPressSite } from '@/types/types';
import { GlobeIcon, TrashIcon, ArticleIcon, ProductIcon, DocumentTextIcon, ChevronRightIcon } from '@/lib/constants';
import { useLanguage } from '../contexts/LanguageContext';
import { ResponsiveCard, ResponsiveButton, ResponsiveText } from '@/components/ResponsiveComponents';

interface SiteCardProps {
  site: WordPressSite;
  onRemove: (siteId: string) => void;
  onManage: (site: WordPressSite) => void;
}

const StatItem = memo(({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => (
    <div className="flex items-center space-x-2 text-sm">
        <div className="text-muted-foreground">{icon}</div>
        <div>
            <p className="font-bold text-base text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    </div>
));

StatItem.displayName = 'StatItem';

const SiteCard: React.FC<SiteCardProps> = ({ site, onRemove, onManage }) => {
  const { t } = useLanguage();

  const handleRemove = useCallback(() => {
    onRemove(site.id);
  }, [onRemove, site.id]);

  const handleManage = useCallback(() => {
    onManage(site);
  }, [onManage, site]);

  return (
    <ResponsiveCard variant="base" className="hover:shadow-lg transition-all duration-300">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <ResponsiveText variant="h4" className="pr-8 truncate">
            {site.name}
          </ResponsiveText>
          {site.isVirtual && (
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 font-semibold py-1 px-2 rounded-full">
              {t('virtualSite')}
            </span>
          )}
        </div>
        
        <a 
          href={site.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center text-sm text-primary hover:text-primary/80 transition-colors group"
        >
          <GlobeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate group-hover:underline">{site.url}</span>
        </a>
        
        {site.isVirtual ? (
            <div className="text-center text-sm py-6 border-y border-border">
                <p className="text-muted-foreground">{t('virtualSiteInfo')}</p>
            </div>
        ) : (
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
              <StatItem icon={<ArticleIcon className="h-4 w-4"/>} value={site.stats?.posts || 0} label={t('article')+'s'} />
              <StatItem icon={<DocumentTextIcon className="h-4 w-4"/>} value={site.stats?.pages || 0} label={'Pages'} />
              <StatItem icon={<ProductIcon className="h-4 w-4"/>} value={site.stats?.products || 0} label={t('product')+'s'} />
            </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-6">
        <button 
          onClick={handleRemove} 
          className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
          aria-label="Remove site"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
        {!site.isVirtual && (
            <ResponsiveButton
              variant="primary"
              size="sm"
              onClick={handleManage}
              icon={<ChevronRightIcon className="h-4 w-4" />}
              iconPosition="right"
            >
                {t('manageSite')}
            </ResponsiveButton>
        )}
      </div>
    </ResponsiveCard>
  );
};

export default memo(SiteCard);
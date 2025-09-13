import React from 'react';
import SiteCard from '../SiteCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import { WordPressSite } from '@/types/types';

interface MySitesProps {
  sites: WordPressSite[];
  isLoading: boolean;
  onRemoveSite: (siteId: string) => void;
  onManageSite: (siteId: string) => void;
}

const MySites: React.FC<MySitesProps> = ({ 
  sites, 
  isLoading, 
  onRemoveSite, 
  onManageSite 
}) => {
  if (isLoading) {
    return (
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">My Sites</h2>
        <div className="flex justify-center items-center h-48 modern-card">
          <LoadingSpinner size="lg" />
        </div>
      </section>
    );
  }

  if (sites.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4">My Sites</h2>
        <div className="text-center py-16 modern-card border-2 border-dashed border-border">
          <h3 className="text-foreground font-semibold">No sites yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Add your first WordPress site to get started</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4">My Sites</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sites.map(site => (
          <SiteCard 
            key={site.id} 
            site={site} 
            onRemove={onRemoveSite} 
            onManage={onManageSite} 
          />
        ))}
      </div>
    </section>
  );
};

export default MySites;
import React from 'react';
import QuickActionButton from './QuickActionButton';
import { ArticleIcon, ProductIcon, CampaignIcon } from '@/lib/constants';
import { ContentType } from '@/types/types';

interface QuickActionsProps {
  onNavigateToNewContent: (type: ContentType, title?: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onNavigateToNewContent }) => {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickActionButton 
          title="Article" 
          icon={<ArticleIcon />} 
          onClick={() => onNavigateToNewContent(ContentType.Article)} 
        />
        <QuickActionButton 
          title="Product" 
          icon={<ProductIcon />} 
          onClick={() => onNavigateToNewContent(ContentType.Product)} 
        />
        <QuickActionButton 
          title="Campaign" 
          icon={<CampaignIcon />} 
          onClick={() => onNavigateToNewContent(ContentType.Campaign)} 
        />
      </div>
    </section>
  );
};

export default QuickActions;
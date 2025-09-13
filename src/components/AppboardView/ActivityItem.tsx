import React from 'react';
import { GeneratedContent, ContentType } from '@/types/types';
import { ArticleIcon, ProductIcon, ClockIcon } from '@/lib/constants';

interface ActivityItemProps {
  item: GeneratedContent;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ item }) => {
  return (
    <div className="flex items-center space-x-4 rtl:space-x-reverse p-3 hover:bg-accent/5 rounded-lg transition-colors">
      <div className="flex-shrink-0 bg-muted p-2 rounded-lg">
        {item.type === ContentType.Article ? <ArticleIcon /> : <ProductIcon />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground flex items-center">
          <ClockIcon className="w-4 h-4" />
          <span className="ms-1">{new Date(item.createdAt).toLocaleDateString()}</span>
        </p>
      </div>
    </div>
  );
};

export default ActivityItem;
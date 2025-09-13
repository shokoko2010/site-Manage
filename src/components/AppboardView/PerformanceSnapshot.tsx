import React from 'react';
import { EyeIcon, ChatBubbleLeftIcon, ArrowUpRightIcon } from '@/lib/constants';
import { ArticleContent } from '@/types/types';

interface PerformanceSnapshotProps {
  topPerformingPost?: ArticleContent;
  onAnalyzeClick: () => void;
}

const PerformanceSnapshot: React.FC<PerformanceSnapshotProps> = ({ 
  topPerformingPost, 
  onAnalyzeClick 
}) => {
  if (!topPerformingPost) {
    return null;
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4">Performance Snapshot</h2>
      <div className="modern-card p-5">
        <h3 className="font-semibold text-primary mb-2">Top Performing Article</h3>
        <p className="text-foreground font-bold text-lg mb-3">{topPerformingPost.title}</p>
        <div className="flex justify-around text-center text-sm mb-4 border-y border-border py-3">
          <div className="text-foreground flex items-center">
            <EyeIcon/> 
            <span className="ms-2">{ (topPerformingPost as any).performance_stats?.views || 0 } Views</span>
          </div>
          <div className="text-foreground flex items-center">
            <ChatBubbleLeftIcon/> 
            <span className="ms-2">{ (topPerformingPost as any).performance_stats?.comments || 0 } Comments</span>
          </div>
        </div>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <a 
            href={(topPerformingPost as any).link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex-1 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-2 px-3 rounded-xl transition-colors flex items-center justify-center"
          >
            View Article <ArrowUpRightIcon className="ms-1 h-4 w-4" />
          </a>
          <button 
            onClick={onAnalyzeClick}
            className="flex-1 text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-3 rounded-xl transition-colors flex items-center justify-center"
          >
            Analyze & Generate
          </button>
        </div>
      </div>
    </section>
  );
};

export default PerformanceSnapshot;
import React from 'react';
import ActivityItem from './ActivityItem';
import { GeneratedContent } from '@/types/types';

interface RecentActivityProps {
  recentActivity: GeneratedContent[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ recentActivity }) => {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
      <div className="modern-card p-3">
        <div className="space-y-1">
          {recentActivity.length > 0 ? (
            recentActivity.map(item => <ActivityItem key={item.id} item={item} />)
          ) : (
            <p className="text-center text-sm text-muted-foreground p-4">No recent activity</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default RecentActivity;
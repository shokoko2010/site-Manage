import React from 'react';
import StatCard from './StatCard';
import { GlobeIcon, ChartPieIcon, LibraryIcon } from '@/lib/constants';

interface StatsOverviewProps {
  totalSites: number;
  contentLast30Days: number;
  totalLibraryItems: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ 
  totalSites, 
  contentLast30Days, 
  totalLibraryItems 
}) => {
  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatCard icon={<GlobeIcon />} value={totalSites} label="Total Sites" />
        <StatCard icon={<ChartPieIcon />} value={contentLast30Days} label="Content (30 Days)" />
        <StatCard icon={<LibraryIcon />} value={totalLibraryItems} label="Total Library Items" />
      </div>
    </section>
  );
};

export default StatsOverview;
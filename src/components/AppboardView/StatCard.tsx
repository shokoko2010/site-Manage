import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label }) => {
  return (
    <div className="modern-card p-6 flex items-center space-x-4 rtl:space-x-reverse transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-accent/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
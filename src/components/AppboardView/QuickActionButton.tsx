import React from 'react';

interface QuickActionButtonProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ title, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-4 modern-card hover:bg-accent/50 hover:-translate-y-1 transition-all flex flex-col items-center justify-center text-center w-full group"
    >
      <div className="mb-2 p-3 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 text-primary group-hover:from-primary/20 group-hover:to-accent/20 transition-all">
        {icon}
      </div>
      <span className="font-semibold text-foreground">{title}</span>
    </button>
  );
};

export default QuickActionButton;
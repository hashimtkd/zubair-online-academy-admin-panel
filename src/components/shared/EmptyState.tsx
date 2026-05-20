import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-900/10">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 mb-4">
        {icon || <Search className="w-6 h-6" />}
      </div>
      
      <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 mb-1">
        {title}
      </h3>
      
      <p className="text-sm text-slate-400 dark:text-slate-550 max-w-xs mb-5 leading-normal">
        {description}
      </p>
      
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
export default EmptyState;

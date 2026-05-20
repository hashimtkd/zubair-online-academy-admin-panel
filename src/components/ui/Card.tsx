import React from 'react';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 shadow-sm p-5 md:p-6 transition-all duration-300 ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between gap-4 mb-6 border-b border-slate-50 dark:border-slate-800/40 pb-4">
          <div className="flex flex-col gap-1">
            {title && typeof title === 'string' ? (
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            ) : (
              title
            )}
            
            {subtitle && typeof subtitle === 'string' ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {subtitle}
              </p>
            ) : (
              subtitle
            )}
          </div>
          
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      
      <div>{children}</div>
    </div>
  );
};
export default Card;

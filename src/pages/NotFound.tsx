import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 gap-6">
      <div className="w-16 h-16 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center animate-bounce">
        <HelpCircle className="w-8 h-8" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">404 - Page Not Found</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
          The dashboard route you requested does not exist or you do not have permission to view it.
        </p>
      </div>

      <Link to="/" className="mt-2">
        <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};
export default NotFound;

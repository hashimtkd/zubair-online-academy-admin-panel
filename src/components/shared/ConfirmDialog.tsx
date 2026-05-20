import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title={
      <div className="flex items-center gap-2">
        {variant === 'danger' && <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />}
        {variant === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />}
        {variant === 'primary' && <HelpCircle className="w-5 h-5 text-green-500 shrink-0" />}
        <span className="font-bold text-base text-slate-900 dark:text-slate-100">{title}</span>
      </div>
    }>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
        
        <div className="flex items-center justify-end gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onClose} 
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
export default ConfirmDialog;

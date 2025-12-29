'use client';

import { ReactNode } from 'react';
import Icon, { faExclamationTriangle, faInfoCircle, faSpinner } from './Icon';
import Button from './Button';
import Modal from './Modal';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  disabled?: boolean;
  warningMessage?: string | ReactNode;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  disabled = false,
  warningMessage,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    if (!loading && !disabled) {
      onConfirm();
    }
  };

  const iconMap = {
    danger: faExclamationTriangle,
    warning: faExclamationTriangle,
    info: faInfoCircle,
  };

  const iconColorMap = {
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  const confirmButtonClassMap = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={true}
    >
      <div className="space-y-3">
        {/* Icon and Title */}
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${iconColorMap[variant]}`}>
            <Icon icon={iconMap[variant]} size="md" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
            <div className="text-sm text-gray-600">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          </div>
        </div>

        {/* Warning Message */}
        {warningMessage && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-sm">
            {typeof warningMessage === 'string' ? (
              <p className="text-sm text-yellow-800">{warningMessage}</p>
            ) : (
              warningMessage
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
            disabled={loading}
          >
            {cancelText}
          </Button>
          <button
            onClick={handleConfirm}
            disabled={loading || disabled}
            className={`btn btn-primary btn-sm ${confirmButtonClassMap[variant]} disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <Icon icon={faSpinner} spin />
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}


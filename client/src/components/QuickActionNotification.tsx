import React, { useState } from 'react';
import { AlertCircle, CheckCircle, FileText, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface QuickActionNotificationProps {
  type: 'missing_documents' | 'payment_pending' | 'document_verified' | 'bilan_ready' | 'action_required';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
  isOpen?: boolean;
}

export function QuickActionNotification({
  type,
  title,
  message,
  actionLabel = 'Agir maintenant',
  onAction,
  onDismiss,
  dismissible = true,
  isOpen = true,
}: QuickActionNotificationProps) {
  const [open, setOpen] = useState(isOpen);

  const getIcon = () => {
    switch (type) {
      case 'missing_documents':
        return <FileText className="w-5 h-5 text-orange-600" />;
      case 'payment_pending':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'document_verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'bilan_ready':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'action_required':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'missing_documents':
        return 'bg-orange-50 border-orange-200';
      case 'payment_pending':
        return 'bg-red-50 border-red-200';
      case 'document_verified':
        return 'bg-green-50 border-green-200';
      case 'bilan_ready':
        return 'bg-blue-50 border-blue-200';
      case 'action_required':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
  };

  const handleDismiss = () => {
    setOpen(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!open) return null;

  return (
    <div className={`border rounded-lg p-4 mb-4 flex items-start gap-3 ${getStyles()}`}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm mb-1">{title}</h3>
        <p className="text-sm text-gray-700 mb-3">{message}</p>
        <div className="flex gap-2">
          {onAction && (
            <Button
              size="sm"
              onClick={handleAction}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {actionLabel}
            </Button>
          )}
          {dismissible && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
            >
              Ignorer
            </Button>
          )}
        </div>
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          type="button"
          aria-label="Ignorer la notification"
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Composante pour afficher une liste de documents manquants
 */
export interface MissingDocumentsListProps {
  missingDocuments: string[];
  onUpload: (documentType: string) => void;
}

export function MissingDocumentsList({
  missingDocuments,
  onUpload,
}: MissingDocumentsListProps) {
  if (missingDocuments.length === 0) {
    return null;
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Documents Manquants ({missingDocuments.length})
      </h4>
      <div className="space-y-2">
        {missingDocuments.map((doc, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-white rounded border border-orange-100"
          >
            <span className="text-sm text-gray-700">{doc}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpload(doc)}
              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <Upload className="w-4 h-4 mr-1" />
              Téléverser
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

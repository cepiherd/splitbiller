import React, { useEffect } from 'react';
import { useError } from '../contexts/ErrorContext';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Button } from './ui/button';

interface ToastProps {
  error: {
    id: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    timestamp: Date;
    details?: string;
  };
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ error, onClose }) => {
  const getIcon = () => {
    switch (error.type) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (error.type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  const getTextColor = () => {
    switch (error.type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-red-800';
    }
  };

  // Auto close after 5 seconds for non-error types
  useEffect(() => {
    if (error.type !== 'error') {
      const timer = setTimeout(() => {
        onClose(error.id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error.id, error.type, onClose]);

  return (
    <div className={`p-4 rounded-lg border shadow-lg ${getBackgroundColor()} animate-in slide-in-from-right-full duration-300`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            {error.message}
          </p>
          {error.details && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer text-gray-600 hover:text-gray-800">
                Detail
              </summary>
              <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                {error.details}
              </p>
            </details>
          )}
        </div>
        <div className="flex-shrink-0">
          <Button
            onClick={() => onClose(error.id)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { errors, removeError } = useError();

  if (errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {errors.map((error) => (
        <Toast
          key={error.id}
          error={error}
          onClose={removeError}
        />
      ))}
    </div>
  );
};

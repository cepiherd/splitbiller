import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface ErrorState {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
  details?: string;
}

interface ErrorContextType {
  errors: ErrorState[];
  addError: (message: string, type?: 'error' | 'warning' | 'info', details?: string) => void;
  removeError: (id: string) => void;
  clearAllErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorState[]>([]);

  const addError = useCallback((
    message: string, 
    type: 'error' | 'warning' | 'info' = 'error',
    details?: string
  ) => {
    const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newError: ErrorState = {
      id,
      message,
      type,
      timestamp: new Date(),
      details
    };

    setErrors(prev => [...prev, newError]);

    // Auto remove error after 5 seconds for non-error types
    if (type !== 'error') {
      setTimeout(() => {
        removeError(id);
      }, 5000);
    }
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearAllErrors }}>
      {children}
    </ErrorContext.Provider>
  );
};

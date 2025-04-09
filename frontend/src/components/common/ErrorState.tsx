import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  isNetworkError?: boolean;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Erro ao carregar dados',
  message = 'Ocorreu um erro ao carregar os dados. Por favor, tente novamente mais tarde.',
  isNetworkError = false,
  onRetry
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg max-w-md w-full p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
          {isNetworkError ? (
            <WifiOff className="h-8 w-8 text-red-600 dark:text-red-400" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          )}
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
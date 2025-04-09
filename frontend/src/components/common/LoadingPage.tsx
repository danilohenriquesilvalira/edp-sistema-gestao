import React from 'react';

const LoadingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <div className="relative w-24 h-24">
        {/* Círculo externo (Roxo EDP) */}
        <div className="absolute inset-0 rounded-full border-4 border-edp-primary-purple animate-pulse"></div>
        
        {/* Círculo médio (Verde EDP) */}
        <div className="absolute inset-2 rounded-full border-4 border-edp-primary-green animate-pulse delay-150"></div>
        
        {/* Círculo interno (Azul EDP) */}
        <div className="absolute inset-4 rounded-full border-4 border-edp-primary-blue animate-pulse delay-300"></div>
        
        {/* Logo central */}
        <div className="absolute inset-6 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
          <div className="w-6 h-6 text-edp-primary-purple">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90C28 90 10 72 10 50S28 10 50 10s40 18 40 40-18 40-40 40z" />
            </svg>
          </div>
        </div>
      </div>
      
      <h2 className="mt-8 text-xl font-medium text-gray-700 dark:text-gray-300">
        A carregar...
      </h2>
      
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Por favor, aguarde
      </p>
    </div>
  );
};

export default LoadingPage;
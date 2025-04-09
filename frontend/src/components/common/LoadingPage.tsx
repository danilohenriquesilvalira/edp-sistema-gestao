import React from 'react';

const LoadingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Logo EDP */}
        <img
          src="/Logo_EDP.svg"
          alt="Logo EDP"
          className="w-16 h-16 animate-spin-slow" // Ajustando tamanho e animação
        />
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
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const NotFound: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8 flex justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-24 h-24">
            <circle cx="50" cy="50" r="45" fill="#32127A" />
            <circle cx="50" cy="50" r="35" fill="#A4D233" />
            <circle cx="50" cy="50" r="25" fill="#00ACEB" />
            <circle cx="50" cy="50" r="15" fill="#FFFFFF" />
          </svg>
        </div>
        
        <h1 className="text-9xl font-bold text-edp-primary-purple dark:text-edp-primary-blue mb-4">404</h1>
        
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Página não encontrada</h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 text-edp-primary-purple dark:text-edp-primary-blue border border-edp-primary-purple dark:border-edp-primary-blue rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            Voltar
          </button>
          
          <Link 
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="flex items-center justify-center px-6 py-3 bg-edp-primary-purple text-white rounded-md hover:bg-edp-primary-purple/90 transition-colors w-full sm:w-auto"
          >
            <Home size={18} className="mr-2" />
            {isAuthenticated ? "Ir para o Dashboard" : "Ir para o Login"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
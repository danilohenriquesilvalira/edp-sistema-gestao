// frontend/src/pages/faults/FaultActivePage.tsx
import React, { useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import FaultList from '@/components/plc/FaultList';
import { FaultEvent } from '@/types/plc';
import { useNavigate } from 'react-router-dom';

const FaultActivePage: React.FC = () => {
  const [fullView, setFullView] = useState(true);
  const navigate = useNavigate();
  
  // Handler for fault click (could be used for details view)
  const handleFaultClick = (fault: FaultEvent) => {
    if (fault.id === 0) { // This is our "show all" case
      setFullView(true);
      return;
    }
    
    // Could navigate to details or show a modal
    console.log('Fault clicked:', fault);
  };
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <AlertTriangle className="mr-3 h-7 w-7 text-red-500" />
            Falhas Ativas
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Monitoramento em tempo real de falhas e eventos do sistema.
          </p>
        </div>
        
        <button
          onClick={() => navigate('/falhas/definicoes')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Definições de Falhas
        </button>
      </div>
      
      <FaultList 
        activeOnly={true}
        limitCount={fullView ? undefined : 5}
        showFilters={true}
        onFaultClick={handleFaultClick}
      />
    </div>
  );
};

export default FaultActivePage;
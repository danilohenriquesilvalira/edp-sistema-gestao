// frontend/src/pages/faults/FaultDefinitionsPage.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import FaultDefinitionsList from '@/components/plc/FaultDefinitionsList';

const FaultDefinitionsPage: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <AlertTriangle className="mr-3 h-7 w-7 text-cyan-500" />
          Definições de Falhas
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Gerencie as definições de falhas e eventos monitorados pelo sistema.
        </p>
      </div>
      
      <FaultDefinitionsList />
    </div>
  );
};

export default FaultDefinitionsPage;
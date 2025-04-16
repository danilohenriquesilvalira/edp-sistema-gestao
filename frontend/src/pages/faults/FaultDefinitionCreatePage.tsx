// frontend/src/pages/faults/FaultDefinitionCreatePage.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import FaultDefinitionForm from '@/components/plc/FaultDefinitionForm';

const FaultDefinitionCreatePage: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <AlertTriangle className="mr-3 h-7 w-7 text-cyan-500" />
          Nova Definição de Falha
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Adicione uma nova definição de falha ou evento para monitoramento.
        </p>
      </div>
      
      <FaultDefinitionForm />
    </div>
  );
};

export default FaultDefinitionCreatePage;
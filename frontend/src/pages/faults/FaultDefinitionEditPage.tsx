// frontend/src/pages/faults/FaultDefinitionEditPage.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import FaultDefinitionForm from '@/components/plc/FaultDefinitionForm';

const FaultDefinitionEditPage: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <AlertTriangle className="mr-3 h-7 w-7 text-cyan-500" />
          Editar Definição de Falha
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Edite uma definição de falha ou evento existente.
        </p>
      </div>
      
      <FaultDefinitionForm isEdit />
    </div>
  );
};

export default FaultDefinitionEditPage;
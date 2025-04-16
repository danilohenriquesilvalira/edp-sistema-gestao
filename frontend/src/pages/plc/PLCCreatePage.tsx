// frontend/src/pages/plc/PLCCreatePage.tsx
import React from 'react';
import { Server } from 'lucide-react';
import PLCForm from '@/components/plc/PLCForm';

const PLCCreatePage: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Server className="mr-3 h-7 w-7 text-cyan-500" />
          Novo PLC
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Adicione um novo controlador lógico programável ao sistema.
        </p>
      </div>
      
      <PLCForm />
    </div>
  );
};

export default PLCCreatePage;
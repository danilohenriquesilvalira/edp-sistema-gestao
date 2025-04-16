// frontend/src/pages/plc/PLCEditPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { Server } from 'lucide-react';
import PLCForm from '@/components/plc/PLCForm';

const PLCEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Server className="mr-3 h-7 w-7 text-cyan-500" />
          Editar PLC
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Editar configurações do controlador lógico programável.
        </p>
      </div>
      
      <PLCForm isEdit />
    </div>
  );
};

export default PLCEditPage;

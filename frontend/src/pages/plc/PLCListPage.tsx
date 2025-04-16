// frontend/src/pages/plc/PLCListPage.tsx
import React from 'react';
import { Server } from 'lucide-react';
import PLCList from '@/components/plc/PLCList';

const PLCListPage: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Server className="mr-3 h-7 w-7 text-cyan-500" />
          Controladores Lógicos Programáveis (PLCs)
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Gerencie as conexões com os PLCs que monitoram o sistema.
        </p>
      </div>
      
      <PLCList />
    </div>
  );
};

export default PLCListPage;
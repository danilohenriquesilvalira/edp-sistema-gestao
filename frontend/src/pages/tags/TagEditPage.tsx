// frontend/src/pages/tags/TagEditPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { Tag } from 'lucide-react';
import TagForm from '@/components/plc/TagForm';

const TagEditPage: React.FC = () => {
  const { plcId, id } = useParams<{ plcId: string; id: string }>();
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Tag className="mr-3 h-7 w-7 text-cyan-500" />
          Editar Tag
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Editar configurações da tag de dados.
        </p>
      </div>
      
      <TagForm plcId={Number(plcId)} isEdit />
    </div>
  );
};

export default TagEditPage;
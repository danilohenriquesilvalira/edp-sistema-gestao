// frontend/src/pages/tags/TagCreatePage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { Tag } from 'lucide-react';
import TagForm from '@/components/plc/TagForm';

const TagCreatePage: React.FC = () => {
  const { plcId } = useParams<{ plcId: string }>();
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Tag className="mr-3 h-7 w-7 text-cyan-500" />
          Nova Tag
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Adicione uma nova tag de dados ao PLC.
        </p>
      </div>
      
      <TagForm plcId={Number(plcId)} />
    </div>
  );
};

export default TagCreatePage;
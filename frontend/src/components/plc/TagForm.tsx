// frontend/src/components/plc/TagForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Save, 
  X,
  ArrowLeft,
  Tag as TagIcon,
  Info,
  AlertCircle
} from 'lucide-react';
import { Tag } from '../../types/plc';
import plcApi from '../../services/plcApi';

interface TagFormProps {
  plcId: number;
  initialData?: Tag;
  isEdit?: boolean;
}

const defaultTag: (plcId: number) => Tag = (plcId) => ({
  id: 0,
  plc_id: plcId,
  nome: '',
  db_number: 0,
  byte_offset: 0,
  bit_offset: undefined,
  tipo: 'Int',
  tamanho: 1,
  subsistema: '',
  descricao: '',
  ativo: true,
  update_interval_ms: 1000,
  only_on_change: false
});

const tagTypes = [
  { value: 'Bool', label: 'Bool (Booleano)', description: 'Valor lógico (verdadeiro/falso)' },
  { value: 'Int', label: 'Int (Inteiro)', description: 'Número inteiro com sinal (16 bits)' },
  { value: 'Word', label: 'Word (Palavra)', description: 'Número inteiro sem sinal (16 bits)' },
  { value: 'Real', label: 'Real (Ponto Flutuante)', description: 'Número de ponto flutuante (32 bits)' },
  { value: 'String', label: 'String (Texto)', description: 'Cadeia de caracteres' }
];

const TagForm: React.FC<TagFormProps> = ({ plcId, initialData, isEdit = false }) => {
  const [tag, setTag] = useState<Tag>(initialData || defaultTag(plcId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Load tag data if in edit mode
  useEffect(() => {
    const fetchTag = async () => {
      if (!id || !isEdit) return;
      
      try {
        setLoading(true);
        const response = await plcApi.getTagById(Number(id));
        
        if (response.data.sucesso) {
          setTag(response.data.dados);
        } else {
          toast.error(response.data.mensagem || 'Falha ao carregar dados da tag');
          navigate(`/plcs/${plcId}`);
        }
      } catch (err) {
        console.error('Erro ao carregar tag:', err);
        toast.error('Não foi possível carregar os dados da tag');
        navigate(`/plcs/${plcId}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTag();
  }, [id, isEdit, navigate, plcId]);
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!tag.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (tag.db_number < 0) {
      newErrors.db_number = 'Número do DB deve ser um número positivo';
    }
    
    if (tag.byte_offset < 0) {
      newErrors.byte_offset = 'Offset do Byte deve ser um número positivo';
    }
    
    if (tag.bit_offset !== undefined && (tag.bit_offset < 0 || tag.bit_offset > 7)) {
      newErrors.bit_offset = 'Offset do Bit deve estar entre 0 e 7';
    }
    
    if (tag.update_interval_ms < 100) {
      newErrors.update_interval_ms = 'Intervalo de atualização deve ser pelo menos 100 ms';
    }
    
    if (tag.tipo === 'String' && (tag.tamanho < 1 || tag.tamanho > 254)) {
      newErrors.tamanho = 'Tamanho da string deve estar entre 1 e 254';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setTag({ ...tag, [name]: target.checked });
    } else if (type === 'number') {
      setTag({ ...tag, [name]: parseInt(value) || 0 });
    } else {
      setTag({ ...tag, [name]: value });
    }
    
    // Special handling for tag type
    if (name === 'tipo') {
      const newTag = { ...tag, tipo: value };
      
      // Reset bit_offset if type is not Bool
      if (value !== 'Bool') {
        newTag.bit_offset = undefined;
      }
      
      // Set default size for strings
      if (value === 'String' && (!tag.tamanho || tag.tamanho === 1)) {
        newTag.tamanho = 20;
      } else if (value !== 'String') {
        newTag.tamanho = 1;
      }
      
      setTag(newTag);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Remove runtime fields before sending to API
      const { ultimo_valor, ultima_leitura, ultimo_erro, ultimo_erro_time, ...tagData } = tag;
      
      // Make sure plc_id is properly set
      tagData.plc_id = plcId;
      
      let response;
      if (isEdit && id) {
        response = await plcApi.updateTag(Number(id), tagData);
      } else {
        response = await plcApi.createTag(tagData);
      }
      
      if (response.data.sucesso) {
        toast.success(isEdit ? 'Tag atualizada com sucesso' : 'Tag criada com sucesso');
        navigate(`/plcs/${plcId}`);
      } else {
        toast.error(response.data.mensagem || (isEdit ? 'Falha ao atualizar tag' : 'Falha ao criar tag'));
      }
    } catch (err) {
      console.error('Erro ao salvar tag:', err);
      toast.error('Ocorreu um erro ao salvar a tag');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white flex items-center">
          <TagIcon className="mr-2 h-6 w-6 text-cyan-500" />
          {isEdit ? 'Editar Tag' : 'Nova Tag'}
        </h2>
        <button
          type="button"
          onClick={() => navigate(`/plcs/${plcId}`)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome
            </label>
            <input
              type="text"
              name="nome"
              id="nome"
              value={tag.nome}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.nome ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
              placeholder="Nome da Tag"
            />
            {errors.nome && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nome}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Dado
            </label>
            <select
              name="tipo"
              id="tipo"
              value={tag.tipo}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:bg-gray-700 dark:text-white"
            >
              {tagTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {tagTypes.find(t => t.value === tag.tipo)?.description}
            </p>
          </div>
          
          <div className="col-span-1">
            <label htmlFor="db_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número do DB
            </label>
            <input
              type="number"
              name="db_number"
              id="db_number"
              value={tag.db_number}
              onChange={handleInputChange}
              min="0"
              className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.db_number ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
            />
            {errors.db_number && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.db_number}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label htmlFor="byte_offset" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Offset do Byte
            </label>
            <input
              type="number"
              name="byte_offset"
              id="byte_offset"
              value={tag.byte_offset}
              onChange={handleInputChange}
              min="0"
              className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.byte_offset ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
            />
            {errors.byte_offset && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.byte_offset}</p>
            )}
          </div>
          
          {tag.tipo === 'Bool' && (
            <div className="col-span-1">
              <label htmlFor="bit_offset" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Offset do Bit
              </label>
              <input
                type="number"
                name="bit_offset"
                id="bit_offset"
                value={tag.bit_offset !== undefined ? tag.bit_offset : 0}
                onChange={handleInputChange}
                min="0"
                max="7"
                className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.bit_offset ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
                }`}
              />
              {errors.bit_offset && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.bit_offset}</p>
              )}
            </div>
          )}
          
          {tag.tipo === 'String' && (
            <div className="col-span-1">
              <label htmlFor="tamanho" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tamanho da String
              </label>
              <input
                type="number"
                name="tamanho"
                id="tamanho"
                value={tag.tamanho}
                onChange={handleInputChange}
                min="1"
                max="254"
                className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.tamanho ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
                }`}
              />
              {errors.tamanho && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tamanho}</p>
              )}
            </div>
          )}
          
          <div className="col-span-1">
            <label htmlFor="subsistema" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subsistema (opcional)
            </label>
            <input
              type="text"
              name="subsistema"
              id="subsistema"
              value={tag.subsistema || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ex: Hidráulico, Mecânico, etc."
            />
          </div>
          
          <div className="col-span-1">
            <label htmlFor="update_interval_ms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Intervalo de Atualização (ms)
            </label>
            <input
              type="number"
              name="update_interval_ms"
              id="update_interval_ms"
              value={tag.update_interval_ms}
              onChange={handleInputChange}
              min="100"
              step="100"
              className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.update_interval_ms ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
            />
            {errors.update_interval_ms && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.update_interval_ms}</p>
            )}
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-md mb-4">
              <div className="flex">
                <Info className="h-5 w-5 text-cyan-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-cyan-700 dark:text-cyan-300">
                  O endereço completo desta tag no PLC será:
                  <span className="font-mono font-bold ml-2">
                    DB{tag.db_number}.DBW{tag.byte_offset}
                    {tag.tipo === 'Bool' && tag.bit_offset !== undefined ? `.${tag.bit_offset}` : ''}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              name="descricao"
              id="descricao"
              rows={3}
              value={tag.descricao || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:bg-gray-700 dark:text-white"
              placeholder="Descrição detalhada da tag e sua função"
            />
          </div>
          
          <div className="col-span-1">
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                name="ativo"
                id="ativo"
                checked={tag.ativo}
                onChange={handleInputChange}
                className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 dark:focus:ring-cyan-400 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Ativo
              </label>
            </div>
          </div>
          
          <div className="col-span-1">
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                name="only_on_change"
                id="only_on_change"
                checked={tag.only_on_change}
                onChange={handleInputChange}
                className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 dark:focus:ring-cyan-400 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="only_on_change" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Publicar apenas quando o valor mudar
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => navigate(`/plcs/${plcId}`)}
            className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TagForm;
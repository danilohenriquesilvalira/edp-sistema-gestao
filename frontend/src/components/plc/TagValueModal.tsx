// frontend/src/components/plc/TagValueModal.tsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { 
  X, 
  Save,
  RefreshCw,
  Terminal,
  AlertCircle
} from 'lucide-react';
import { Tag } from '../../types/plc';
import plcApi from '../../services/plcApi';
import { formatDateTime } from '../../utils/format';

interface TagValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: Tag;
}

const TagValueModal: React.FC<TagValueModalProps> = ({ isOpen, onClose, tag }) => {
  const [value, setValue] = useState<string | number | boolean>(
    tag.ultimo_valor !== undefined ? tag.ultimo_valor : ''
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  if (!isOpen) return null;
  
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    
    if (tag.tipo === 'Bool') {
      setValue(target.type === 'checkbox' ? target.checked : target.value === 'true');
    } else if (tag.tipo === 'Int' || tag.tipo === 'Word') {
      setValue(parseInt(target.value) || 0);
    } else if (tag.tipo === 'Real') {
      setValue(parseFloat(target.value) || 0);
    } else {
      setValue(target.value);
    }
  };
  
  const refreshValue = async () => {
    try {
      setRefreshing(true);
      const response = await plcApi.readTagValue(tag.id);
      
      if (response.data.sucesso) {
        setValue(response.data.dados.valor);
        toast.success('Valor atualizado com sucesso');
      } else {
        toast.error(response.data.mensagem || 'Falha ao ler valor da tag');
      }
    } catch (err) {
      console.error('Erro ao ler valor da tag:', err);
      toast.error('Ocorreu um erro ao ler o valor da tag');
    } finally {
      setRefreshing(false);
    }
  };
  
  const writeValue = async () => {
    try {
      setLoading(true);
      
      // Convert value to proper type before sending
      let valueToSend = value;
      if (tag.tipo === 'Bool' && typeof value === 'string') {
        valueToSend = value === 'true';
      } else if ((tag.tipo === 'Int' || tag.tipo === 'Word') && typeof value === 'string') {
        valueToSend = parseInt(value) || 0;
      } else if (tag.tipo === 'Real' && typeof value === 'string') {
        valueToSend = parseFloat(value) || 0;
      }
      
      const response = await plcApi.writeTagValue(tag.id, valueToSend);
      
      if (response.data.sucesso) {
        toast.success('Valor escrito com sucesso');
        // Refresh the value after writing
        await refreshValue();
        onClose();
      } else {
        toast.error(response.data.mensagem || 'Falha ao escrever valor na tag');
      }
    } catch (err) {
      console.error('Erro ao escrever valor na tag:', err);
      toast.error('Ocorreu um erro ao escrever o valor na tag');
    } finally {
      setLoading(false);
    }
  };
  
  const renderValueInput = () => {
    switch (tag.tipo) {
      case 'Bool':
        return (
          <div className="flex items-center">
            <input
              id="value-bool"
              name="value-bool"
              type="checkbox"
              checked={typeof value === 'boolean' ? value : value === 'true'}
              onChange={handleValueChange}
              className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 dark:border-gray-700 rounded"
            />
            <label htmlFor="value-bool" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              {typeof value === 'boolean' ? (value ? 'True' : 'False') : value === 'true' ? 'True' : 'False'}
            </label>
            
            <select
              value={typeof value === 'boolean' ? value.toString() : value}
              onChange={handleValueChange}
              className="ml-4 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        );
        
      case 'Int':
      case 'Word':
        return (
          <input
            type="number"
            value={value.toString()}
            onChange={handleValueChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        );
        
      case 'Real':
        return (
          <input
            type="number"
            step="0.01"
            value={value.toString()}
            onChange={handleValueChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        );
        
      case 'String':
        return (
          <input
            type="text"
            value={value.toString()}
            onChange={handleValueChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        );
        
      default:
        return (
          <input
            type="text"
            value={value.toString()}
            onChange={handleValueChange}
            className="mt-1 block w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            disabled
          />
        );
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Terminal className="mr-2 h-5 w-5 text-cyan-500" />
              Valor da Tag: {tag.nome}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            {/* Tag details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Endereço:</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  DB{tag.db_number}.DBW{tag.byte_offset}{tag.bit_offset !== undefined ? `.${tag.bit_offset}` : ''}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Tipo:</p>
                <p className="font-medium text-gray-900 dark:text-white">{tag.tipo}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Última Leitura:</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {tag.ultima_leitura ? formatDateTime(tag.ultima_leitura) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Intervalo de Atualização:</p>
                <p className="font-medium text-gray-900 dark:text-white">{tag.update_interval_ms} ms</p>
              </div>
            </div>
            
            {/* Value input */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Valor
                </label>
                <button
                  type="button"
                  onClick={refreshValue}
                  disabled={refreshing}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {refreshing ? 'Atualizando...' : 'Atualizar'}
                </button>
              </div>
              {renderValueInput()}
            </div>
            
            {/* Warning message for writing to PLC */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md mt-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400 dark:text-yellow-300 mr-2" />
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  Atenção: Escrever valores em tags do PLC pode afetar o funcionamento de equipamentos físicos conectados ao sistema. Certifique-se de que sabe o que está fazendo.
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex flex-row-reverse gap-3">
            <button
              type="button"
              onClick={writeValue}
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Escrevendo...' : 'Escrever Valor'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagValueModal;
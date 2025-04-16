// frontend/src/components/plc/PLCForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Save, 
  X,
  ArrowLeft,
  Server
} from 'lucide-react';
import { PLC } from '../../types/plc';
import plcApi from '../../services/plcApi';
import { isValidIpAddress } from '../../utils/plcValidators'; // Updated import path

interface PLCFormProps {
  initialData?: PLC;
  isEdit?: boolean;
}

const defaultPLC: PLC = {
  id: 0,
  nome: '',
  ip_address: '',
  rack: 0,
  slot: 0,
  gateway: '',
  ativo: true,
  conectado: false
};

const PLCForm: React.FC<PLCFormProps> = ({ initialData, isEdit = false }) => {
  const [plc, setPlc] = useState<PLC>(initialData || defaultPLC);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Load PLC data if in edit mode
  useEffect(() => {
    const fetchPLC = async () => {
      if (!id || !isEdit) return;
      
      try {
        setLoading(true);
        const response = await plcApi.getPLCById(Number(id));
        
        if (response.data.sucesso) {
          setPlc(response.data.dados);
        } else {
          toast.error(response.data.mensagem || 'Falha ao carregar dados do PLC');
          navigate('/plcs');
        }
      } catch (err) {
        console.error('Erro ao carregar PLC:', err);
        toast.error('Não foi possível carregar os dados do PLC');
        navigate('/plcs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPLC();
  }, [id, isEdit, navigate]);
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!plc.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!plc.ip_address.trim()) {
      newErrors.ip_address = 'Endereço IP é obrigatório';
    } else if (!isValidIpAddress(plc.ip_address)) {
      newErrors.ip_address = 'Endereço IP inválido';
    }
    
    if (plc.rack < 0) {
      newErrors.rack = 'Rack deve ser um número positivo';
    }
    
    if (plc.slot < 0) {
      newErrors.slot = 'Slot deve ser um número positivo';
    }
    
    if (plc.gateway && !isValidIpAddress(plc.gateway)) {
      newErrors.gateway = 'Endereço de Gateway inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setPlc({ ...plc, [name]: target.checked });
    } else if (type === 'number') {
      setPlc({ ...plc, [name]: parseInt(value) || 0 });
    } else {
      setPlc({ ...plc, [name]: value });
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
      const { conectado, ultimo_erro, ultima_leitura, tags, ...plcData } = plc;
      
      let response;
      if (isEdit) {
        response = await plcApi.updatePLC(plc.id, plcData);
      } else {
        response = await plcApi.createPLC(plcData);
      }
      
      if (response.data.sucesso) {
        toast.success(isEdit ? 'PLC atualizado com sucesso' : 'PLC criado com sucesso');
        navigate('/plcs');
      } else {
        toast.error(response.data.mensagem || (isEdit ? 'Falha ao atualizar PLC' : 'Falha ao criar PLC'));
      }
    } catch (err) {
      console.error('Erro ao salvar PLC:', err);
      toast.error('Ocorreu um erro ao salvar o PLC');
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
          <Server className="mr-2 h-6 w-6 text-cyan-500" />
          {isEdit ? 'Editar PLC' : 'Novo PLC'}
        </h2>
        <button
          type="button"
          onClick={() => navigate('/plcs')}
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
              value={plc.nome}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.nome ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
              placeholder="Nome do PLC"
            />
            {errors.nome && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nome}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label htmlFor="ip_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endereço IP
            </label>
            <input
              type="text"
              name="ip_address"
              id="ip_address"
              value={plc.ip_address}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.ip_address ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
              placeholder="192.168.1.10"
            />
            {errors.ip_address && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ip_address}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label htmlFor="rack" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rack
            </label>
            <input
              type="number"
              name="rack"
              id="rack"
              value={plc.rack}
              onChange={handleInputChange}
              min="0"
              className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.rack ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
            />
            {errors.rack && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rack}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label htmlFor="slot" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slot
            </label>
            <input
              type="number"
              name="slot"
              id="slot"
              value={plc.slot}
              onChange={handleInputChange}
              min="0"
              className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.slot ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
            />
            {errors.slot && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.slot}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label htmlFor="gateway" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gateway (opcional)
            </label>
            <input
              type="text"
              name="gateway"
              id="gateway"
              value={plc.gateway || ''}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.gateway ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
              placeholder="192.168.1.1"
            />
            {errors.gateway && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gateway}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <div className="flex items-center h-full mt-6">
              <input
                type="checkbox"
                name="ativo"
                id="ativo"
                checked={plc.ativo}
                onChange={handleInputChange}
                className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 dark:focus:ring-cyan-400 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Ativo
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/plcs')}
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

export default PLCForm;
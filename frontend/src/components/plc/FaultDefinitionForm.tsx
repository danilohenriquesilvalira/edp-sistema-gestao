// frontend/src/components/plc/FaultDefinitionForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Save, 
  X,
  ArrowLeft,
  AlertTriangle,
  Info
} from 'lucide-react';
import { FaultDefinition } from '../../types/plc';
import plcApi from '../../services/plcApi';

interface FaultDefinitionFormProps {
  initialData?: FaultDefinition;
  isEdit?: boolean;
}

const defaultFaultDefinition: FaultDefinition = {
  id: 0,
  plc_id: 0,
  word_name: '',
  db_number: 0,
  byte_offset: 0,
  bit_offset: 0,
  eclusa: '',
  subsistema: '',
  descricao: '',
  tipo: 'Alarme',
  ativo: true,
  created_at: '',
  updated_at: ''
};

const FaultDefinitionForm: React.FC<FaultDefinitionFormProps> = ({ initialData, isEdit = false }) => {
  const [definition, setDefinition] = useState<FaultDefinition>(initialData || defaultFaultDefinition);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [plcs, setPlcs] = useState<Array<{ id: number; nome: string }>>([]);
  const [eclusasList, setEclusasList] = useState<string[]>([]);
  const [subsistemasList, setSubsistemasList] = useState<string[]>([]);
  
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Load fault definition data if in edit mode
  useEffect(() => {
    const fetchDefinition = async () => {
      if (!id || !isEdit) return;
      
      try {
        setLoading(true);
        const response = await plcApi.getFaultDefinitionById(Number(id));
        
        if (response.data.sucesso) {
          setDefinition(response.data.dados);
        } else {
          toast.error(response.data.mensagem || 'Falha ao carregar definição de falha');
          navigate('/falhas/definicoes');
        }
      } catch (err) {
        console.error('Erro ao carregar definição de falha:', err);
        toast.error('Não foi possível carregar os dados da definição de falha');
        navigate('/falhas/definicoes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDefinition();
  }, [id, isEdit, navigate]);
  
  // Load PLCs and filter options
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get PLCs
        const plcsResponse = await plcApi.getAllPLCs();
        if (plcsResponse.data.sucesso) {
          setPlcs(plcsResponse.data.dados.map((plc: any) => ({ id: plc.id, nome: plc.nome })));
        }
        
        // Get eclusas list
        const eclusasResponse = await plcApi.getEclusasList();
        if (eclusasResponse.data.sucesso) {
          setEclusasList(eclusasResponse.data.dados);
        }
        
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        toast.error('Ocorreu um erro ao carregar informações necessárias');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Load subsystems when eclusa changes
  useEffect(() => {
    if (definition.eclusa) {
      const fetchSubsistemas = async () => {
        try {
          const response = await plcApi.getSubsistemasList(definition.eclusa);
          if (response.data.sucesso) {
            setSubsistemasList(response.data.dados);
          }
        } catch (err) {
          console.error('Erro ao carregar subsistemas:', err);
        }
      };
      
      fetchSubsistemas();
    } else {
      setSubsistemasList([]);
    }
  }, [definition.eclusa]);
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!definition.word_name.trim()) {
      newErrors.word_name = 'Nome da word é obrigatório';
    }
    
    if (definition.db_number < 0) {
      newErrors.db_number = 'Número do DB deve ser um número positivo';
    }
    
    if (definition.byte_offset < 0) {
      newErrors.byte_offset = 'Offset do Byte deve ser um número positivo';
    }
    
    if (definition.bit_offset < 0 || definition.bit_offset > 15) {
      newErrors.bit_offset = 'Offset do Bit deve estar entre 0 e 15';
    }
    
    if (!definition.eclusa.trim()) {
      newErrors.eclusa = 'Eclusa é obrigatória';
    }
    
    if (!definition.subsistema.trim()) {
      newErrors.subsistema = 'Subsistema é obrigatório';
    }
    
    if (!definition.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }
    
    if (definition.plc_id <= 0) {
      newErrors.plc_id = 'Selecione um PLC';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setDefinition({ ...definition, [name]: target.checked });
    } else if (type === 'number') {
      setDefinition({ ...definition, [name]: parseInt(value) || 0 });
    } else {
      setDefinition({ ...definition, [name]: value });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      let response;
      if (isEdit) {
        response = await plcApi.updateFaultDefinition(definition.id, definition);
      } else {
        response = await plcApi.createFaultDefinition(definition);
      }
      
      if (response.data.sucesso) {
        toast.success(isEdit ? 'Definição de falha atualizada com sucesso' : 'Definição de falha criada com sucesso');
        navigate('/falhas/definicoes');
      } else {
        toast.error(response.data.mensagem || (isEdit ? 'Falha ao atualizar definição' : 'Falha ao criar definição'));
      }
    } catch (err) {
      console.error('Erro ao salvar definição de falha:', err);
      toast.error('Ocorreu um erro ao salvar a definição de falha');
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
          <AlertTriangle className="mr-2 h-6 w-6 text-cyan-500" />
          {isEdit ? 'Editar Definição de Falha' : 'Nova Definição de Falha'}
        </h2>
        <button
          type="button"
          onClick={() => navigate('/falhas/definicoes')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1">
            <label htmlFor="plc_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PLC
            </label>
            <select
              id="plc_id"
              name="plc_id"
              value={definition.plc_id}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.plc_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
            >
              <option value="0">Selecione um PLC</option>
              {plcs.map((plc) => (
                <option key={plc.id} value={plc.id}>
                  {plc.nome}
                </option>
              ))}
            </select>
            {errors.plc_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.plc_id}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label htmlFor="word_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome da Word
            </label>
            <input
              type="text"
              name="word_name"
              id="word_name"
              value={definition.word_name}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.word_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
              placeholder="Ex: Status_Bomba1"
            />
            {errors.word_name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.word_name}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label htmlFor="db_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número do DB
            </label>
            <input
              type="number"
              name="db_number"
              id="db_number"
              value={definition.db_number}
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
              value={definition.byte_offset}
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
          
          <div className="col-span-1">
            <label htmlFor="bit_offset" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Offset do Bit
            </label>
            <input
              type="number"
              name="bit_offset"
              id="bit_offset"
              value={definition.bit_offset}
              onChange={handleInputChange}
              min="0"
              max="15"
              className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.bit_offset ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
            />
            {errors.bit_offset && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.bit_offset}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              id="tipo"
              name="tipo"
              value={definition.tipo}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="Alarme">Alarme</option>
              <option value="Evento">Evento</option>
            </select>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-md mb-4">
              <div className="flex">
                <Info className="h-5 w-5 text-cyan-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-cyan-700 dark:text-cyan-300">
                  O endereço completo desta falha no PLC será:
                  <span className="font-mono font-bold ml-2">
                    DB{definition.db_number}.DBW{definition.byte_offset}.{definition.bit_offset}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="col-span-1">
            <label htmlFor="eclusa" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Eclusa
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <select
                id="eclusa"
                name="eclusa"
                value={definition.eclusa}
                onChange={handleInputChange}
                className={`block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.eclusa ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
                }`}
              >
                <option value="">Selecione uma Eclusa</option>
                {eclusasList.map((eclusa) => (
                  <option key={eclusa} value={eclusa}>{eclusa}</option>
                ))}
              </select>
            </div>
            {errors.eclusa && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.eclusa}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <label htmlFor="subsistema" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subsistema
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <select
                id="subsistema"
                name="subsistema"
                value={definition.subsistema}
                onChange={handleInputChange}
                className={`block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.subsistema ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
                }`}
                disabled={!definition.eclusa}
              >
                <option value="">Selecione um Subsistema</option>
                {subsistemasList.map((subsistema) => (
                  <option key={subsistema} value={subsistema}>{subsistema}</option>
                ))}
              </select>
            </div>
            {errors.subsistema && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subsistema}</p>
            )}
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <textarea
              name="descricao"
              id="descricao"
              rows={3}
              value={definition.descricao}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                errors.descricao ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-cyan-500 focus:border-cyan-500'
              }`}
              placeholder="Descrição detalhada da falha"
            />
            {errors.descricao && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.descricao}</p>
            )}
          </div>
          
          <div className="col-span-1">
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                name="ativo"
                id="ativo"
                checked={definition.ativo}
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
            onClick={() => navigate('/falhas/definicoes')}
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

export default FaultDefinitionForm;
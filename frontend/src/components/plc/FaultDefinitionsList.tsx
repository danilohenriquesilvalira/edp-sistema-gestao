// frontend/src/components/plc/FaultDefinitionsList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X
} from 'lucide-react';
import ConfirmationModal from '../common/ConfirmationModal';
import { FaultDefinition } from '../../types/plc';
import plcApi from '../../services/plcApi';
import ErrorState from '../common/ErrorState';

const FaultDefinitionsList: React.FC = () => {
  const [definitions, setDefinitions] = useState<FaultDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [definitionToDelete, setDefinitionToDelete] = useState<FaultDefinition | null>(null);
  const [plcs, setPlcs] = useState<Record<number, string>>({});
  const [filters, setFilters] = useState({
    eclusa: '',
    subsistema: '',
    tipo: '',
    ativo: '',
    plcId: ''
  });
  const [eclusasList, setEclusasList] = useState<string[]>([]);
  const [subsistemasList, setSubsistemasList] = useState<string[]>([]);

  const fetchDefinitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await plcApi.getFaultDefinitions();
      
      if (response.data.sucesso) {
        setDefinitions(response.data.dados);
      } else {
        throw new Error(response.data.mensagem || 'Falha ao carregar definições de falhas');
      }
    } catch (err) {
      console.error('Erro ao carregar definições de falhas:', err);
      setError('Não foi possível carregar a lista de definições de falhas. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPLCs = async () => {
    try {
      const response = await plcApi.getAllPLCs();
      
      if (response.data.sucesso) {
        const plcsMap: Record<number, string> = {};
        response.data.dados.forEach((plc: any) => {
          plcsMap[plc.id] = plc.nome;
        });
        setPlcs(plcsMap);
      }
    } catch (err) {
      console.error('Erro ao carregar PLCs:', err);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Get eclusas list
      const eclusasResponse = await plcApi.getEclusasList();
      if (eclusasResponse.data.sucesso) {
        setEclusasList(eclusasResponse.data.dados);
      }

      // Get subsistemas list (all of them initially)
      if (filters.eclusa) {
        const subsisResponse = await plcApi.getSubsistemasList(filters.eclusa);
        if (subsisResponse.data.sucesso) {
          setSubsistemasList(subsisResponse.data.dados);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar opções de filtro:', err);
    }
  };

  useEffect(() => {
    fetchDefinitions();
    fetchPLCs();
    fetchFilterOptions();
  }, []);

  // Update subsystems when eclusa changes
  useEffect(() => {
    if (filters.eclusa) {
      const fetchSubsistemas = async () => {
        try {
          const response = await plcApi.getSubsistemasList(filters.eclusa);
          if (response.data.sucesso) {
            setSubsistemasList(response.data.dados);
            // Reset subsistema filter if it's not in the new list
            if (filters.subsistema && !response.data.dados.includes(filters.subsistema)) {
              setFilters(prev => ({ ...prev, subsistema: '' }));
            }
          }
        } catch (err) {
          console.error('Erro ao carregar subsistemas:', err);
        }
      };
      
      fetchSubsistemas();
    } else {
      // Reset subsistemas if no eclusa selected
      setSubsistemasList([]);
      setFilters(prev => ({ ...prev, subsistema: '' }));
    }
  }, [filters.eclusa]);

  const handleDelete = async () => {
    if (!definitionToDelete) return;
    
    try {
      const response = await plcApi.deleteFaultDefinition(definitionToDelete.id);
      
      if (response.data.sucesso) {
        toast.success('Definição de falha excluída com sucesso');
        fetchDefinitions();
      } else {
        toast.error(response.data.mensagem || 'Falha ao excluir definição de falha');
      }
    } catch (err) {
      console.error('Erro ao excluir definição de falha:', err);
      toast.error('Ocorreu um erro ao excluir a definição de falha. Por favor, tente novamente.');
    } finally {
      setDeleteModalOpen(false);
      setDefinitionToDelete(null);
    }
  };

  const confirmDelete = (definition: FaultDefinition) => {
    setDefinitionToDelete(definition);
    setDeleteModalOpen(true);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      eclusa: '',
      subsistema: '',
      tipo: '',
      ativo: '',
      plcId: ''
    });
    setSearchTerm('');
  };

  // Apply all filters
  const filteredDefinitions = definitions.filter(def => {
    // Text search
    const matchesSearch = 
      def.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      def.word_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      def.eclusa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      def.subsistema.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Dropdown filters
    const matchesEclusa = !filters.eclusa || def.eclusa === filters.eclusa;
    const matchesSubsistema = !filters.subsistema || def.subsistema === filters.subsistema;
    const matchesTipo = !filters.tipo || def.tipo === filters.tipo;
    const matchesAtivo = filters.ativo === '' || 
      (filters.ativo === 'true' && def.ativo) || 
      (filters.ativo === 'false' && !def.ativo);
    const matchesPlc = !filters.plcId || def.plc_id.toString() === filters.plcId;
    
    return matchesSearch && matchesEclusa && matchesSubsistema && matchesTipo && matchesAtivo && matchesPlc;
  });

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState 
        message={error}
        onRetry={fetchDefinitions}
      />
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
              placeholder="Buscar definições..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </button>
            <button
              onClick={fetchDefinitions}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </button>
            <Link
              to="/falhas/definicoes/nova"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Definição
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* PLC Filter */}
          <div>
            <label htmlFor="plcId" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              PLC
            </label>
            <div className="relative">
              <select
                id="plcId"
                name="plcId"
                value={filters.plcId}
                onChange={handleFilterChange}
                className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos os PLCs</option>
                {Object.entries(plcs).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Eclusa Filter */}
          <div>
            <label htmlFor="eclusa" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Eclusa
            </label>
            <div className="relative">
              <select
                id="eclusa"
                name="eclusa"
                value={filters.eclusa}
                onChange={handleFilterChange}
                className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todas as Eclusas</option>
                {eclusasList.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Subsistema Filter */}
          <div>
            <label htmlFor="subsistema" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subsistema
            </label>
            <div className="relative">
              <select
                id="subsistema"
                name="subsistema"
                value={filters.subsistema}
                onChange={handleFilterChange}
                className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 rounded-md dark:bg-gray-700 dark:text-white"
                disabled={!filters.eclusa}
              >
                <option value="">Todos os Subsistemas</option>
                {subsistemasList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Tipo Filter */}
          <div>
            <label htmlFor="tipo" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <div className="relative">
              <select
                id="tipo"
                name="tipo"
                value={filters.tipo}
                onChange={handleFilterChange}
                className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos os Tipos</option>
                <option value="Alarme">Alarme</option>
                <option value="Evento">Evento</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Ativo Filter */}
          <div>
            <label htmlFor="ativo" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <div className="relative">
              <select
                id="ativo"
                name="ativo"
                value={filters.ativo}
                onChange={handleFilterChange}
                className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {filteredDefinitions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma definição de falha encontrada</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || Object.values(filters).some(v => v !== '') 
              ? 'Nenhuma definição corresponde aos critérios de busca.'
              : 'Não há definições de falha cadastradas. Clique em "Nova Definição" para adicionar.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nome da Word
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descrição
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Local
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Endereço
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDefinitions.map((definition) => (
                <tr key={definition.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {definition.word_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-normal max-w-xs">
                    <div className="text-sm text-gray-500 dark:text-gray-300 truncate">
                      {definition.descricao}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {definition.eclusa}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {definition.subsistema}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300 font-mono">
                      DB{definition.db_number}.DBW{definition.byte_offset}.{definition.bit_offset}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      PLC: {plcs[definition.plc_id] || definition.plc_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      definition.tipo === 'Alarme' 
                        ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100' 
                        : 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100'
                    }`}>
                      {definition.tipo === 'Alarme' ? (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      {definition.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      definition.ativo 
                        ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                    }`}>
                      {definition.ativo ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Inativo
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      <Link
                        to={`/falhas/definicoes/${definition.id}/editar`}
                        className="text-gray-500 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => confirmDelete(definition)}
                        className="text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Definição de Falha"
        message={`Tem certeza que deseja excluir a definição de falha "${definitionToDelete?.word_name}"? Esta ação não pode ser desfeita.`}
        confirmButtonText="Excluir"
        cancelButtonText="Cancelar"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        icon={<AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />}
      />
    </div>
  );
};

export default FaultDefinitionsList;
// frontend/src/components/plc/FaultList.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  Filter,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { formatDateTime } from '../../utils/format';
import { FaultEvent } from '../../types/plc';
import plcApi from '../../services/plcApi';
import ErrorState from '../common/ErrorState';
import useNats from '../../hooks/useNats';

interface FaultListProps {
  activeOnly?: boolean;
  limitCount?: number;
  showFilters?: boolean;
  onFaultClick?: (fault: FaultEvent) => void;
}

const FaultList: React.FC<FaultListProps> = ({ 
  activeOnly = true, 
  limitCount,
  showFilters = true,
  onFaultClick
}) => {
  const [faults, setFaults] = useState<FaultEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [eclusa, setEclusa] = useState<string>('');
  const [subsistema, setSubsistema] = useState<string>('');
  const [eclusasList, setEclusasList] = useState<string[]>([]);
  const [subsistemasList, setSubsistemasList] = useState<string[]>([]);

  // NATS connection for real-time updates
  const { isConnected, connect, subscribe } = useNats();

  const fetchFaults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Active faults
      const response = await plcApi.getActiveFaults();
      
      if (response.data.sucesso) {
        setFaults(response.data.dados);
      } else {
        throw new Error(response.data.mensagem || 'Falha ao carregar falhas');
      }
      
      // Fetch filter options if needed
      if (showFilters) {
        await fetchFilterOptions();
      }
    } catch (err) {
      console.error('Erro ao carregar falhas:', err);
      setError('Não foi possível carregar a lista de falhas. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Get eclusas list
      const eclusasResponse = await plcApi.getEclusasList();
      if (eclusasResponse.data.sucesso) {
        setEclusasList(eclusasResponse.data.dados);
      }

      // Get subsistemas list if eclusa is selected
      if (eclusa) {
        const subsisResponse = await plcApi.getSubsistemasList(eclusa);
        if (subsisResponse.data.sucesso) {
          setSubsistemasList(subsisResponse.data.dados);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar opções de filtro:', err);
    }
  };

  // Load data on initial render
  useEffect(() => {
    fetchFaults();
  }, []);

  // Update subsystems when eclusa changes
  useEffect(() => {
    if (eclusa && showFilters) {
      const fetchSubsistemas = async () => {
        try {
          const response = await plcApi.getSubsistemasList(eclusa);
          if (response.data.sucesso) {
            setSubsistemasList(response.data.dados);
            setSubsistema(''); // Reset selected subsistema
          }
        } catch (err) {
          console.error('Erro ao carregar subsistemas:', err);
        }
      };
      
      fetchSubsistemas();
    } else {
      // Reset subsistemas if no eclusa selected
      setSubsistemasList([]);
      setSubsistema('');
    }
  }, [eclusa, showFilters]);

  // Connect to NATS for real-time updates
  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  // Subscribe to fault updates
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to fault updates
    const faultSub = subscribe('eclusa.falhas', (subject, message) => {
      if (message && message.data) {
        const faultEvent = message.data;
        
        setFaults(prevFaults => {
          // If the fault is active, add it or update it
          if (faultEvent.ativo) {
            // Check if the fault already exists
            const faultIndex = prevFaults.findIndex(f => f.id === faultEvent.id);
            
            if (faultIndex >= 0) {
              // Update existing fault
              const updatedFaults = [...prevFaults];
              updatedFaults[faultIndex] = {
                ...updatedFaults[faultIndex],
                ativo: faultEvent.ativo,
                inicio_timestamp: faultEvent.timestamp,
                reconhecido: faultEvent.reconhecido || false
              };
              return updatedFaults;
            } else {
              // Add new fault
              return [
                {
                  id: faultEvent.id,
                  plc_id: faultEvent.plc_id,
                  plc_nome: faultEvent.plc_nome,
                  word_name: faultEvent.word_name,
                  bit_offset: faultEvent.bit_offset,
                  eclusa: faultEvent.eclusa,
                  subsistema: faultEvent.subsistema,
                  descricao: faultEvent.descricao,
                  tipo: faultEvent.tipo,
                  ativo: true,
                  inicio_timestamp: faultEvent.timestamp,
                  reconhecido: false
                },
                ...prevFaults
              ];
            }
          } else if (activeOnly) {
            // If the fault is inactive and we're only showing active faults,
            // remove it from the list
            return prevFaults.filter(f => f.id !== faultEvent.id);
          } else {
            // Update fault state to inactive
            return prevFaults.map(f => 
              f.id === faultEvent.id 
                ? { ...f, ativo: false } 
                : f
            );
          }
        });
      }
    });

    // Subscribe to fault acknowledgements
    const ackSub = subscribe('eclusa.falhas.reconhecidas', (subject, message) => {
      if (message && message.data) {
        const { id, reconhecido, user_name } = message.data;
        
        if (reconhecido && id) {
          // Update fault acknowledgement state
          setFaults(prevFaults => 
            prevFaults.map(fault => 
              fault.id === id 
                ? { ...fault, reconhecido: true } 
                : fault
            )
          );
          
          toast.info(`Falha reconhecida por ${user_name || 'um usuário'}`);
        }
      }
    });
    
    // Cleanup subscriptions
    return () => {
      if (faultSub) faultSub.unsubscribe();
      if (ackSub) ackSub.unsubscribe();
    };
  }, [isConnected, subscribe, activeOnly]);

  const handleAcknowledge = async (faultId: number) => {
    try {
      const response = await plcApi.acknowledgeFault(faultId);
      
      if (response.data.sucesso) {
        // The fault state will be updated via NATS
        toast.success('Falha reconhecida com sucesso');
      } else {
        toast.error(response.data.mensagem || 'Falha ao reconhecer falha');
      }
    } catch (err) {
      console.error('Erro ao reconhecer falha:', err);
      toast.error('Ocorreu um erro ao reconhecer a falha');
    }
  };

  // Filter faults based on search and dropdown filters
  const filteredFaults = faults
    .filter(fault => 
      (fault.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
       fault.eclusa.toLowerCase().includes(searchTerm.toLowerCase()) ||
       fault.subsistema.toLowerCase().includes(searchTerm.toLowerCase()) ||
       fault.plc_nome.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(fault => !eclusa || fault.eclusa === eclusa)
    .filter(fault => !subsistema || fault.subsistema === subsistema);
  
  // Limit the number of faults if specified
  const displayFaults = limitCount ? filteredFaults.slice(0, limitCount) : filteredFaults;

  if (loading) {
    return (
      <div className="w-full h-40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState 
        message={error}
        onRetry={fetchFaults}
      />
    );
  }

  return (
    <div className="w-full">
      {showFilters && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
                placeholder="Buscar falhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={fetchFaults}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
              <label htmlFor="eclusa" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Eclusa
              </label>
              <div className="relative">
                <select
                  id="eclusa"
                  name="eclusa"
                  value={eclusa}
                  onChange={(e) => setEclusa(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
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
            
            <div className="w-full sm:w-1/2">
              <label htmlFor="subsistema" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subsistema
              </label>
              <div className="relative">
                <select
                  id="subsistema"
                  name="subsistema"
                  value={subsistema}
                  onChange={(e) => setSubsistema(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                  disabled={!eclusa}
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
          </div>
        </div>
      )}

      {displayFaults.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden p-8 text-center">
          <Bell className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma falha encontrada</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {activeOnly 
              ? 'Não há falhas ativas no momento.'
              : 'Nenhuma falha corresponde aos critérios de busca.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descrição
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Local
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Início
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {displayFaults.map((fault) => (
                <tr 
                  key={fault.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    fault.ativo && !fault.reconhecido 
                      ? 'animate-pulse-subtle bg-red-50 dark:bg-red-900/10' 
                      : ''
                  }`}
                  onClick={() => onFaultClick && onFaultClick(fault)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {fault.ativo ? (
                        fault.reconhecido ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Reconhecido
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Ativo
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolvido
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-normal">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {fault.descricao}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Tipo: {fault.tipo} | PLC: {fault.plc_nome}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {fault.eclusa}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {fault.subsistema}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {formatDateTime(fault.inicio_timestamp)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {fault.ativo && !fault.reconhecido && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledge(fault.id);
                        }}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Reconhecer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {limitCount && faults.length > limitCount && (
        <div className="mt-4 text-center">
          <button
            onClick={() => onFaultClick && onFaultClick({ id: 0 } as FaultEvent)}
            className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300"
          >
            Ver todas as {faults.length} falhas...
          </button>
        </div>
      )}
    </div>
  );
};

export default FaultList;
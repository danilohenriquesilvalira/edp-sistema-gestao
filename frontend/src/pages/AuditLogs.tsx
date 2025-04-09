import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, X, ChevronLeft, ChevronRight, Clock, 
  FileText, Calendar, User, Eye
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '@/services/api';
import { formatDateTime } from '@/utils/format';

interface AuditLog {
  id: number;
  utilizador_id: number;
  nome_utilizador: string;
  acao: string;
  modulo: string;
  ip: string;
  detalhes: string;
  criado_em: string;
}

interface AuditLogResponse {
  sucesso: boolean;
  dados: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

const AuditLogs: React.FC = () => {
  // Estados
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Paginação
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    utilizador_id: '',
    acao: '',
    modulo: '',
    data_inicio: '',
    data_fim: ''
  });
  
  // Listas para os filtros
  const [actions, setActions] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);

  // Carregar logs
  const loadLogs = async () => {
    setLoading(true);
    try {
      let queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      // Aplicar filtros
      if (filters.utilizador_id) {
        queryParams.append('utilizador_id', filters.utilizador_id);
      }
      
      if (filters.acao) {
        queryParams.append('acao', filters.acao);
      }
      
      if (filters.modulo) {
        queryParams.append('modulo', filters.modulo);
      }
      
      if (filters.data_inicio) {
        queryParams.append('data_inicio', filters.data_inicio);
      }
      
      if (filters.data_fim) {
        queryParams.append('data_fim', filters.data_fim);
      }
      
      const response = await apiService.request<AuditLogResponse>({
        url: `/api/auditoria?${queryParams.toString()}`,
        method: 'GET'
      });
      
      if (response.data.sucesso) {
        setLogs(response.data.dados);
        setTotalPages(response.data.meta.total_pages);
        setTotalLogs(response.data.meta.total);
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  // Carregar ações e módulos para os filtros
  const loadFilterOptions = async () => {
    try {
      const [actionsResponse, modulesResponse] = await Promise.all([
        apiService.getAuditActions(),
        apiService.getAuditModules()
      ]);
      
      if (actionsResponse.data.sucesso) {
        setActions(actionsResponse.data.dados);
      }
      
      if (modulesResponse.data.sucesso) {
        setModules(modulesResponse.data.dados);
      }
    } catch (error) {
      console.error('Erro ao carregar opções de filtro:', error);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadLogs();
    loadFilterOptions();
  }, [page, limit]);

  // Aplicar filtros
  const applyFilters = () => {
    setPage(1); // Voltar para a primeira página
    loadLogs();
  };

  // Resetar filtros
  const resetFilters = () => {
    setFilters({
      utilizador_id: '',
      acao: '',
      modulo: '',
      data_inicio: '',
      data_fim: ''
    });
    setPage(1);
    loadLogs();
  };

  // Ver detalhes de um log
  const viewLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  // Formatar detalhes do log (JSON)
  const formatDetails = (detailsString: string): React.ReactNode => {
    try {
      const details = JSON.parse(detailsString);
      return (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md overflow-x-auto">
          <pre className="text-xs">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      );
    } catch (error) {
      return <p className="text-gray-600 dark:text-gray-300">{detailsString || 'Sem detalhes'}</p>;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Logs de Auditoria</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Visualize as atividades realizadas no sistema.
        </p>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }} 
            className="relative flex-1"
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar por nome de utilizador..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-edp-primary-purple focus:border-edp-primary-purple bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          
          <div className="flex gap-2">
            <button
              className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </button>
            
            {(filters.utilizador_id || filters.acao || filters.modulo || filters.data_inicio || filters.data_fim) && (
              <button
                className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                onClick={resetFilters}
              >
                <X className="mr-2 h-4 w-4" />
                Limpar
              </button>
            )}
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID do Utilizador
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-edp-primary-purple focus:border-edp-primary-purple"
                value={filters.utilizador_id}
                onChange={(e) => setFilters({...filters, utilizador_id: e.target.value})}
                placeholder="ID do utilizador"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ação
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-edp-primary-purple focus:border-edp-primary-purple"
                value={filters.acao}
                onChange={(e) => setFilters({...filters, acao: e.target.value})}
              >
                <option value="">Todas as ações</option>
                {actions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Módulo
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-edp-primary-purple focus:border-edp-primary-purple"
                value={filters.modulo}
                onChange={(e) => setFilters({...filters, modulo: e.target.value})}
              >
                <option value="">Todos os módulos</option>
                {modules.map((module) => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Início
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-edp-primary-purple focus:border-edp-primary-purple"
                value={filters.data_inicio}
                onChange={(e) => setFilters({...filters, data_inicio: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-edp-primary-purple focus:border-edp-primary-purple"
                value={filters.data_fim}
                onChange={(e) => setFilters({...filters, data_fim: e.target.value})}
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-edp-primary-purple text-white rounded-md hover:bg-edp-primary-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-edp-primary-purple"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de logs */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Utilizador
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ação
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Módulo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  IP
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-edp-primary-purple"></div>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhum log de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-edp-primary-purple flex items-center justify-center text-white">
                          <User size={16} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.nome_utilizador}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {log.utilizador_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {log.acao}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {log.modulo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDateTime(log.criado_em)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => viewLogDetails(log)}
                        className="text-edp-primary-purple dark:text-edp-primary-blue hover:text-edp-primary-blue dark:hover:text-edp-primary-green"
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginação */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="mb-4 sm:mb-0 text-sm text-gray-700 dark:text-gray-300">
              Mostrando {logs.length} de {totalLogs} logs
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-md border ${
                  page === 1 
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                } text-sm font-medium text-gray-500 dark:text-gray-400`}
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Página {page} de {totalPages}
              </span>
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-md border ${
                  page === totalPages 
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                } text-sm font-medium text-gray-500 dark:text-gray-400`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalhes */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Detalhes do Log
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                  onClick={() => setShowDetails(false)}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Utilizador</h4>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedLog.nome_utilizador} (ID: {selectedLog.utilizador_id})</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ação / Módulo</h4>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedLog.acao} / {selectedLog.modulo}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Data e Hora</h4>
                    <p className="text-sm text-gray-900 dark:text-white">{formatDateTime(selectedLog.criado_em)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2 mt-1" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Detalhes</h4>
                    {formatDetails(selectedLog.detalhes)}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-edp-primary-purple text-white rounded-md hover:bg-edp-primary-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-edp-primary-purple"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
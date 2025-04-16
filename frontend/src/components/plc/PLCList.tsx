// frontend/src/components/plc/PLCList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Server, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Check, 
  X,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import ConfirmationModal from '../common/ConfirmationModal';
import { formatDateTime } from '../../utils/format';
import { PLC } from '../../types/plc';
import plcApi from '../../services/plcApi';
import ErrorState from '../common/ErrorState';

interface PLCListProps {
  onRefresh?: () => void;
}

const PLCList: React.FC<PLCListProps> = ({ onRefresh }) => {
  const [plcs, setPlcs] = useState<PLC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [plcToDelete, setPlcToDelete] = useState<PLC | null>(null);

  const fetchPLCs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await plcApi.getAllPLCs();
      
      if (response.data.sucesso) {
        setPlcs(response.data.dados);
      } else {
        throw new Error(response.data.mensagem || 'Falha ao carregar PLCs');
      }
    } catch (err) {
      console.error('Erro ao carregar PLCs:', err);
      setError('Não foi possível carregar a lista de PLCs. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPLCs();
  }, []);

  const handleDelete = async () => {
    if (!plcToDelete) return;
    
    try {
      const response = await plcApi.deletePLC(plcToDelete.id);
      
      if (response.data.sucesso) {
        toast.success('PLC excluído com sucesso');
        fetchPLCs();
        if (onRefresh) onRefresh();
      } else {
        toast.error(response.data.mensagem || 'Falha ao excluir PLC');
      }
    } catch (err) {
      console.error('Erro ao excluir PLC:', err);
      toast.error('Ocorreu um erro ao excluir o PLC. Por favor, tente novamente.');
    } finally {
      setDeleteModalOpen(false);
      setPlcToDelete(null);
    }
  };

  const confirmDelete = (plc: PLC) => {
    setPlcToDelete(plc);
    setDeleteModalOpen(true);
  };

  const filteredPLCs = plcs.filter(plc => 
    plc.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    plc.ip_address.includes(searchTerm)
  );

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
        onRetry={fetchPLCs}
      />
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
            placeholder="Buscar por nome ou IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link
          to="/plcs/novo"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo PLC
        </Link>
      </div>

      {filteredPLCs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden p-8 text-center">
          <Server className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum PLC encontrado</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Nenhum PLC corresponde à sua busca. Tente com termos diferentes.' : 'Não há PLCs cadastrados. Clique em "Novo PLC" para adicionar.'}
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
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Endereço IP
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rack/Slot
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Última Leitura
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ativo
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPLCs.map((plc) => (
                <tr key={plc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {plc.conectado ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                          <div className="h-2 w-2 mr-1 bg-green-500 dark:bg-green-400 rounded-full"></div>
                          Conectado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100">
                          <div className="h-2 w-2 mr-1 bg-red-500 dark:bg-red-400 rounded-full"></div>
                          Desconectado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {plc.nome}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {plc.ip_address}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {plc.rack} / {plc.slot}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {plc.ultima_leitura ? formatDateTime(plc.ultima_leitura) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      plc.ativo 
                        ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                    }`}>
                      {plc.ativo ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Sim
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Não
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      <Link
                        to={`/plcs/${plc.id}`}
                        className="text-gray-500 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400"
                        title="Visualizar detalhes"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                      <Link
                        to={`/plcs/${plc.id}/editar`}
                        className="text-gray-500 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => confirmDelete(plc)}
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
        title="Excluir PLC"
        message={`Tem certeza que deseja excluir o PLC "${plcToDelete?.nome}"? Esta ação não pode ser desfeita e excluirá também todas as tags associadas.`}
        confirmButtonText="Excluir"
        cancelButtonText="Cancelar"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        icon={<AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />}
      />
    </div>
  );
};

export default PLCList;
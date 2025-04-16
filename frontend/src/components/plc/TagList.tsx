// frontend/src/components/plc/TagList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Edit, 
  Trash2, 
  Search, 
  AlertCircle,
  RefreshCw,
  CheckCircle,
  X,
  Clock,
  Pencil,
  Play,
} from 'lucide-react';
import ConfirmationModal from '../common/ConfirmationModal';
import { formatDateTime } from '../../utils/format';
import { Tag } from '../../types/plc';
import plcApi from '../../services/plcApi';
import ErrorState from '../common/ErrorState';
import useNats from '../../hooks/useNats';
import TagValueModal from '../plc/TagValueModal';  // Updated import path

interface TagListProps {
  plcId: number;
}

const TagList: React.FC<TagListProps> = ({ plcId }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  // NATS connection for real-time updates
  const { isConnected, connect, subscribe } = useNats();

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await plcApi.getPLCTags(plcId);
      
      if (response.data.sucesso) {
        setTags(response.data.dados);
      } else {
        throw new Error(response.data.mensagem || 'Falha ao carregar tags');
      }
    } catch (err) {
      console.error('Erro ao carregar tags:', err);
      setError('Não foi possível carregar a lista de tags. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [plcId]);

  // Connect to NATS when component mounts
  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  // Subscribe to tag value updates
  useEffect(() => {
    if (!isConnected) return;

    const plcTagsSubject = `plc.tags.updates.${plcId}`;
    
    const sub = subscribe(plcTagsSubject, (subject, message) => {
      // Update tag value in the local state
      if (message && message.data) {
        const tagId = message.data.tag_id;
        
        setTags(prevTags => 
          prevTags.map(tag => {
            if (tag.id === tagId) {
              return {
                ...tag,
                ultimo_valor: message.data.valor,
                ultima_leitura: message.data.timestamp
              };
            }
            return tag;
          })
        );
      }
    });
    
    // Cleanup subscription
    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [isConnected, plcId, subscribe]);

  const handleDelete = async () => {
    if (!tagToDelete) return;
    
    try {
      const response = await plcApi.deleteTag(tagToDelete.id);
      
      if (response.data.sucesso) {
        toast.success('Tag excluída com sucesso');
        fetchTags();
      } else {
        toast.error(response.data.mensagem || 'Falha ao excluir tag');
      }
    } catch (err) {
      console.error('Erro ao excluir tag:', err);
      toast.error('Ocorreu um erro ao excluir a tag. Por favor, tente novamente.');
    } finally {
      setDeleteModalOpen(false);
      setTagToDelete(null);
    }
  };

  const confirmDelete = (tag: Tag) => {
    setTagToDelete(tag);
    setDeleteModalOpen(true);
  };

  const openValueModal = (tag: Tag) => {
    setSelectedTag(tag);
    setValueModalOpen(true);
  };

  const formatTagValue = (tag: Tag): string => {
    if (tag.ultimo_valor === undefined || tag.ultimo_valor === null) {
      return 'N/A';
    }
    
    switch (tag.tipo) {
      case 'Bool':
        return tag.ultimo_valor ? 'True' : 'False';
      case 'Real':
        return typeof tag.ultimo_valor === 'number' ? tag.ultimo_valor.toFixed(2) : String(tag.ultimo_valor);
      default:
        return String(tag.ultimo_valor);
    }
  };

  const filteredTags = tags.filter(tag => 
    tag.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (tag.subsistema && tag.subsistema.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        onRetry={fetchTags}
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
            placeholder="Buscar por nome ou subsistema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={fetchTags}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </button>
      </div>

      {filteredTags.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden p-8 text-center">
          <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma tag encontrada</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Nenhuma tag corresponde à sua busca. Tente com termos diferentes.' : 'Não há tags cadastradas para este PLC.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Endereço
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valor Atual
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
              {filteredTags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {tag.nome}
                    </div>
                    {tag.subsistema && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {tag.subsistema}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      DB{tag.db_number}.DBW{tag.byte_offset}
                      {tag.bit_offset !== undefined && `.${tag.bit_offset}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {tag.tipo}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white font-mono">
                      {formatTagValue(tag)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {tag.ultima_leitura ? formatDateTime(tag.ultima_leitura) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tag.ativo 
                        ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                    }`}>
                      {tag.ativo ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
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
                      <button
                        onClick={() => openValueModal(tag)}
                        className="text-gray-500 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400"
                        title="Ler/Escrever Valor"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                      <Link
                        to={`/plcs/${plcId}/tags/${tag.id}/editar`}
                        className="text-gray-500 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => confirmDelete(tag)}
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
        title="Excluir Tag"
        message={`Tem certeza que deseja excluir a tag "${tagToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmButtonText="Excluir"
        cancelButtonText="Cancelar"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        icon={<AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />}
      />

      {selectedTag && (
        <TagValueModal
          isOpen={valueModalOpen}
          onClose={() => setValueModalOpen(false)}
          tag={selectedTag}
        />
      )}
    </div>
  );
};

export default TagList;
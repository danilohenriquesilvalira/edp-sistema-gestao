import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, Settings, 
  Save, X, RefreshCw, AlertTriangle 
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '@/services/api';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { formatDateTime } from '@/utils/format';

interface ConfigItem {
  id: number;
  chave: string;
  valor: string;
  descricao: string;
  atualizado_em: string;
}

const SystemConfig: React.FC = () => {
  // Estados para a lista de configurações
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredConfigs, setFilteredConfigs] = useState<ConfigItem[]>([]);
  
  // Estados para manipulação de configurações
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    chave: '',
    valor: '',
    descricao: ''
  });
  
  // Estado para modal de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<ConfigItem | null>(null);
  
  // Estado para processo de salvar
  const [isSaving, setIsSaving] = useState(false);

  // Carregar configurações
  const loadConfigs = async () => {
    setLoading(true);
    try {
      const response = await apiService.getConfigs();
      
      if (response.data.sucesso) {
        setConfigs(response.data.dados);
        setFilteredConfigs(response.data.dados);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações do sistema');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadConfigs();
  }, []);

  // Filtrar configurações quando a pesquisa mudar
  useEffect(() => {
    if (!search.trim()) {
      setFilteredConfigs(configs);
      return;
    }
    
    const searchLower = search.toLowerCase();
    const filtered = configs.filter(
      (config) => 
        config.chave.toLowerCase().includes(searchLower) || 
        config.descricao.toLowerCase().includes(searchLower)
    );
    
    setFilteredConfigs(filtered);
  }, [search, configs]);

  // Iniciar criação de nova configuração
  const handleCreate = () => {
    setFormData({
      id: 0,
      chave: '',
      valor: '',
      descricao: ''
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  // Iniciar edição de configuração existente
  const handleEdit = (config: ConfigItem) => {
    setFormData({
      id: config.id,
      chave: config.chave,
      valor: config.valor,
      descricao: config.descricao
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  // Iniciar exclusão de configuração
  const handleDelete = (config: ConfigItem) => {
    setConfigToDelete(config);
    setIsDeleteModalOpen(true);
  };

  // Confirmar exclusão de configuração
  const confirmDelete = async () => {
    if (!configToDelete) return;
    
    try {
      const response = await apiService.deleteConfig(configToDelete.id);
      
      if (response.data.sucesso) {
        toast.success('Configuração excluída com sucesso');
        loadConfigs(); // Recarregar lista
      }
    } catch (error) {
      console.error('Erro ao excluir configuração:', error);
      toast.error('Erro ao excluir configuração');
    } finally {
      setIsDeleteModalOpen(false);
      setConfigToDelete(null);
    }
  };

  // Manipular mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Cancelar formulário
  const cancelForm = () => {
    setIsCreating(false);
    setIsEditing(false);
    setFormData({
      id: 0,
      chave: '',
      valor: '',
      descricao: ''
    });
  };

  // Validar formulário
  const validateForm = (): boolean => {
    if (!formData.chave.trim()) {
      toast.error('A chave é obrigatória');
      return false;
    }
    
    if (!formData.valor.trim()) {
      toast.error('O valor é obrigatório');
      return false;
    }
    
    return true;
  };

  // Salvar configuração (criar ou atualizar)
  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      let response;
      
      if (isCreating) {
        // Criar nova configuração
        response = await apiService.createConfig({
          chave: formData.chave,
          valor: formData.valor,
          descricao: formData.descricao
        });
        
        if (response.data.sucesso) {
          toast.success('Configuração criada com sucesso');
        }
      } else if (isEditing) {
        // Atualizar configuração existente
        response = await apiService.updateConfig(formData.id, {
          chave: formData.chave,
          valor: formData.valor,
          descricao: formData.descricao
        });
        
        if (response.data.sucesso) {
          toast.success('Configuração atualizada com sucesso');
        }
      }
      
      // Recarregar lista e fechar formulário
      await loadConfigs();
      cancelForm();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações do Sistema</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Gerencie as configurações globais do sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            className="bg-edp-primary-purple hover:bg-edp-primary-purple/90 text-white py-2 px-4 rounded-md flex items-center transition-colors"
            onClick={handleCreate}
            disabled={isCreating || isEditing}
          >
            <Plus className="mr-2 h-5 w-5" />
            Nova Configuração
          </button>
        </div>
      </div>

      {/* Formulário de criação/edição */}
      {(isCreating || isEditing) && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {isCreating ? 'Nova Configuração' : 'Editar Configuração'}
            </h2>
            <button 
              onClick={cancelForm}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={saveConfig} className="space-y-4">
            <div>
              <label htmlFor="chave" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chave
              </label>
              <input
                id="chave"
                name="chave"
                type="text"
                value={formData.chave}
                onChange={handleChange}
                className="w-full rounded-md shadow-sm focus:ring-edp-primary-purple focus:border-edp-primary-purple border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isEditing} // Não permitir edição da chave quando estiver editando
                required
              />
            </div>
            
            <div>
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor
              </label>
              <input
                id="valor"
                name="valor"
                type="text"
                value={formData.valor}
                onChange={handleChange}
                className="w-full rounded-md shadow-sm focus:ring-edp-primary-purple focus:border-edp-primary-purple border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md shadow-sm focus:ring-edp-primary-purple focus:border-edp-primary-purple border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={cancelForm}
                className="mr-4 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-edp-primary-purple hover:bg-edp-primary-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-edp-primary-purple flex items-center"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de pesquisa */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar configurações..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-edp-primary-purple focus:border-edp-primary-purple bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de configurações */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Chave
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descrição
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Atualizado em
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-edp-primary-purple"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {search ? 'Nenhuma configuração encontrada para esta pesquisa.' : 'Nenhuma configuração cadastrada.'}
                  </td>
                </tr>
              ) : (
                filteredConfigs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Settings className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {config.chave}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {config.valor}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {config.descricao || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDateTime(config.atualizado_em)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(config)}
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300"
                          title="Editar"
                          disabled={isCreating || isEditing}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(config)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Excluir"
                          disabled={isCreating || isEditing}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmação para exclusão */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Configuração"
        message={`Tem certeza que deseja excluir a configuração "${configToDelete?.chave}"? Esta ação não pode ser desfeita.`}
        confirmButtonText="Excluir"
        cancelButtonText="Cancelar"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        icon={<AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />}
      />
    </div>
  );
};

export default SystemConfig;
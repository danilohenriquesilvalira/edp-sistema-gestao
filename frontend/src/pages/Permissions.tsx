import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, 
  Save, X, RefreshCw, AlertTriangle, 
  Shield, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '@/services/api';
import ConfirmationModal from '@/components/common/ConfirmationModal';

interface Permission {
  id: number;
  nome: string;
  descricao: string;
  modulo: string;
  acao: string;
}

interface ProfilePermissionState {
  Administrador: number[];
  Utilizador: number[];
}

const Permissions: React.FC = () => {
  // Estados para gerenciar permissões
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([]);
  
  // Estados para o formulário
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    nome: '',
    descricao: '',
    modulo: '',
    acao: ''
  });
  
  // Estado para o modal de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);
  
  // Estado para o processo de salvar
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para atribuição de permissões a perfis
  const [profilePermissions, setProfilePermissions] = useState<ProfilePermissionState>({
    Administrador: [],
    Utilizador: []
  });
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [activeProfile, setActiveProfile] = useState<'Administrador' | 'Utilizador'>('Administrador');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showProfileTab, setShowProfileTab] = useState(false);

  // Carregar permissões
  const loadPermissions = async () => {
    setLoading(true);
    try {
      const response = await apiService.getPermissions();
      
      if (response.data.sucesso) {
        const perms = response.data.dados;
        setPermissions(perms);
        setFilteredPermissions(perms);
        
        // Extrair módulos únicos
        const modules = [...new Set(perms.map(p => p.modulo))];
        setAvailableModules(modules);
        
        // Inicializar estados de expansão
        const expanded: Record<string, boolean> = {};
        modules.forEach(module => {
          expanded[module] = true;
        });
        setExpandedModules(expanded);
      }
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast.error('Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  };

  // Carregar permissões do perfil
  const loadProfilePermissions = async (profile: 'Administrador' | 'Utilizador') => {
    try {
      const response = await apiService.getProfilePermissions(profile);
      
      if (response.data.sucesso) {
        const permIds = response.data.dados.map((p: Permission) => p.id);
        setProfilePermissions(prev => ({
          ...prev,
          [profile]: permIds
        }));
      }
    } catch (error) {
      console.error(`Erro ao carregar permissões do perfil ${profile}:`, error);
      toast.error(`Erro ao carregar permissões do perfil ${profile}`);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadPermissions();
    loadProfilePermissions('Administrador');
    loadProfilePermissions('Utilizador');
  }, []);

  // Filtrar permissões quando a pesquisa mudar
  useEffect(() => {
    if (!search.trim()) {
      setFilteredPermissions(permissions);
      return;
    }
    
    const searchLower = search.toLowerCase();
    const filtered = permissions.filter(
      (permission) => 
        permission.nome.toLowerCase().includes(searchLower) || 
        permission.descricao.toLowerCase().includes(searchLower) ||
        permission.modulo.toLowerCase().includes(searchLower) ||
        permission.acao.toLowerCase().includes(searchLower)
    );
    
    setFilteredPermissions(filtered);
  }, [search, permissions]);

  // Iniciar criação de nova permissão
  const handleCreate = () => {
    setFormData({
      id: 0,
      nome: '',
      descricao: '',
      modulo: '',
      acao: ''
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  // Iniciar edição de permissão existente
  const handleEdit = (permission: Permission) => {
    setFormData({
      id: permission.id,
      nome: permission.nome,
      descricao: permission.descricao,
      modulo: permission.modulo,
      acao: permission.acao
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  // Iniciar exclusão de permissão
  const handleDelete = (permission: Permission) => {
    setPermissionToDelete(permission);
    setIsDeleteModalOpen(true);
  };

  // Confirmar exclusão de permissão
  const confirmDelete = async () => {
    if (!permissionToDelete) return;
    
    try {
      const response = await apiService.deletePermission(permissionToDelete.id);
      
      if (response.data.sucesso) {
        toast.success('Permissão excluída com sucesso');
        loadPermissions(); // Recarregar lista
        
        // Recarregar permissões dos perfis
        loadProfilePermissions('Administrador');
        loadProfilePermissions('Utilizador');
      }
    } catch (error) {
      console.error('Erro ao excluir permissão:', error);
      toast.error('Erro ao excluir permissão');
    } finally {
      setIsDeleteModalOpen(false);
      setPermissionToDelete(null);
    }
  };

  // Manipular mudanças no formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      nome: '',
      descricao: '',
      modulo: '',
      acao: ''
    });
  };

  // Validar formulário
  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      toast.error('O nome é obrigatório');
      return false;
    }
    
    if (!formData.modulo.trim()) {
      toast.error('O módulo é obrigatório');
      return false;
    }
    
    if (!formData.acao.trim()) {
      toast.error('A ação é obrigatória');
      return false;
    }
    
    return true;
  };

  // Salvar permissão (criar ou atualizar)
  const savePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      let response;
      
      if (isCreating) {
        // Criar nova permissão
        response = await apiService.createPermission({
          nome: formData.nome,
          descricao: formData.descricao,
          modulo: formData.modulo,
          acao: formData.acao
        });
        
        if (response.data.sucesso) {
          toast.success('Permissão criada com sucesso');
        }
      } else if (isEditing) {
        // Atualizar permissão existente
        response = await apiService.updatePermission(formData.id, {
          nome: formData.nome,
          descricao: formData.descricao,
          modulo: formData.modulo,
          acao: formData.acao
        });
        
        if (response.data.sucesso) {
          toast.success('Permissão atualizada com sucesso');
        }
      }
      
      // Recarregar lista e fechar formulário
      await loadPermissions();
      cancelForm();
    } catch (error) {
      console.error('Erro ao salvar permissão:', error);
      toast.error('Erro ao salvar permissão');
    } finally {
      setIsSaving(false);
    }
  };

  // Alternar permissão de perfil
  const toggleProfilePermission = (permissionId: number) => {
    setProfilePermissions(prev => {
      const currentPermissions = [...prev[activeProfile]];
      
      if (currentPermissions.includes(permissionId)) {
        // Remover permissão
        return {
          ...prev,
          [activeProfile]: currentPermissions.filter(id => id !== permissionId)
        };
      } else {
        // Adicionar permissão
        return {
          ...prev,
          [activeProfile]: [...currentPermissions, permissionId]
        };
      }
    });
  };

  // Expandir/colapsar módulo
  const toggleModule = (module: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [module]: !prev[module]
    }));
  };

  // Selecionar/desselecionar todas as permissões de um módulo
  const toggleModulePermissions = (module: string) => {
    const modulePermissions = permissions.filter(p => p.modulo === module).map(p => p.id);
    const currentPermissions = profilePermissions[activeProfile];
    
    // Verificar se todas as permissões do módulo já estão selecionadas
    const allSelected = modulePermissions.every(id => currentPermissions.includes(id));
    
    if (allSelected) {
      // Remover todas as permissões do módulo
      setProfilePermissions(prev => ({
        ...prev,
        [activeProfile]: currentPermissions.filter(id => !modulePermissions.includes(id))
      }));
    } else {
      // Adicionar todas as permissões do módulo
      const newPermissions = [...currentPermissions];
      modulePermissions.forEach(id => {
        if (!newPermissions.includes(id)) {
          newPermissions.push(id);
        }
      });
      
      setProfilePermissions(prev => ({
        ...prev,
        [activeProfile]: newPermissions
      }));
    }
  };

  // Salvar permissões do perfil
  const saveProfilePermissions = async () => {
    setIsSavingProfile(true);
    
    try {
      const response = await apiService.setProfilePermissions(
        activeProfile, 
        profilePermissions[activeProfile]
      );
      
      if (response.data.sucesso) {
        toast.success(`Permissões do perfil ${activeProfile} atualizadas com sucesso`);
        
        // Recarregar permissões do perfil para confirmar
        await loadProfilePermissions(activeProfile);
      }
    } catch (error) {
      console.error('Erro ao salvar permissões do perfil:', error);
      toast.error('Erro ao salvar permissões do perfil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Permissões</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Gerencie as permissões do sistema e atribua a perfis de utilizadores
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          {!showProfileTab && (
            <button
              className="bg-edp-primary-purple hover:bg-edp-primary-purple/90 text-white py-2 px-4 rounded-md flex items-center transition-colors"
              onClick={handleCreate}
              disabled={isCreating || isEditing}
            >
              <Plus className="mr-2 h-5 w-5" />
              Nova Permissão
            </button>
          )}
          <button
            className={`py-2 px-4 rounded-md flex items-center transition-colors ${
              showProfileTab 
                ? 'bg-white dark:bg-gray-800 text-edp-primary-purple dark:text-edp-primary-blue border border-edp-primary-purple dark:border-edp-primary-blue'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setShowProfileTab(!showProfileTab)}
          >
            <Shield className="mr-2 h-5 w-5" />
            {showProfileTab ? 'Listar Permissões' : 'Atribuir a Perfis'}
          </button>
        </div>
      </div>

      {/* Alternância entre abas */}
      {showProfileTab ? (
        /* Aba de atribuição de permissões a perfis */
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                className={`px-4 py-3 border-b-2 font-medium text-sm ${
                  activeProfile === 'Administrador'
                    ? 'border-edp-primary-purple text-edp-primary-purple dark:text-edp-primary-blue dark:border-edp-primary-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setActiveProfile('Administrador')}
              >
                Perfil Administrador
              </button>
              <button
                className={`px-4 py-3 border-b-2 font-medium text-sm ${
                  activeProfile === 'Utilizador'
                    ? 'border-edp-primary-purple text-edp-primary-purple dark:text-edp-primary-blue dark:border-edp-primary-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setActiveProfile('Utilizador')}
              >
                Perfil Utilizador
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-edp-primary-purple"></div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    Selecione as permissões que deseja atribuir ao perfil <strong>{activeProfile}</strong>.
                  </p>
                </div>
                
                {availableModules.map(module => {
                  const modulePermissions = permissions.filter(p => p.modulo === module);
                  const selectedCount = modulePermissions.filter(p => 
                    profilePermissions[activeProfile].includes(p.id)
                  ).length;
                  const allSelected = selectedCount === modulePermissions.length;
                  const someSelected = selectedCount > 0 && selectedCount < modulePermissions.length;
                  
                  return (
                    <div key={module} className="mb-4 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                      <div 
                        className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => toggleModule(module)}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => toggleModulePermissions(module)}
                            className={`h-4 w-4 text-edp-primary-purple focus:ring-edp-primary-purple border-gray-300 dark:border-gray-600 rounded ${
                              someSelected ? 'bg-indigo-200 dark:bg-indigo-900' : ''
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="ml-2 font-medium text-gray-800 dark:text-gray-200">
                            {module} {selectedCount > 0 && `(${selectedCount}/${modulePermissions.length})`}
                          </span>
                        </div>
                        {expandedModules[module] ? (
                          <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                      
                      {expandedModules[module] && (
                        <div className="px-4 py-2 divide-y divide-gray-200 dark:divide-gray-700">
                          {modulePermissions.map(permission => (
                            <div key={permission.id} className="py-2 pl-6">
                              <label className="flex items-start">
                                <input
                                  type="checkbox"
                                  checked={profilePermissions[activeProfile].includes(permission.id)}
                                  onChange={() => toggleProfilePermission(permission.id)}
                                  className="h-4 w-4 mt-1 text-edp-primary-purple focus:ring-edp-primary-purple border-gray-300 dark:border-gray-600 rounded"
                                />
                                <span className="ml-2">
                                  <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {permission.nome}
                                  </span>
                                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                                    {permission.descricao || permission.acao}
                                  </span>
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveProfilePermissions}
                    disabled={isSavingProfile}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-edp-primary-purple hover:bg-edp-primary-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-edp-primary-purple flex items-center"
                  >
                    {isSavingProfile ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Permissões
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Aba de gestão de permissões */
        <>
          {/* Formulário de criação/edição */}
          {(isCreating || isEditing) && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  {isCreating ? 'Nova Permissão' : 'Editar Permissão'}
                </h2>
                <button 
                  onClick={cancelForm}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={savePermission} className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome
                  </label>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    value={formData.nome}
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
                    rows={2}
                    className="w-full rounded-md shadow-sm focus:ring-edp-primary-purple focus:border-edp-primary-purple border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="modulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Módulo
                    </label>
                    <input
                      id="modulo"
                      name="modulo"
                      type="text"
                      value={formData.modulo}
                      onChange={handleChange}
                      className="w-full rounded-md shadow-sm focus:ring-edp-primary-purple focus:border-edp-primary-purple border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                      list="modulos"
                    />
                    <datalist id="modulos">
                      {availableModules.map(module => (
                        <option key={module} value={module} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div>
                    <label htmlFor="acao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ação
                    </label>
                    <input
                      id="acao"
                      name="acao"
                      type="text"
                      value={formData.acao}
                      onChange={handleChange}
                      className="w-full rounded-md shadow-sm focus:ring-edp-primary-purple focus:border-edp-primary-purple border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
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
                placeholder="Pesquisar permissões..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-edp-primary-purple focus:border-edp-primary-purple bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de permissões */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Módulo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ação
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Descrição
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
                  ) : filteredPermissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        {search ? 'Nenhuma permissão encontrada para esta pesquisa.' : 'Nenhuma permissão cadastrada.'}
                      </td>
                    </tr>
                  ) : (
                    filteredPermissions.map((permission) => (
                      <tr key={permission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Shield className="h-5 w-5 text-gray-400 mr-3" />
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {permission.nome}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {permission.modulo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {permission.acao}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {permission.descricao || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(permission)}
                              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300"
                              title="Editar"
                              disabled={isCreating || isEditing}
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(permission)}
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
        </>
      )}

      {/* Modal de confirmação para exclusão */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Permissão"
        message={`Tem certeza que deseja excluir a permissão "${permissionToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmButtonText="Excluir"
        cancelButtonText="Cancelar"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        icon={<AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />}
      />
    </div>
  );
};

export default Permissions;
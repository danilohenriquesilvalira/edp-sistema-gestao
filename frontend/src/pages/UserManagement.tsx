import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { toast } from 'react-toastify';
import { 
  Search, Plus, Edit, Trash2, Eye, Filter, X, Check, ChevronLeft, ChevronRight 
} from 'lucide-react';
import UserFormModal from '@/components/users/UserFormModal';
import UserDetailsModal from '@/components/users/UserDetailsModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { User } from '@/contexts/AuthContext';

interface UserListResponse {
  sucesso: boolean;
  dados: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

const UserManagement: React.FC = () => {
  // Estados
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    perfil: '',
    estado: ''
  });
  
  // Estados para modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Carregar usuários
  const loadUsers = async () => {
    setLoading(true);
    try {
      let queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (search) {
        queryParams.append('nome', search);
      }
      
      if (filters.perfil) {
        queryParams.append('perfil', filters.perfil);
      }
      
      if (filters.estado) {
        queryParams.append('estado', filters.estado);
      }
      
      const response = await api.get<UserListResponse>(`/api/utilizadores?${queryParams.toString()}`);
      
      if (response.data.sucesso) {
        setUsers(response.data.dados);
        setTotalPages(response.data.meta.total_pages);
        setTotalUsers(response.data.meta.total);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar a lista de usuários');
    } finally {
      setLoading(false);
    }
  };

  // Carregar usuários ao iniciar e quando as dependências mudarem
  useEffect(() => {
    loadUsers();
  }, [page, limit, filters]);

  // Pesquisar quando o usuário pressionar Enter
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Resetar para a primeira página
    loadUsers();
  };

  // Resetar filtros
  const resetFilters = () => {
    setFilters({
      perfil: '',
      estado: ''
    });
    setSearch('');
    setPage(1);
  };

  // Abrir modal de criação
  const handleCreate = () => {
    setSelectedUser(null);
    setIsCreateModalOpen(true);
  };

  // Abrir modal de edição
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // Abrir modal de visualização
  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  // Abrir modal de exclusão
  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Confirmar exclusão de usuário
  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await api.delete(`/api/utilizadores/${selectedUser.id}`);
      
      if (response.data.sucesso) {
        toast.success('Utilizador excluído com sucesso');
        loadUsers();
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir utilizador');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  // Após salvar usuário (criar ou editar)
  const handleUserSaved = () => {
    loadUsers();
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Utilizadores</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Gerencie os utilizadores do sistema.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center transition-colors"
            onClick={handleCreate}
          >
            <Plus className="mr-2 h-5 w-5" />
            Novo Utilizador
          </button>
        </div>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar por nome ou email..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            
            {(filters.perfil || filters.estado) && (
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
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Perfil
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                value={filters.perfil}
                onChange={(e) => setFilters({...filters, perfil: e.target.value})}
              >
                <option value="">Todos</option>
                <option value="Administrador">Administrador</option>
                <option value="Utilizador">Utilizador</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500"
                value={filters.estado}
                onChange={(e) => setFilters({...filters, estado: e.target.value})}
              >
                <option value="">Todos</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de usuários */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Perfil
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
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
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-600"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhum utilizador encontrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.foto_perfil ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={user.foto_perfil} alt={user.nome} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                              {user.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.nome}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.perfil === 'Administrador' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {user.perfil}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.estado === 'Ativo' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleView(user)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="Ver detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Excluir"
                          disabled={user.perfil === 'Administrador'} // Impedir exclusão de administradores
                          style={{ opacity: user.perfil === 'Administrador' ? 0.5 : 1 }}
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
        
        {/* Paginação */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="mb-4 sm:mb-0 text-sm text-gray-700 dark:text-gray-300">
              Mostrando {users.length} de {totalUsers} utilizadores
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

      {/* Modais */}
      {isCreateModalOpen && (
        <UserFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleUserSaved}
        />
      )}
      
      {isEditModalOpen && selectedUser && (
        <UserFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleUserSaved}
          user={selectedUser}
        />
      )}
      
      {isViewModalOpen && selectedUser && (
        <UserDetailsModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          user={selectedUser}
        />
      )}
      
      {isDeleteModalOpen && selectedUser && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Excluir Utilizador"
          message={`Tem certeza que deseja excluir o utilizador "${selectedUser.nome}"? Esta ação não pode ser desfeita.`}
          confirmButtonText="Excluir"
          cancelButtonText="Cancelar"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
        />
      )}
    </div>
  );
};

export default UserManagement;
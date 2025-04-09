import React, { useState, useEffect } from 'react';
import api, { getAvatarUrl } from '@/services/api';
import { toast } from 'react-toastify';
import { User } from '@/contexts/AuthContext';
import { X, Edit, Shield, Clock, History } from 'lucide-react';
import axios, { AxiosError } from 'axios';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

interface UserSession {
  id: number;
  utilizador_id: number;
  ip: string;
  dispositivo: string;
  user_agent: string;
  criado_em: string;
  expira_em: string;
  ativa: boolean;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, user }) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'sessions'>('info');

  useEffect(() => {
    if (isOpen && user) {
      loadSessions();
    }
  }, [isOpen, user]);

  const loadSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await api.getUserSessions(user.id, true);
      if (response.data.sucesso) {
        setSessions(response.data.dados || []);
      } else {
        setSessions([]);
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar sessões:', error);
      setSessions([]);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response) {
          const statusCode = axiosError.response.status;
          
          if (statusCode === 403) {
            toast.error('Sem permissão para visualizar as sessões deste utilizador');
          } else if (statusCode === 404) {
            toast.error('Sessões não encontradas');
          } else if (axiosError.response.data && typeof axiosError.response.data === 'object' && 'mensagem' in axiosError.response.data) {
            toast.error(axiosError.response.data.mensagem as string);
          } else {
            toast.error('Erro ao carregar sessões do utilizador');
          }
        } else if (axiosError.request) {
          toast.error('Não foi possível conectar ao servidor');
        } else {
          toast.error('Erro ao carregar sessões do utilizador');
        }
      } else {
        toast.error('Erro ao carregar sessões do utilizador');
      }
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: number) => {
    try {
      const response = await api.terminateSession(sessionId);
      if (response.data.sucesso) {
        toast.success('Sessão encerrada com sucesso');
        loadSessions();
      }
    } catch (error: unknown) {
      console.error('Erro ao encerrar sessão:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response && axiosError.response.data && typeof axiosError.response.data === 'object' && 'mensagem' in axiosError.response.data) {
          toast.error(axiosError.response.data.mensagem as string);
        } else {
          toast.error('Erro ao encerrar sessão');
        }
      } else {
        toast.error('Erro ao encerrar sessão');
      }
    }
  };

  const terminateAllSessions = async () => {
    if (!user) return;
    
    try {
      const response = await api.terminateAllUserSessions(user.id);
      if (response.data.sucesso) {
        toast.success('Todas as sessões encerradas com sucesso');
        loadSessions();
      }
    } catch (error: unknown) {
      console.error('Erro ao encerrar todas as sessões:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response && axiosError.response.data && typeof axiosError.response.data === 'object' && 'mensagem' in axiosError.response.data) {
          toast.error(axiosError.response.data.mensagem as string);
        } else {
          toast.error('Erro ao encerrar todas as sessões');
        }
      } else {
        toast.error('Erro ao encerrar todas as sessões');
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Detalhes do Utilizador
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center mb-6">
              {user.foto_perfil ? (
                <img 
                  src={getAvatarUrl(user.foto_perfil) || undefined} 
                  alt={user.nome} 
                  className="w-20 h-20 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerText = user.nome.charAt(0).toUpperCase();
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl">
                  {user.nome.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.nome}</h2>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.perfil === 'Administrador' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {user.perfil}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.estado === 'Ativo' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {user.estado}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
              <nav className="-mb-px flex">
                <button
                  className={`mr-8 py-2 font-medium text-sm border-b-2 ${
                    activeTab === 'info'
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setActiveTab('info')}
                >
                  <div className="flex items-center">
                    <Shield size={16} className="mr-2" />
                    Informações
                  </div>
                </button>
                <button
                  className={`py-2 font-medium text-sm border-b-2 ${
                    activeTab === 'sessions'
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setActiveTab('sessions')}
                >
                  <div className="flex items-center">
                    <History size={16} className="mr-2" />
                    Sessões
                  </div>
                </button>
              </nav>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'info' ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</h4>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome</h4>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.nome}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h4>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Perfil</h4>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.perfil}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</h4>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.estado}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Autenticação de Dois Fatores</h4>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user.dois_fatores_ativo ? 'Ativada' : 'Desativada'}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {loading ? (
                  <div className="py-4 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-600"></div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando sessões...</p>
                  </div>
                ) : !sessions || sessions.length === 0 ? (
                  <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                    <Clock size={24} className="mx-auto mb-2" />
                    <p>Nenhuma sessão ativa encontrada.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex justify-end">
                      <button
                        onClick={terminateAllSessions}
                        className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
                      >
                        Encerrar todas as sessões
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {sessions.map((session) => (
                        <div key={session.id} className="mb-3 p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-700">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                <div className={`mr-2 h-2 w-2 rounded-full ${session.ativa ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                {session.dispositivo}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">IP: {session.ip}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Login: {formatDate(session.criado_em)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Expira: {formatDate(session.expira_em)}
                              </p>
                            </div>
                            <button
                              onClick={() => terminateSession(session.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              title="Encerrar sessão"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
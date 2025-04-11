import React, { useState, useEffect } from 'react';
import api, { getAvatarUrl } from '@/services/api';
import { toast } from 'react-toastify';
import { User } from '@/contexts/AuthContext';
import { 
  X, 
  Shield, 
  Clock, 
  History, 
  User as UserIcon,
  Mail,
  Globe,
  Laptop,
  Calendar,
  LogOut,
  ChevronRight,
  Lock,
  AlertCircle,
  Check,
  RefreshCw,
} from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Detectar modo escuro
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

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
    setSessionToDelete(sessionId);
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
    } finally {
      setSessionToDelete(null);
    }
  };

  const terminateAllSessions = async () => {
    if (!user) return;
    
    setLoading(true);
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
    } finally {
      setLoading(false);
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

  // Função para obter o nome do dispositivo em formato mais amigável
  const getDeviceName = (userAgent: string, deviceString: string) => {
    if (!userAgent) return deviceString || 'Dispositivo desconhecido';
    
    const lowerUA = userAgent.toLowerCase();
    
    if (lowerUA.includes('iphone')) return 'iPhone';
    if (lowerUA.includes('ipad')) return 'iPad';
    if (lowerUA.includes('android') && lowerUA.includes('mobile')) return 'Android Smartphone';
    if (lowerUA.includes('android')) return 'Android Tablet';
    if (lowerUA.includes('windows phone')) return 'Windows Phone';
    if (lowerUA.includes('macintosh') || lowerUA.includes('mac os')) return 'MacOS';
    if (lowerUA.includes('windows')) return 'Windows';
    if (lowerUA.includes('linux')) return 'Linux';
    
    return deviceString || 'Dispositivo desconhecido';
  };

  // Função para determinar se uma sessão está próxima de expirar
  const isSessionExpiringSoon = (expireDate: string) => {
    if (!expireDate) return false;
    
    const expire = new Date(expireDate);
    const now = new Date();
    const hoursDiff = (expire.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff > 0 && hoursDiff < 24;
  };

  const isSessionExpired = (expireDate: string) => {
    if (!expireDate) return true;
    
    const expire = new Date(expireDate);
    const now = new Date();
    
    return expire < now;
  };

  // Variantes para animações
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: "easeIn" } }
  };
  
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };
  
  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };
  
  const sessionItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.3,
        delay: i * 0.05,
        ease: "easeOut"
      } 
    }),
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay com blur */}
            <motion.div 
              className="fixed inset-0 transition-opacity backdrop-blur-sm" 
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={overlayVariants}
              aria-hidden="true"
              onClick={onClose}
            >
              <div className="absolute inset-0 bg-black/40 dark:bg-gray-900/80"></div>
            </motion.div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <motion.div 
              className="inline-block align-bottom rounded-2xl text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
            >
              {/* Conteúdo do modal */}
              <div className="bg-white dark:bg-[#1a2331] rounded-2xl shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
                <div className="relative">
                  {/* Banner/Header colorido para modernizar */}
                  <div className="relative h-28 bg-gradient-to-r from-cyan-700 via-cyan-600 to-blue-700 dark:from-cyan-800 dark:to-blue-800">
                    {/* Padrão geométrico para dar textura */}
                    <div className="absolute inset-0 overflow-hidden opacity-20">
                      <svg className="absolute left-0 top-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {[...Array(10)].map((_, i) => (
                          <polygon
                            key={i}
                            points={`${Math.random() * 100},${Math.random() * 100} ${Math.random() * 100},${Math.random() * 100} ${Math.random() * 100},${Math.random() * 100}`}
                            fill="rgba(255,255,255,0.1)"
                          />
                        ))}
                      </svg>
                    </div>
                    
                    {/* Botão de fechar moderno */}
                    <button
                      type="button"
                      className="absolute right-4 top-4 rounded-full bg-black/10 p-2 text-white backdrop-blur-md hover:bg-black/20 transition-all duration-300"
                      onClick={onClose}
                    >
                      <X size={18} />
                    </button>
                    
                    {/* Avatar posicionado na parte inferior do banner, se sobrepondo */}
                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                      <motion.div 
                        className="relative"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        {user.foto_perfil ? (
                          <div className="h-20 w-20 rounded-full border-4 border-white/90 ring-4 ring-cyan-600/20 shadow-lg overflow-hidden">
                            <img 
                              src={getAvatarUrl(user.foto_perfil) || undefined} 
                              alt={user.nome} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                (target.parentElement as HTMLElement).classList.add("flex", "items-center", "justify-center", "bg-gradient-to-br", "from-cyan-600", "to-blue-800", "text-white", "text-2xl", "font-bold");
                                (target.parentElement as HTMLElement).innerText = user.nome.charAt(0).toUpperCase();
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-20 w-20 rounded-full border-4 border-white/90 ring-4 ring-cyan-600/20 shadow-lg bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center text-white text-2xl font-bold">
                            {user.nome.charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        {/* Badge de status do usuário */}
                        <span className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center ${
                          user.estado === 'Ativo' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}>
                          {user.estado === 'Ativo' ? <Check size={12} /> : <AlertCircle size={12} />}
                        </span>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Espaço para o nome e informações básicas */}
                  <div className="mt-12 text-center px-6 pb-4">
                    <motion.h2 
                      className="text-xl font-bold text-gray-900 dark:text-white"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {user.nome}
                    </motion.h2>
                    <motion.p 
                      className="text-gray-600 dark:text-gray-400 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {user.email}
                    </motion.p>
                    <motion.div 
                      className="mt-3 flex flex-wrap gap-2 justify-center"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.span 
                        className="px-3 py-0.5 text-xs rounded-full font-medium bg-cyan-100 text-cyan-800 dark:bg-white/20 dark:text-white border border-cyan-200 dark:border-white/10"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <Shield className="w-3 h-3 inline-block mr-1" />
                        {user.perfil}
                      </motion.span>
                      <motion.span 
                        className="px-3 py-0.5 text-xs rounded-full font-medium bg-green-100 text-green-800 dark:bg-emerald-400/20 dark:text-white border border-green-200 dark:border-white/10"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <span className="inline-block w-1.5 h-1.5 bg-green-500 dark:bg-emerald-400 rounded-full mr-1"></span>
                        {user.estado}
                      </motion.span>
                    </motion.div>
                  </div>
                </div>
                
                {/* Tabs modernizadas */}
                <div className={`border-b border-gray-200 dark:border-gray-700 px-6 ${
                  isDarkMode ? 'bg-[#1a2331]' : 'bg-white'
                }`}>
                  <div className="flex justify-center -mb-px">
                    <button
                      className={`py-3 px-4 flex items-center border-b-2 transition-all relative ${
                        activeTab === 'info'
                          ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-medium'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setActiveTab('info')}
                    >
                      <UserIcon size={16} className="mr-2" />
                      <span className="text-sm">Informações</span>
                      {activeTab === 'info' && (
                        <motion.span 
                          className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-blue-400" 
                          layoutId="activeTabIndicator"
                        />
                      )}
                    </button>
                    <button
                      className={`py-3 px-4 flex items-center border-b-2 transition-all relative ${
                        activeTab === 'sessions'
                          ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-medium'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setActiveTab('sessions')}
                    >
                      <History size={16} className="mr-2" />
                      <span className="text-sm">Sessões</span>
                      {sessions.length > 0 && (
                        <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-xs font-medium text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-200">
                          {sessions.length}
                        </span>
                      )}
                      {activeTab === 'sessions' && (
                        <motion.span 
                          className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 to-blue-400" 
                          layoutId="activeTabIndicator"
                        />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Conteúdo das tabs com animação */}
                <div className={`px-6 py-5 ${isDarkMode ? 'bg-[#212e42]' : 'bg-gray-50'}`}>
                  <AnimatePresence mode="wait">
                    {activeTab === 'info' ? (
                      <motion.div
                        key="info-tab"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={tabContentVariants}
                        className="space-y-5"
                      >
                        <div className="grid grid-cols-1 gap-5">
                          <div className={`p-4 rounded-xl ${
                            isDarkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm transition-all`}
                          >
                            <div className="flex items-center mb-2">
                              <div className={`p-2 rounded-full mr-2 ${
                                isDarkMode 
                                  ? 'bg-cyan-500/10' 
                                  : 'bg-cyan-100/50'
                              }`}>
                                <UserIcon size={14} className={`${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                              </div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome</h4>
                            </div>
                            <p className="ml-10 text-sm text-gray-800 dark:text-white font-medium">
                              {user.nome}
                            </p>
                          </div>
                          
                          <div className={`p-4 rounded-xl ${
                            isDarkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm transition-all`}
                          >
                            <div className="flex items-center mb-2">
                              <div className={`p-2 rounded-full mr-2 ${
                                isDarkMode 
                                  ? 'bg-cyan-500/10' 
                                  : 'bg-cyan-100/50'
                              }`}>
                                <Mail size={14} className={`${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                              </div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</h4>
                            </div>
                            <p className="ml-10 text-sm text-gray-800 dark:text-white break-all">
                              {user.email}
                            </p>
                          </div>
                          
                          <div className={`p-4 rounded-xl ${
                            isDarkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm transition-all`}
                          >
                            <div className="flex items-center mb-2">
                              <div className={`p-2 rounded-full mr-2 ${
                                isDarkMode 
                                  ? 'bg-cyan-500/10' 
                                  : 'bg-cyan-100/50'
                              }`}>
                                <Shield size={14} className={`${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                              </div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Perfil</h4>
                            </div>
                            <p className="ml-10">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                isDarkMode 
                                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' 
                                  : 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                              }`}>
                                <Shield className="w-3.5 h-3.5 mr-1" />
                                {user.perfil}
                              </span>
                            </p>
                          </div>
                          
                          <div className={`p-4 rounded-xl ${
                            isDarkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm transition-all`}
                          >
                            <div className="flex items-center mb-2">
                              <div className={`p-2 rounded-full mr-2 ${
                                isDarkMode 
                                  ? 'bg-cyan-500/10' 
                                  : 'bg-cyan-100/50'
                              }`}>
                                <Check size={14} className={`${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                              </div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</h4>
                            </div>
                            <p className="ml-10">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                user.estado === 'Ativo' 
                                  ? isDarkMode 
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : isDarkMode 
                                    ? 'bg-red-500/10 text-red-300 border border-red-500/20' 
                                    : 'bg-red-50 text-red-700 border border-red-100'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                                  user.estado === 'Ativo' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}></span>
                                {user.estado}
                              </span>
                            </p>
                          </div>
                          
                          <div className={`p-4 rounded-xl ${
                            isDarkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm transition-all`}
                          >
                            <div className="flex items-center mb-2">
                              <div className={`p-2 rounded-full mr-2 ${
                                isDarkMode 
                                  ? 'bg-cyan-500/10' 
                                  : 'bg-cyan-100/50'
                              }`}>
                                <Lock size={14} className={`${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                              </div>
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Autenticação 2FA</h4>
                            </div>
                            <p className="ml-10">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                user.dois_fatores_ativo
                                  ? isDarkMode 
                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : isDarkMode 
                                    ? 'bg-gray-600/50 text-gray-300 border border-gray-600/30' 
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}>
                                {user.dois_fatores_ativo ? 'Ativada' : 'Desativada'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="sessions-tab"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={tabContentVariants}
                      >
                        {loading ? (
                          <div className="py-8 text-center">
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                              className="mx-auto h-8 w-8 text-cyan-500"
                            >
                              <RefreshCw size={32} />
                            </motion.div>
                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Carregando sessões...</p>
                          </div>
                        ) : !sessions || sessions.length === 0 ? (
                          <div className="py-10 text-center">
                            <div className={`mx-auto h-16 w-16 rounded-full p-4 ${
                              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                            }`}>
                              <Clock className={`h-full w-full ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                            </div>
                            <h3 className="mt-3 text-sm font-medium text-gray-900 dark:text-white">Sem sessões ativas</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Não há sessões ativas para este utilizador.</p>
                          </div>
                        ) : (
                          <>
                            <div className="mb-4 flex justify-between items-center">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-medium text-gray-900 dark:text-white">{sessions.length}</span> sessões encontradas
                              </p>
                              <motion.button
                                onClick={terminateAllSessions}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/70 dark:text-red-200 dark:hover:bg-red-800/90 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={loading}
                              >
                                <LogOut size={12} className="mr-1.5" />
                                Encerrar todas
                              </motion.button>
                            </div>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                              {sessions.map((session, index) => (
                                <motion.div 
                                  key={session.id} 
                                  className={`p-4 rounded-xl border ${
                                    session.ativa 
                                      ? isDarkMode 
                                        ? 'border-gray-700 bg-[#1a2331]' 
                                        : 'border-gray-200 bg-white'
                                      : isDarkMode 
                                        ? 'border-gray-700 bg-gray-800/30' 
                                        : 'border-gray-200 bg-gray-50/80'
                                  } ${
                                    sessionToDelete === session.id 
                                      ? 'animate-pulse border-red-300 dark:border-red-700' 
                                      : ''
                                  } hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all`}
                                  variants={sessionItemVariants}
                                  initial="hidden"
                                  animate="visible"
                                  custom={index}
                                  whileHover={{ y: -2 }}
                                  onClick={() => setShowSessionDetails(showSessionDetails === session.id ? null : session.id)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start">
                                      <div className={`p-2 rounded-lg mr-3 ${
                                        session.ativa
                                          ? isDarkMode
                                            ? 'bg-cyan-500/10 text-cyan-400'
                                            : 'bg-cyan-100 text-cyan-700'
                                          : isDarkMode
                                            ? 'bg-gray-700 text-gray-400'
                                            : 'bg-gray-200 text-gray-500'
                                      }`}>
                                        <Laptop size={16} />
                                      </div>
                                      <div>
                                        <div className="flex items-center mb-1">
                                          <h4 className={`text-sm font-medium ${
                                            session.ativa
                                              ? 'text-gray-900 dark:text-white'
                                              : 'text-gray-700 dark:text-gray-300'
                                          }`}>
                                            {getDeviceName(session.user_agent, session.dispositivo)}
                                          </h4>
                                          {session.ativa && (
                                            <span className={`ml-2 inline-flex h-1.5 w-1.5 rounded-full ${
                                              isSessionExpiringSoon(session.expira_em)
                                                ? 'bg-amber-500'
                                                : 'bg-emerald-500'
                                            }`}></span>
                                          )}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                          <Globe size={10} className="mr-1" />
                                          <span>{session.ip}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                          <Calendar size={10} className="mr-1" />
                                          <span>
                                            {isSessionExpired(session.expira_em) 
                                              ? 'Expirada' 
                                              : isSessionExpiringSoon(session.expira_em)
                                                ? `Expira em breve (${formatDate(session.expira_em)})`
                                                : `Ativa até ${formatDate(session.expira_em)}`
                                            }
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center">
                                      <motion.button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowSessionDetails(showSessionDetails === session.id ? null : session.id);
                                        }}
                                        className={`mr-2 p-1.5 rounded-full ${
                                          isDarkMode
                                            ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                                            : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                                        }`}
                                      >
                                        <ChevronRight size={14} className={`transform transition-transform ${
                                          showSessionDetails === session.id ? 'rotate-90' : ''
                                        }`} />
                                      </motion.button>
                                      <motion.button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          terminateSession(session.id);
                                        }}
                                        disabled={sessionToDelete === session.id || !session.ativa}
                                        className={`p-1.5 rounded-full ${
                                          session.ativa
                                            ? isDarkMode
                                              ? 'hover:bg-red-900/80 text-red-400 hover:text-red-300'
                                              : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                                            : 'opacity-50 cursor-not-allowed'
                                        }`}
                                        whileHover={session.ativa ? { scale: 1.1 } : {}}
                                        whileTap={session.ativa ? { scale: 0.95 } : {}}
                                      >
                                        {sessionToDelete === session.id ? (
                                          <RefreshCw size={14} className="animate-spin" />
                                        ) : (
                                          <X size={14} />
                                        )}
                                      </motion.button>
                                    </div>
                                  </div>
                                  
                                  {/* Detalhes da sessão */}
                                  <AnimatePresence>
                                    {showSessionDetails === session.id && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className={`mt-3 pt-3 border-t ${
                                          isDarkMode ? 'border-gray-700' : 'border-gray-200'
                                        }`}>
                                          <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                              <p className="text-gray-500 dark:text-gray-400">Login em:</p>
                                              <p className="font-medium text-gray-900 dark:text-white">{formatDate(session.criado_em)}</p>
                                            </div>
                                            <div>
                                              <p className="text-gray-500 dark:text-gray-400">Expira em:</p>
                                              <p className="font-medium text-gray-900 dark:text-white">{formatDate(session.expira_em)}</p>
                                            </div>
                                            <div className="col-span-2 mt-1">
                                              <p className="text-gray-500 dark:text-gray-400 mb-1">User Agent:</p>
                                              <p className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                                                {session.user_agent || 'Não disponível'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              ))}
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Rodapé */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    className="py-2 px-5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-md shadow-cyan-500/20 dark:shadow-cyan-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-gray-800"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Fechar
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UserDetailsModal;
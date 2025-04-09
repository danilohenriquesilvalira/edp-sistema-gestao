import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import api, { getAvatarUrl } from '@/services/api';
import { toast } from 'react-toastify';
import { 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  RefreshCw, 
  LogOut, 
  Camera, 
  Shield, 
  Key, 
  Bell, 
  Palette, 
  Globe,
  User,
  Lock,
  Settings
} from 'lucide-react';
import ConfirmationModal from '@/components/common/ConfirmationModal';

interface UserPreferences {
  tema_escuro: boolean;
  idioma: string;
  notificacoes: boolean;
  dashboard: string;
}

interface PasswordChangeForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    tema_escuro: darkMode,
    idioma: 'pt',
    notificacoes: true,
    dashboard: '{}'
  });
  
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState(false);
  
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [sessionsCount, setSessionsCount] = useState(0);
  const [isLogoutAllModalOpen, setIsLogoutAllModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  
  useEffect(() => {
    loadPreferences();
    loadSessionsCount();
  }, []);

  useEffect(() => {
    setPreferences(prev => ({
      ...prev,
      tema_escuro: darkMode
    }));
  }, [darkMode]);
  
  const loadPreferences = async () => {
    try {
      const response = await api.getUserPreferences();
      if (response.data.sucesso) {
        const prefs = response.data.dados;
        setPreferences({
          tema_escuro: prefs.tema_escuro,
          idioma: prefs.idioma,
          notificacoes: prefs.notificacoes,
          dashboard: prefs.dashboard
        });
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    }
  };
  
  const loadSessionsCount = async () => {
    if (!user) return;
    
    try {
      const response = await api.getUserSessions(user.id, true);
      if (response.data.sucesso) {
        setSessionsCount(response.data.dados.length);
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  };
  
  const savePreferences = async () => {
    setLoadingPreferences(true);
    try {
      const response = await api.updateUserPreferences({
        tema_escuro: preferences.tema_escuro,
        idioma: preferences.idioma,
        notificacoes: preferences.notificacoes,
        dashboard: preferences.dashboard
      });
      
      if (response.data.sucesso) {
        toast.success('Preferências salvas com sucesso!');
        
        // Atualizar tema da aplicação se necessário
        if (preferences.tema_escuro !== darkMode) {
          toggleDarkMode();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências');
    } finally {
      setLoadingPreferences(false);
    }
  };
  
  const validatePassword = () => {
    const errors: Record<string, string> = {};
    
    if (!passwordForm.current_password) {
      errors.current_password = 'A senha atual é obrigatória';
    }
    
    if (!passwordForm.new_password) {
      errors.new_password = 'A nova senha é obrigatória';
    } else if (passwordForm.new_password.length < 6) {
      errors.new_password = 'A nova senha deve ter pelo menos 6 caracteres';
    }
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      errors.confirm_password = 'As senhas não coincidem';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    setLoadingPassword(true);
    try {
      const response = await api.changePassword(
        passwordForm.current_password,
        passwordForm.new_password
      );
      
      if (response.data.sucesso) {
        toast.success('Senha alterada com sucesso!');
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      if (error instanceof Error) {
        const axiosError = error as any;
        if (axiosError.response && axiosError.response.data && axiosError.response.data.mensagem) {
          if (axiosError.response.data.mensagem === 'Senha atual incorreta') {
            setPasswordErrors({
              ...passwordErrors,
              current_password: 'Senha atual incorreta'
            });
          } else {
            toast.error(axiosError.response.data.mensagem);
          }
        } else {
          toast.error('Erro ao alterar senha');
        }
      } else {
        toast.error('Erro ao alterar senha');
      }
    } finally {
      setLoadingPassword(false);
    }
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
    
    // Limpar erro quando o campo é editado
    if (passwordErrors[name]) {
      setPasswordErrors({ ...passwordErrors, [name]: '' });
    }
  };
  
  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setPreferences({ ...preferences, [name]: checked });
    } else {
      setPreferences({ ...preferences, [name]: value });
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verificar tipo e tamanho do arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    
    if (!validTypes.includes(file.type)) {
      toast.error('O arquivo deve ser uma imagem (JPEG, PNG, GIF ou WebP)');
      return;
    }
    
    if (file.size > maxSize) {
      toast.error('O arquivo não pode ser maior que 2MB');
      return;
    }
    
    setAvatarFile(file);
    setImageError(false);
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAvatarPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const uploadAvatar = async () => {
    if (!avatarFile || !user) return;
    
    setLoadingAvatar(true);
    
    try {
      const response = await api.uploadProfilePicture(user.id, avatarFile);
      
      if (response.data.sucesso) {
        toast.success('Foto de perfil atualizada com sucesso!');
        // Atualizar o contexto de autenticação ou recarregar a página
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      toast.error('Erro ao atualizar foto de perfil');
    } finally {
      setLoadingAvatar(false);
    }
  };
  
  const cancelAvatarChange = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setImageError(false);
  };
  
  const handleLogoutAllSessions = async () => {
    if (!user) return;
    
    try {
      const response = await api.terminateAllUserSessions(user.id);
      if (response.data.sucesso) {
        toast.success('Todas as sessões foram encerradas. Você será redirecionado para o login.');
        setTimeout(() => {
          logout();
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao encerrar sessões:', error);
      toast.error('Erro ao encerrar todas as sessões');
    } finally {
      setIsLogoutAllModalOpen(false);
    }
  };
  
  const handleRemoveAvatar = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const response = await api.removeProfilePicture(user.id);
      
      if (response.data.sucesso) {
        toast.success('Foto de perfil removida com sucesso!');
        // Recarregar página após 1.5 segundos
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Erro ao remover avatar:', error);
      toast.error('Erro ao remover foto de perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-[400px] flex justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Painel principal que ocupa grande parte da tela */}
        <div className={`w-full h-full rounded-xl overflow-hidden ${
          darkMode
            ? 'bg-gray-900 border-gray-800'
            : 'bg-white border-gray-200'
        } border`}>
          {/* Cabeçalho com Banner para o avatar */}
          <div className={`w-full ${
            darkMode
              ? 'bg-blue-900'
              : 'bg-blue-600'
          } py-10 px-8 flex flex-col items-center`}>
            
            {/* Avatar grande e centralizado */}
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/80 shadow-lg mx-auto">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : user.foto_perfil && !imageError ? (
                  <img 
                    src={getAvatarUrl(user.foto_perfil) || undefined} 
                    alt={user.nome}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-4xl font-semibold">
                    {user.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {!avatarPreview && (
                  <label htmlFor="avatar-upload" className={`absolute bottom-0 right-0 ${
                    darkMode 
                      ? 'bg-gray-800 hover:bg-gray-700' 
                      : 'bg-white hover:bg-gray-100'
                  } rounded-full p-3 shadow-md cursor-pointer transition-colors border border-blue-300`}>
                    <Camera size={20} className="text-blue-500" />
                    <input
                      id="avatar-upload"
                      type="file"
                      className="hidden"
                      accept="image/jpeg, image/png, image/gif, image/webp"
                      onChange={handleAvatarChange}
                    />
                  </label>
                )}
              </div>
            </div>
            
            {/* Informações do usuário */}
            <h2 className="text-xl font-bold text-white">{user.nome}</h2>
            <p className="text-white/90 text-sm mb-3">{user.email}</p>
            
            <div className="flex justify-center gap-2 mb-4">
              <span className="px-3 py-1 text-xs rounded-full font-medium bg-blue-700/60 text-white border border-blue-600/30">
                {user.perfil}
              </span>
              <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-700/60 text-white border border-green-600/30">
                {user.estado}
              </span>
            </div>
            
            {/* Botões de avatar */}
            {avatarPreview ? (
              <div className="flex justify-center gap-2 mt-2">
                <button
                  onClick={uploadAvatar}
                  disabled={loadingAvatar}
                  className="px-4 py-1.5 bg-white text-blue-700 rounded text-sm hover:bg-blue-50 font-medium transition-colors"
                >
                  {loadingAvatar ? (
                    <RefreshCw size={14} className="animate-spin mr-1 inline" />
                  ) : (
                    <Check size={14} className="mr-1 inline" />
                  )}
                  Salvar
                </button>
                
                <button
                  onClick={cancelAvatarChange}
                  className="px-4 py-1.5 bg-blue-800 text-white rounded text-sm hover:bg-blue-700 font-medium transition-colors"
                >
                  <X size={14} className="mr-1 inline" />
                  Cancelar
                </button>
              </div>
            ) : user.foto_perfil && (
              <button
                onClick={handleRemoveAvatar}
                disabled={loading}
                className="px-4 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin mr-1 inline" />
                ) : (
                  <X size={14} className="mr-1 inline" />
                )}
                Remover foto
              </button>
            )}
          </div>
          
          {/* Área de navegação */}
          <div className={`flex justify-center ${
            darkMode ? 'bg-gray-900' : 'bg-white'
          } border-b ${
            darkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-4 text-center ${
                activeTab === 'profile'
                  ? `border-b-2 ${darkMode ? 'border-blue-500 text-blue-500' : 'border-blue-600 text-blue-600'} font-medium`
                  : `border-b-2 border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              <div className="flex items-center">
                <User size={18} className="mr-2" />
                <span>Informações</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-6 py-4 text-center ${
                activeTab === 'preferences'
                  ? `border-b-2 ${darkMode ? 'border-blue-500 text-blue-500' : 'border-blue-600 text-blue-600'} font-medium`
                  : `border-b-2 border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              <div className="flex items-center">
                <Settings size={18} className="mr-2" />
                <span>Preferências</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-4 text-center ${
                activeTab === 'security'
                  ? `border-b-2 ${darkMode ? 'border-blue-500 text-blue-500' : 'border-blue-600 text-blue-600'} font-medium`
                  : `border-b-2 border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              <div className="flex items-center">
                <Lock size={18} className="mr-2" />
                <span>Segurança</span>
              </div>
            </button>
          </div>
          
          {/* Área de conteúdo principal */}
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} p-6`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Coluna da esquerda - Sessões ativas */}
              <div className="md:col-span-1">
                <div className={`md:col-span-2 min-h-[328px] py-8 rounded-xl p-5 ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                } border`}>
                  <div className="flex flex-col items-center">
                    <Shield size={24} className={`${darkMode ? 'text-blue-400' : 'text-blue-500'} mb-3`} />
                    <h3 className={`text-xl font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      Sessões Ativas
                    </h3>
                    
                    <div className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {sessionsCount}
                    </div>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                      dispositivos
                    </p>
                    
                    <div className={`w-full mt-4 h-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full`}>
                      <div 
                        className={`h-full ${darkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full`}
                        style={{ width: `${Math.min(100, (sessionsCount / 5) * 100)}%` }}
                      ></div>
                    </div>
                    
                    <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
                      {sessionsCount > 1 
                        ? `Você está conectado em ${sessionsCount} dispositivos diferentes` 
                        : 'Você está conectado apenas neste dispositivo'}
                    </p>
                    
                    {sessionsCount > 1 && (
                      <button
                        onClick={() => setIsLogoutAllModalOpen(true)}
                        className={`mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium ${
                          darkMode 
                            ? 'bg-red-900/30 border-red-800 text-red-300 hover:bg-red-900/50' 
                            : 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                        } border rounded-lg`}
                      >
                        <LogOut size={16} className="mr-2" />
                        Encerrar todas as sessões
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Coluna da direita - Conteúdo da tab ativa */}
              <div className="md:col-span-3">
                {/* Tab de Informações do Perfil */}
                {activeTab === 'profile' && (
                  <div>
                    <div className="flex items-center mb-4">
                      <User size={20} className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
                      <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Informações do Perfil
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ID */}
                      <div className={`rounded-lg p-4 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                        } border`}>
                        <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                          ID
                        </h4>
                        <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                          {user.id}
                        </p>
                      </div>
                      
                      {/* Estado */}
                      <div className={`rounded-lg p-4 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                        } border`}>
                        <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                          Estado
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          darkMode 
                            ? 'bg-green-900/40 text-green-300 border border-green-800' 
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {user.estado}
                        </span>
                      </div>
                      
                      {/* Nome Completo */}
                      <div className={`rounded-lg p-4 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                        } border`}>
                        <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                          Nome Completo
                        </h4>
                        <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                          {user.nome}
                        </p>
                      </div>
                      
                      {/* Email */}
                      <div className={`rounded-lg p-4 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                        } border`}>
                        <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                          Email
                        </h4>
                        <p className={`${darkMode ? 'text-white' : 'text-gray-900'} break-all`}>
                          {user.email}
                        </p>
                      </div>
                      
                      {/* Perfil */}
                      <div className={`rounded-lg p-4 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                        } border`}>
                        <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                          Perfil
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          darkMode 
                            ? 'bg-blue-900/40 text-blue-300 border border-blue-800' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {user.perfil}
                        </span>
                      </div>
                      
                      {/* Autenticação de Dois Fatores */}
                      <div className={`rounded-lg p-4 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                        } border`}>
                        <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                          Autenticação de Dois Fatores
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.dois_fatores_ativo
                            ? darkMode 
                              ? 'bg-green-900/40 text-green-300 border border-green-800' 
                              : 'bg-green-100 text-green-800 border border-green-200'
                            : darkMode 
                              ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-800' 
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {user.dois_fatores_ativo ? 'Ativada' : 'Desativada'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Tab de Preferências */}
                {activeTab === 'preferences' && (
                  <div>
                    <div className="flex items-center mb-4">
                      <Settings size={20} className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
                      <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Preferências do Sistema
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Tema Escuro */}
                      <div className={`rounded-lg p-4 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                        } border`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-full mr-3 ${
                              darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                            }`}>
                              <Palette className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Tema Escuro
                              </h4>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                                Altere entre tema claro e escuro
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                id="tema_escuro"
                                name="tema_escuro"
                                checked={preferences.tema_escuro}
                                onChange={handlePreferenceChange}
                                className="sr-only"
                              />
                              <div className={`w-11 h-6 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-300'
                              } rounded-full peer ${
                                preferences.tema_escuro 
                                  ? darkMode ? 'bg-blue-500' : 'bg-blue-600' 
                                  : ''
                              }`}>
                                <div className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-all duration-300 ${
                                  preferences.tema_escuro ? 'translate-x-5' : ''
                                }`}></div>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* Idioma */}
                      <div className={`rounded-lg p-4 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                        } border`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-full mr-3 ${
                              darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                            }`}>
                              <Globe className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Idioma
                              </h4>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                                Escolha o idioma para exibição do sistema
                              </p>
                            </div>
                          </div>
                          <div>
                            <select
                              id="idioma"
                              name="idioma"
                              value={preferences.idioma}
                              onChange={handlePreferenceChange}
                              className={`w-full md:w-40 rounded-md border px-3 py-2 ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
                                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-600'
                              } focus:outline-none focus:ring-2 focus:border-transparent`}
                            >
                              <option value="pt">Português</option>
                              <option value="en">English</option>
                              <option value="es">Español</option>
                              <option value="fr">Français</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      {/* Notificações */}
                      <div className={`rounded-lg p-4 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                        } border`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-full mr-3 ${
                              darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                            }`}>
                              <Bell className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Notificações
                              </h4>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                                Receber notificações do sistema
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                id="notificacoes"
                                name="notificacoes"
                                checked={preferences.notificacoes}
                                onChange={handlePreferenceChange}
                                className="sr-only"
                              />
                              <div className={`w-11 h-6 ${
                                darkMode ? 'bg-gray-700' : 'bg-gray-300'
                              } rounded-full peer ${
                                preferences.notificacoes 
                                  ? darkMode ? 'bg-blue-500' : 'bg-blue-600' 
                                  : ''
                              }`}>
                                <div className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-all duration-300 ${
                                  preferences.notificacoes ? 'translate-x-5' : ''
                                }`}></div>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botão Salvar */}
                      <div className="flex justify-end mt-6">
                        <button
                          onClick={savePreferences}
                          disabled={loadingPreferences}
                          className={`px-4 py-2 ${
                            darkMode ? 'bg-blue-500' : 'bg-blue-600'
                          } hover:bg-blue-700 text-white rounded-md font-medium flex items-center`}
                        >
                          {loadingPreferences ? (
                            <>
                              <RefreshCw size={16} className="animate-spin mr-2" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Check size={16} className="mr-2" />
                              Salvar Preferências
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Tab de Segurança */}
                {activeTab === 'security' && (
                  <div>
                    <div className="flex items-center mb-4">
                      <Lock size={20} className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
                      <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Alterar Senha
                      </h3>
                    </div>
                    
                    <div className={`rounded-lg p-5 ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                      } border`}>
                      <form onSubmit={changePassword} className="space-y-4 max-w-lg">
                        {/* Senha Atual */}
                        <div>
                          <label htmlFor="current_password" className={`block text-sm font-medium ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          } mb-1`}>
                            Senha Atual
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Key size={16} className="text-gray-400" />
                            </div>
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              id="current_password"
                              name="current_password"
                              value={passwordForm.current_password}
                              onChange={handlePasswordChange}
                              className={`w-full pl-10 pr-10 py-2 border ${
                                passwordErrors.current_password 
                                  ? 'border-red-500' 
                                  : darkMode ? 'border-gray-600' : 'border-gray-300'
                              } rounded-md ${
                                darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                              placeholder="Digite sua senha atual"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? 
                                <EyeOff size={16} className="text-gray-400" /> : 
                                <Eye size={16} className="text-gray-400" />
                              }
                            </button>
                          </div>
                          {passwordErrors.current_password && (
                            <p className="mt-1 text-sm text-red-500">{passwordErrors.current_password}</p>
                          )}
                        </div>
                        
                        {/* Nova Senha */}
                        <div>
                          <label htmlFor="new_password" className={`block text-sm font-medium ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          } mb-1`}>
                            Nova Senha
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Key size={16} className="text-gray-400" />
                            </div>
                            <input
                              type={showNewPassword ? "text" : "password"}
                              id="new_password"
                              name="new_password"
                              value={passwordForm.new_password}
                              onChange={handlePasswordChange}
                              className={`w-full pl-10 pr-10 py-2 border ${
                                passwordErrors.new_password 
                                  ? 'border-red-500' 
                                  : darkMode ? 'border-gray-600' : 'border-gray-300'
                              } rounded-md ${
                                darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                              placeholder="Digite sua nova senha"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? 
                                <EyeOff size={16} className="text-gray-400" /> : 
                                <Eye size={16} className="text-gray-400" />
                              }
                            </button>
                          </div>
                          {passwordErrors.new_password && (
                            <p className="mt-1 text-sm text-red-500">{passwordErrors.new_password}</p>
                          )}
                        </div>
                        
                        {/* Confirmar Nova Senha */}
                        <div>
                          <label htmlFor="confirm_password" className={`block text-sm font-medium ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          } mb-1`}>
                            Confirmar Nova Senha
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Key size={16} className="text-gray-400" />
                            </div>
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              id="confirm_password"
                              name="confirm_password"
                              value={passwordForm.confirm_password}
                              onChange={handlePasswordChange}
                              className={`w-full pl-10 pr-10 py-2 border ${
                                passwordErrors.confirm_password 
                                  ? 'border-red-500' 
                                  : darkMode ? 'border-gray-600' : 'border-gray-300'
                              } rounded-md ${
                                darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                              placeholder="Confirme sua nova senha"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? 
                                <EyeOff size={16} className="text-gray-400" /> : 
                                <Eye size={16} className="text-gray-400" />
                              }
                            </button>
                          </div>
                          {passwordErrors.confirm_password && (
                            <p className="mt-1 text-sm text-red-500">{passwordErrors.confirm_password}</p>
                          )}
                        </div>
                        
                        {/* Botão Alterar Senha */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={loadingPassword}
                            className={`w-full px-4 py-2 ${
                              darkMode ? 'bg-blue-500' : 'bg-blue-600'
                            } hover:bg-blue-700 text-white rounded-md font-medium flex items-center justify-center`}
                          >
                            {loadingPassword ? (
                              <>
                                <RefreshCw size={16} className="animate-spin mr-2" />
                                Alterando...
                              </>
                            ) : (
                              <>
                                <Key size={16} className="mr-2" />
                                Alterar Senha
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de confirmação para encerrar todas as sessões */}
      <ConfirmationModal
        isOpen={isLogoutAllModalOpen}
        onClose={() => setIsLogoutAllModalOpen(false)}
        onConfirm={handleLogoutAllSessions}
        title="Encerrar Todas as Sessões"
        message="Tem certeza que deseja encerrar todas as suas sessões ativas? Você será redirecionado para a tela de login."
        confirmButtonText="Sim, Encerrar Todas"
        cancelButtonText="Cancelar"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        icon={<LogOut className="h-6 w-6 text-red-500" />}
      />
    </div>
  );
};

export default Profile;
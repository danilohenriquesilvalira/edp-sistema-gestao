import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/services/api';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Upload, Check, X, RefreshCw, LogOut, Camera, Shield, Key, Bell, Palette, Globe } from 'lucide-react';
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

  const handleImageError = () => {
    setImageError(true);
  };
  
  if (!user) return null;
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>
      
      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column - Avatar and Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-800 shadow-md">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : user.foto_perfil && !imageError ? (
                    <img 
                      src={user.foto_perfil} 
                      alt={user.nome}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full bg-edp-primary-purple flex items-center justify-center text-white text-4xl">
                      {user.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {!avatarPreview && (
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 rounded-full p-3 shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    <Camera size={20} className="text-edp-primary-purple dark:text-edp-primary-blue" />
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
              
              {avatarPreview && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={uploadAvatar}
                    disabled={loadingAvatar}
                    className="flex items-center justify-center px-4 py-2 bg-edp-primary-purple text-white rounded-lg text-sm hover:bg-opacity-90 transition-colors shadow-sm"
                  >
                    {loadingAvatar ? (
                      <RefreshCw size={16} className="animate-spin mr-2" />
                    ) : (
                      <Check size={16} className="mr-2" />
                    )}
                    Salvar
                  </button>
                  
                  <button
                    onClick={cancelAvatarChange}
                    className="flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <X size={16} className="mr-2" />
                    Cancelar
                  </button>
                </div>
              )}
              
              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{user.nome}</h2>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <span className={`px-3 py-1 text-sm rounded-full ${
                  user.perfil === 'Administrador' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {user.perfil}
                </span>
                <span className={`px-3 py-1 text-sm rounded-full ${
                  user.estado === 'Ativo' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {user.estado}
                </span>
              </div>
              
              <div className="mt-6 w-full">
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                    <Shield size={16} className="mr-2" />
                    Sessões ativas: <span className="font-semibold ml-1">{sessionsCount}</span>
                  </p>
                  
                  {sessionsCount > 1 && (
                    <button
                      onClick={() => setIsLogoutAllModalOpen(true)}
                      className="mt-3 w-full flex items-center justify-center px-4 py-2 text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={16} className="mr-2" />
                      Encerrar todas as sessões
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Tabs and Content */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`flex-1 py-4 px-6 text-center ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-edp-primary-purple dark:border-edp-primary-blue text-edp-primary-purple dark:text-edp-primary-blue font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                Informações
              </button>
              <button
                className={`flex-1 py-4 px-6 text-center ${
                  activeTab === 'preferences'
                    ? 'border-b-2 border-edp-primary-purple dark:border-edp-primary-blue text-edp-primary-purple dark:text-edp-primary-blue font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('preferences')}
              >
                Preferências
              </button>
              <button
                className={`flex-1 py-4 px-6 text-center ${
                  activeTab === 'security'
                    ? 'border-b-2 border-edp-primary-purple dark:border-edp-primary-blue text-edp-primary-purple dark:text-edp-primary-blue font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('security')}
              >
                Segurança
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Informações do Perfil</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ID
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                        {user.id}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estado
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.estado === 'Ativo' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {user.estado}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome Completo
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                        {user.nome}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                        {user.email}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Perfil
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.perfil === 'Administrador' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {user.perfil}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Autenticação de Dois Fatores
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                        {user.dois_fatores_ativo ? 
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Ativada</span> : 
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Desativada</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'preferences' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Preferências do Sistema</h3>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Palette className="h-5 w-5 text-gray-600 dark:text-gray-300 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Tema Escuro</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                          <div className={`w-11 h-6 bg-gray-300 rounded-full peer dark:bg-gray-600 ${preferences.tema_escuro ? 'bg-edp-primary-purple dark:bg-edp-primary-blue' : ''}`}>
                            <div className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-all duration-300 ${preferences.tema_escuro ? 'translate-x-5' : ''}`}></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-3 md:gap-0">
                      <div className="flex items-center">
                        <Globe className="h-5 w-5 text-gray-600 dark:text-gray-300 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Idioma</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                          className="w-full md:w-48 rounded-lg shadow-sm border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-edp-primary-purple dark:focus:ring-edp-primary-blue focus:border-transparent"
                        >
                          <option value="pt">Português</option>
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Notificações</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                          <div className={`w-11 h-6 bg-gray-300 rounded-full peer dark:bg-gray-600 ${preferences.notificacoes ? 'bg-edp-primary-purple dark:bg-edp-primary-blue' : ''}`}>
                            <div className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-all duration-300 ${preferences.notificacoes ? 'translate-x-5' : ''}`}></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={savePreferences}
                      disabled={loadingPreferences}
                      className="px-4 py-2 bg-edp-primary-purple hover:bg-opacity-90 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-edp-primary-purple transition-colors flex items-center shadow-sm"
                    >
                      {loadingPreferences ? (
                        <>
                          <RefreshCw size={18} className="animate-spin mr-2" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar Preferências'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Alterar Senha</h3>
                
                <form onSubmit={changePassword} className="space-y-6 max-w-lg">
                  <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Senha Atual
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key size={18} className="text-gray-400" />
                      </div>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        id="current_password"
                        name="current_password"
                        value={passwordForm.current_password}
                        onChange={handlePasswordChange}
                        className={`w-full pl-10 pr-10 py-2 border ${
                          passwordErrors.current_password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                        } rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-edp-primary-purple dark:focus:ring-edp-primary-blue focus:border-transparent`}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff size={18} className="text-gray-400" /> : <Eye size={18} className="text-gray-400" />}
                      </button>
                    </div>
                    {passwordErrors.current_password && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors.current_password}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key size={18} className="text-gray-400" />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="new_password"
                        name="new_password"
                        value={passwordForm.new_password}
                        onChange={handlePasswordChange}
                        className={`w-full pl-10 pr-10 py-2 border ${
                          passwordErrors.new_password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                        } rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-edp-primary-purple dark:focus:ring-edp-primary-blue focus:border-transparent`}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={18} className="text-gray-400" /> : <Eye size={18} className="text-gray-400" />}
                      </button>
                    </div>
                    {passwordErrors.new_password && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors.new_password}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key size={18} className="text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirm_password"
                        name="confirm_password"
                        value={passwordForm.confirm_password}
                        onChange={handlePasswordChange}
                        className={`w-full pl-10 pr-10 py-2 border ${
                          passwordErrors.confirm_password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                        } rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-edp-primary-purple dark:focus:ring-edp-primary-blue focus:border-transparent`}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} className="text-gray-400" /> : <Eye size={18} className="text-gray-400" />}
                      </button>
                    </div>
                    {passwordErrors.confirm_password && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors.confirm_password}</p>
                    )}
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={loadingPassword}
                      className="w-full px-4 py-2 bg-edp-primary-purple hover:bg-opacity-90 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-edp-primary-purple transition-colors flex items-center justify-center shadow-sm"
                    >
                      {loadingPassword ? (
                        <>
                          <RefreshCw size={18} className="animate-spin mr-2" />
                          Alterando...
                        </>
                      ) : (
                        'Alterar Senha'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
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
        icon={<LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />}
      />
    </div>
  );
};

export default Profile;
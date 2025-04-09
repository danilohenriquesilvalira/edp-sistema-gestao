import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/services/api';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Upload, Check, X, RefreshCw, LogOut } from 'lucide-react';
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
  
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [sessionsCount, setSessionsCount] = useState(0);
  const [isLogoutAllModalOpen, setIsLogoutAllModalOpen] = useState(false);
  
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
  
  if (!user) return null;
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Meu Perfil</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-6">
        {/* Informações básicas */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <div className="relative">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Preview" 
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : user.foto_perfil ? (
                  <img 
                    src={user.foto_perfil} 
                    alt={user.nome} 
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-green-600 flex items-center justify-center text-white text-4xl">
                    {user.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {!avatarPreview && (
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 rounded-full p-2 shadow cursor-pointer">
                    <Upload size={18} className="text-gray-600 dark:text-gray-300" />
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
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={uploadAvatar}
                    disabled={loadingAvatar}
                    className="flex items-center justify-center px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                  >
                    {loadingAvatar ? (
                      <RefreshCw size={14} className="animate-spin mr-1" />
                    ) : (
                      <Check size={14} className="mr-1" />
                    )}
                    Salvar
                  </button>
                  
                  <button
                    onClick={cancelAvatarChange}
                    className="flex items-center justify-center px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    <X size={14} className="mr-1" />
                    Cancelar
                  </button>
                </div>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.nome}</h2>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
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
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sessões ativas: <span className="font-semibold">{sessionsCount}</span>
                  {sessionsCount > 1 && (
                    <button
                      onClick={() => setIsLogoutAllModalOpen(true)}
                      className="ml-3 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs underline"
                    >
                      Encerrar todas as sessões
                    </button>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Preferências */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preferências</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="tema_escuro"
                name="tema_escuro"
                checked={preferences.tema_escuro}
                onChange={handlePreferenceChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="tema_escuro" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Tema Escuro
              </label>
            </div>
            
            <div>
              <label htmlFor="idioma" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Idioma
              </label>
              <select
                id="idioma"
                name="idioma"
                value={preferences.idioma}
                onChange={handlePreferenceChange}
                className="w-full md:w-64 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notificacoes"
                name="notificacoes"
                checked={preferences.notificacoes}
                onChange={handlePreferenceChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="notificacoes" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Receber notificações do sistema
              </label>
            </div>
            
            <div className="pt-4">
              <button
                onClick={savePreferences}
                disabled={loadingPreferences}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
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
        
        {/* Alterar Senha */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Alterar Senha</h3>
          
          <form onSubmit={changePassword} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="current_password"
                  name="current_password"
                  value={passwordForm.current_password}
                  onChange={handlePasswordChange}
                  className={`w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 border ${
                    passwordErrors.current_password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="new_password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  className={`w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 border ${
                    passwordErrors.new_password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm_password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange}
                  className={`w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 border ${
                    passwordErrors.confirm_password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordErrors.confirm_password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors.confirm_password}</p>
              )}
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={loadingPassword}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
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
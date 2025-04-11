import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import api, { getAvatarUrl } from '@/services/api';
import { toast } from 'react-toastify';
import { 
  Eye, 
  EyeOff, 
  Check, 
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
  Settings,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Moon,
  Sun
} from 'lucide-react';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // Estados
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
  
  // Efeitos - carregamos dados quando o modal abre
  useEffect(() => {
    if (isOpen && user) {
      loadPreferences();
      loadSessionsCount();
    }
  }, [isOpen, user]);

  useEffect(() => {
    setPreferences(prev => ({
      ...prev,
      tema_escuro: darkMode
    }));
  }, [darkMode]);
  
  // Funções
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
    if (!avatarFile) return;
    
    setLoadingAvatar(true);
    
    try {
      // Usar a nova rota para upload de avatar do próprio usuário
      const response = await api.uploadMyProfilePicture(avatarFile);
      
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
    setLoading(true);
    
    try {
      // Usar a nova rota para remover avatar do próprio usuário
      const response = await api.removeMyProfilePicture();
      
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

  // Calcular força da senha
  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    
    let strength = 0;
    // Pelo menos 8 caracteres
    if (password.length >= 8) strength += 1;
    // Contém letras minúsculas e maiúsculas
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    // Contém números
    if (/\d/.test(password)) strength += 1;
    // Contém caracteres especiais
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    return strength;
  };
  
  const getPasswordStrengthLabel = (strength: number) => {
    switch (strength) {
      case 0:
        return 'Muito fraca';
      case 1:
        return 'Fraca';
      case 2:
        return 'Média';
      case 3:
        return 'Forte';
      case 4:
        return 'Muito forte';
      default:
        return '';
    }
  };
  
  const getPasswordStrengthColor = (strength: number, darkMode: boolean) => {
    switch (strength) {
      case 0:
        return darkMode ? 'bg-red-700' : 'bg-red-500';
      case 1:
        return darkMode ? 'bg-orange-700' : 'bg-orange-500';
      case 2:
        return darkMode ? 'bg-yellow-600' : 'bg-yellow-500';
      case 3:
        return darkMode ? 'bg-green-600' : 'bg-green-500';
      case 4:
        return darkMode ? 'bg-emerald-600' : 'bg-emerald-500';
      default:
        return '';
    }
  };
  
  const newPasswordStrength = getPasswordStrength(passwordForm.new_password);
  
  if (!isOpen || !user) return null;

  // Animações
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const slideUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } }
  };
  
  const tabTransition = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 overflow-y-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fadeIn}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            {/* Overlay com blur */}
            <motion.div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            ></motion.div>
            
            {/* Modal Principal */}
            <motion.div 
              className={`relative bg-white dark:bg-[#1a2331] rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl transform transition-all ring-1 ${
                darkMode ? 'ring-cyan-900/40' : 'ring-cyan-200'
              }`}
              variants={slideUp}
            >
              {/* Botão de fechar com tooltip */}
              <div className="absolute top-4 right-4 z-50">
                <div className="group relative">
                  <button 
                    className="p-2 rounded-full bg-black/10 backdrop-blur-md text-white/90 hover:bg-black/20 transition-all duration-300"
                    onClick={onClose}
                  >
                    <X size={18} />
                  </button>
                  <span className="absolute -bottom-8 right-0 w-auto min-w-max origin-top-right scale-0 rounded-md bg-gray-900 p-2 text-xs text-white shadow-md transition-all duration-200 group-hover:scale-100">
                    Fechar
                  </span>
                </div>
              </div>
              
              {/* Cabeçalho com Banner para o avatar - Modernizado */}
              <div className={`w-full relative bg-gradient-to-r ${
                darkMode
                  ? 'from-cyan-700 via-cyan-600 to-blue-700'
                  : 'from-cyan-500 via-cyan-400 to-blue-500'
              } pt-12 pb-10 px-8`}>
                {/* Padrão geométrico no fundo */}
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
                
                <div className="relative z-10 flex flex-col items-center">
                  {/* Avatar grande e centralizado - Modernizado */}
                  <div className="relative mb-5">
                    <motion.div 
                      className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/90 ring-4 ring-cyan-600/20 shadow-lg mx-auto group"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300"
                        />
                      ) : user.foto_perfil && !imageError ? (
                        <img 
                          src={getAvatarUrl(user.foto_perfil) || undefined} 
                          alt={user.nome}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300"
                          onError={handleImageError}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center text-white text-4xl font-bold">
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      {!avatarPreview && (
                        <label htmlFor="avatar-upload-modal" className="absolute inset-0 flex items-center justify-center opacity-0 bg-black/50 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-full">
                            <Camera size={24} className="text-white" />
                          </div>
                          <input
                            id="avatar-upload-modal"
                            type="file"
                            className="hidden"
                            accept="image/jpeg, image/png, image/gif, image/webp"
                            onChange={handleAvatarChange}
                          />
                        </label>
                      )}
                    </motion.div>
                    
                    {/* Status online indicator */}
                    <motion.div 
                      className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-[#1a2331] rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 500, 
                        damping: 20, 
                        delay: 0.5 
                      }}
                    />
                  </div>
                  
                  {/* Informações do usuário - Modernizadas */}
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {user.nome}
                    </h2>
                    <p className="text-white/90 text-sm mb-3">
                      {user.email}
                    </p>
                    
                    <div className="flex justify-center gap-2 mb-3">
                      <motion.span 
                        className="px-3 py-0.5 text-xs rounded-full font-medium bg-white/20 backdrop-blur-sm text-white border border-white/10"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <Shield className="w-3 h-3 inline-block mr-1" />
                        {user.perfil}
                      </motion.span>
                      <motion.span 
                        className="px-3 py-0.5 text-xs rounded-full font-medium bg-emerald-400/20 backdrop-blur-sm text-white border border-white/10"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1"></span>
                        {user.estado}
                      </motion.span>
                    </div>
                  </motion.div>
                  
                  {/* Botões de avatar */}
                  {avatarPreview ? (
                    <div className="flex justify-center gap-2 mt-2">
                      <motion.button
                        onClick={uploadAvatar}
                        disabled={loadingAvatar}
                        className="px-4 py-1.5 bg-white text-cyan-600 rounded-full text-xs hover:shadow-lg font-medium transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {loadingAvatar ? (
                          <RefreshCw size={14} className="animate-spin mr-1.5 inline" />
                        ) : (
                          <Check size={14} className="mr-1.5 inline" />
                        )}
                        Confirmar foto
                      </motion.button>
                      
                      <motion.button
                        onClick={cancelAvatarChange}
                        className="px-4 py-1.5 bg-black/20 text-white rounded-full text-xs hover:bg-black/30 font-medium transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X size={14} className="mr-1.5 inline" />
                        Cancelar
                      </motion.button>
                    </div>
                  ) : user.foto_perfil ? (
                    <motion.button
                      onClick={handleRemoveAvatar}
                      disabled={loading}
                      className="px-4 py-1.5 bg-red-500/80 text-white rounded-full text-xs font-medium hover:bg-red-600/80 transition-all backdrop-blur-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      {loading ? (
                        <RefreshCw size={14} className="animate-spin mr-1.5 inline" />
                      ) : (
                        <X size={14} className="mr-1.5 inline" />
                      )}
                      Remover foto
                    </motion.button>
                  ) : null}
                </div>
              </div>
              
              {/* Área de navegação - Modernizada */}
              <div className={`flex justify-center px-2 ${
                darkMode ? 'bg-[#1a2331]' : 'bg-white'
              } border-b ${
                darkMode ? 'border-gray-800' : 'border-gray-100'
              }`}>
                <div className="flex space-x-1 -mb-px">
                  <motion.button
                    onClick={() => setActiveTab('profile')}
                    className={`relative px-5 py-3.5 text-center rounded-t-lg ${
                      activeTab === 'profile'
                        ? `${darkMode ? 'text-cyan-400 bg-[#212e42]' : 'text-cyan-600 bg-cyan-50'} font-medium`
                        : `${darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/40' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`
                    } transition-all`}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                  >
                    <div className="flex items-center">
                      <User size={16} className="mr-1.5" />
                      <span className="text-sm">Informações</span>
                    </div>
                    {activeTab === 'profile' && (
                      <motion.div 
                        className={`absolute bottom-0 left-0 right-0 h-0.5 ${darkMode ? 'bg-cyan-400' : 'bg-cyan-500'}`}
                        layoutId="activeTab"
                      />
                    )}
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setActiveTab('preferences')}
                    className={`relative px-5 py-3.5 text-center rounded-t-lg ${
                      activeTab === 'preferences'
                        ? `${darkMode ? 'text-cyan-400 bg-[#212e42]' : 'text-cyan-600 bg-cyan-50'} font-medium`
                        : `${darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/40' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`
                    } transition-all`}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                  >
                    <div className="flex items-center">
                      <Settings size={16} className="mr-1.5" />
                      <span className="text-sm">Preferências</span>
                    </div>
                    {activeTab === 'preferences' && (
                      <motion.div 
                        className={`absolute bottom-0 left-0 right-0 h-0.5 ${darkMode ? 'bg-cyan-400' : 'bg-cyan-500'}`}
                        layoutId="activeTab"
                      />
                    )}
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setActiveTab('security')}
                    className={`relative px-5 py-3.5 text-center rounded-t-lg ${
                      activeTab === 'security'
                        ? `${darkMode ? 'text-cyan-400 bg-[#212e42]' : 'text-cyan-600 bg-cyan-50'} font-medium`
                        : `${darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/40' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`
                    } transition-all`}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                  >
                    <div className="flex items-center">
                      <Lock size={16} className="mr-1.5" />
                      <span className="text-sm">Segurança</span>
                    </div>
                    {activeTab === 'security' && (
                      <motion.div 
                        className={`absolute bottom-0 left-0 right-0 h-0.5 ${darkMode ? 'bg-cyan-400' : 'bg-cyan-500'}`}
                        layoutId="activeTab"
                      />
                    )}
                  </motion.button>
                </div>
              </div>
              
              {/* Área de conteúdo principal */}
              <div className={`${darkMode ? 'bg-[#212e42]' : 'bg-gray-50'} p-6 max-h-[60vh] overflow-y-auto`}>
                <AnimatePresence mode="wait">
                  {/* Tab de Informações do Perfil */}
                  {activeTab === 'profile' && (
                    <motion.div
                      key="profile-tab"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={tabTransition}
                    >
                      <div className="flex items-center mb-5">
                        <div className={`p-2 rounded-full mr-3 ${
                          darkMode ? 'bg-cyan-500/10' : 'bg-cyan-100/50'
                        }`}>
                          <User size={18} className={`${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        </div>
                        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Informações do Perfil
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ID */}
                        <motion.div 
                          className={`rounded-xl p-4 ${
                            darkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm hover:shadow-md transition-all`}
                          whileHover={{ y: -2, boxShadow: darkMode ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}
                          transition={{ duration: 0.2 }}
                        >
                          <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-1.5`}>
                            ID do Usuário
                          </h4>
                          <div className="flex items-center">
                            <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-mono text-sm bg-gray-100 dark:bg-gray-800/80 px-2 py-1 rounded`}>
                              {user.id}
                            </p>
                          </div>
                        </motion.div>
                        
                        {/* Estado */}
                        <motion.div 
                          className={`rounded-xl p-4 ${
                            darkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm hover:shadow-md transition-all`}
                          whileHover={{ y: -2, boxShadow: darkMode ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}
                          transition={{ duration: 0.2 }}
                        >
                          <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-1.5`}>
                            Estado da Conta
                          </h4>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            darkMode 
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                            {user.estado}
                          </span>
                        </motion.div>
                        
                        {/* Nome Completo */}
                        <motion.div 
                          className={`rounded-xl p-4 ${
                            darkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm hover:shadow-md transition-all`}
                          whileHover={{ y: -2, boxShadow: darkMode ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}
                          transition={{ duration: 0.2 }}
                        >
                          <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-1.5`}>
                            Nome Completo
                          </h4>
                          <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>
                            {user.nome}
                          </p>
                        </motion.div>
                        
                        {/* Email */}
                        <motion.div 
                          className={`rounded-xl p-4 ${
                            darkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm hover:shadow-md transition-all`}
                          whileHover={{ y: -2, boxShadow: darkMode ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}
                          transition={{ duration: 0.2 }}
                        >
                          <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-1.5`}>
                            Email
                          </h4>
                          <p className={`${darkMode ? 'text-white' : 'text-gray-900'} break-all font-medium`}>
                            {user.email}
                          </p>
                        </motion.div>
                        
                        {/* Perfil */}
                        <motion.div 
                          className={`rounded-xl p-4 ${
                            darkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm hover:shadow-md transition-all`}
                          whileHover={{ y: -2, boxShadow: darkMode ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}
                          transition={{ duration: 0.2 }}
                        >
                          <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-1.5`}>
                            Nível de Acesso
                          </h4>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            darkMode 
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' 
                              : 'bg-cyan-50 text-cyan-700 border border-cyan-100'
                          }`}>
                            <Shield className="w-3.5 h-3.5 mr-1" />
                            {user.perfil}
                          </span>
                        </motion.div>
                        
                        {/* Autenticação de Dois Fatores */}
                        <motion.div 
                          className={`rounded-xl p-4 ${
                            darkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm hover:shadow-md transition-all`}
                          whileHover={{ y: -2, boxShadow: darkMode ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}
                          transition={{ duration: 0.2 }}
                        >
                          <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-1.5`}>
                            Autenticação de Dois Fatores
                          </h4>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.dois_fatores_ativo
                              ? darkMode 
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : darkMode 
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {user.dois_fatores_ativo ? (
                              <>
                                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                Ativada
                              </>
                            ) : (
                              <>
                                <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                                Desativada
                              </>
                            )}
                          </span>
                        </motion.div>
                        
                        {/* Sessões ativas - compactado para o modal */}
                        <motion.div 
                          className={`rounded-xl p-4 ${
                            darkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm col-span-2 hover:shadow-md transition-all`}
                          whileHover={{ y: -2, boxShadow: darkMode ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-full mr-3 ${
                                darkMode ? 'bg-cyan-500/10' : 'bg-cyan-100/50'
                              }`}>
                                <Shield size={16} className={`${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                              </div>
                              <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Sessões Ativas
                              </h4>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              darkMode 
                                ? 'bg-gray-700 text-gray-100' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {sessionsCount}
                            </span>
                          </div>
                          
                          <div className={`rounded-lg p-3 ${darkMode ? 'bg-gray-800/60' : 'bg-gray-100/70'}`}>
                            <div className="flex items-center">
                              <div className={`h-2 w-2 rounded-full ${sessionsCount > 0 ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {sessionsCount === 1 ? '1 sessão ativa' : `${sessionsCount} sessões ativas`}
                              </span>
                            </div>
                          </div>
                          
                          {sessionsCount > 1 && (
                            <motion.button
                              onClick={() => setIsLogoutAllModalOpen(true)}
                              className={`w-full flex items-center justify-center px-4 py-2 text-sm font-medium ${
                                darkMode 
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                                  : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                              } border rounded-lg mt-3 transition-all`}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <LogOut size={16} className="mr-2" />
                              Encerrar todas as sessões
                            </motion.button>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Tab de Preferências */}
                  {activeTab === 'preferences' && (
                    <motion.div
                      key="preferences-tab"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={tabTransition}
                    >
                      <div className="flex items-center mb-5">
                        <div className={`p-2 rounded-full mr-3 ${
                          darkMode ? 'bg-cyan-500/10' : 'bg-cyan-100/50'
                        }`}>
                          <Settings size={18} className={`${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        </div>
                        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Preferências do Sistema
                        </h3>
                      </div>
                      
                      <div className="space-y-5">
                        {/* Tema Escuro */}
                        <motion.div 
                          className={`rounded-xl p-5 ${
                            darkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm hover:shadow-md transition-all`}
                          whileHover={{ y: -2, boxShadow: darkMode ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`p-2.5 rounded-full mr-4 ${
                                darkMode 
                                  ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/10' 
                                  : 'bg-gradient-to-br from-cyan-100 to-blue-100 border border-cyan-200/50'
                              }`}>
                                <Palette className={`h-5 w-5 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                              </div>
                              <div>
                                <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-0.5`}>
                                  Tema Escuro
                                </h4>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Altere entre tema claro e escuro para melhor conforto visual
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  id="tema_escuro_modal"
                                  name="tema_escuro"
                                  checked={preferences.tema_escuro}
                                  onChange={handlePreferenceChange}
                                  className="sr-only"
                                />
                                <div className={`w-12 h-6 ${
                                  darkMode ? 'bg-gray-700' : 'bg-gray-300'
                                } rounded-full peer ${
                                  preferences.tema_escuro 
                                    ? darkMode ? 'bg-cyan-600' : 'bg-cyan-500' 
                                    : ''
                                } transition-colors`}>
                                  <div className={`absolute top-[2px] left-[2px] flex items-center justify-center w-5 h-5 ${
                                    preferences.tema_escuro ? 'bg-white text-cyan-600' : 'bg-white text-amber-500'  
                                  } rounded-full shadow-md transition-all duration-300 ${
                                    preferences.tema_escuro ? 'translate-x-6' : ''
                                  }`}>
                                    {preferences.tema_escuro ? (
                                      <Moon size={10} />
                                    ) : (
                                      <Sun size={10} />
                                    )}
                                  </div>
                                </div>
                              </label>
                            </div>
                          </div>
                        </motion.div>
                        
                        {/* Idioma */}
                        <motion.div 
                          className={`rounded-xl p-5 ${
                            darkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm hover:shadow-md transition-all`}
                          whileHover={{ y: -2, boxShadow: darkMode ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                            <div className="flex items-center">
                              <div className={`p-2.5 rounded-full mr-4 ${
                                darkMode 
                                  ? 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/10' 
                                  : 'bg-gradient-to-br from-purple-100 to-indigo-100 border border-purple-200/50'
                              }`}>
                                <Globe className={`h-5 w-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                              </div>
                              <div>
                                <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-0.5`}>
                                  Idioma
                                </h4>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Escolha o idioma para exibição do sistema
                                </p>
                              </div>
                            </div>
                            <div>
                              <select
                                id="idioma_modal"
                                name="idioma"
                                value={preferences.idioma}
                                onChange={handlePreferenceChange}
                                className={`w-full md:w-44 rounded-lg border px-3 py-2 ${
                                  darkMode 
                                    ? 'bg-gray-800 border-gray-700 text-white focus:ring-purple-500' 
                                    : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500'
                                } focus:outline-none focus:ring-2 focus:border-transparent transition-colors appearance-none`}
                                style={{
                                  backgroundImage: darkMode 
                                    ? 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")'
                                    : 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")',
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'right 0.75rem center',
                                  backgroundSize: '1rem',
                                  paddingRight: '2.5rem'
                                }}
                              >
                                <option value="pt">Português</option>
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="fr">Français</option>
                              </select>
                            </div>
                          </div>
                        </motion.div>
                        
                        {/* Notificações */}
                        <motion.div 
                          className={`rounded-xl p-5 ${
                            darkMode 
                              ? 'bg-[#1a2331] border-gray-800' 
                              : 'bg-white border-gray-200'
                            } border shadow-sm hover:shadow-md transition-all`}
                          whileHover={{ y: -2, boxShadow: darkMode ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`p-2.5 rounded-full mr-4 ${
                                darkMode 
                                  ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/10' 
                                  : 'bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200/50'
                              }`}>
                                <Bell className={`h-5 w-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                              </div>
                              <div>
                                <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-0.5`}>
                                  Notificações
                                </h4>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Receber notificações e alertas do sistema
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  id="notificacoes_modal"
                                  name="notificacoes"
                                  checked={preferences.notificacoes}
                                  onChange={handlePreferenceChange}
                                  className="sr-only"
                                />
                                <div className={`w-12 h-6 ${
                                  darkMode ? 'bg-gray-700' : 'bg-gray-300'
                                } rounded-full peer ${
                                  preferences.notificacoes 
                                    ? darkMode ? 'bg-amber-600' : 'bg-amber-500' 
                                    : ''
                                } transition-colors`}>
                                  <div className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                                    preferences.notificacoes ? 'translate-x-6' : ''
                                  }`}></div>
                                </div>
                              </label>
                            </div>
                          </div>
                        </motion.div>
                        
                        {/* Botão Salvar */}
                        <div className="flex justify-end mt-7">
                          <motion.button
                            onClick={savePreferences}
                            disabled={loadingPreferences}
                            className={`px-5 py-2.5 ${
                              darkMode 
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700' 
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                            } text-white rounded-lg font-medium flex items-center text-sm shadow-lg ${
                              darkMode 
                                ? 'shadow-cyan-900/20' 
                                : 'shadow-cyan-500/20'
                            } transition-all`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
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
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Tab de Segurança */}
                  {activeTab === 'security' && (
                    <motion.div
                      key="security-tab"
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={tabTransition}
                    >
                      <div className="flex items-center mb-5">
                        <div className={`p-2 rounded-full mr-3 ${
                          darkMode ? 'bg-cyan-500/10' : 'bg-cyan-100/50'
                        }`}>
                          <Lock size={18} className={`${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        </div>
                        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Alterar Senha
                        </h3>
                      </div>
                      
                      <motion.div 
                        className={`rounded-xl p-6 ${
                          darkMode 
                            ? 'bg-[#1a2331] border-gray-800' 
                            : 'bg-white border-gray-200'
                          } border shadow-sm hover:shadow-md transition-all`}
                        whileHover={{ y: -2, boxShadow: darkMode ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)' }}
                        transition={{ duration: 0.2 }}
                      >
                        <form onSubmit={changePassword} className="space-y-5 max-w-lg">
                          {/* Senha Atual */}
                          <div>
                            <label htmlFor="current_password_modal" className={`block text-sm font-medium ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            } mb-2`}>
                              Senha Atual
                            </label>
                            <div className="relative">
                              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                                passwordErrors.current_password 
                                  ? 'text-red-500' 
                                  : 'text-gray-400'
                              }`}>
                                <Key size={16} />
                              </div>
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                id="current_password_modal"
                                name="current_password"
                                value={passwordForm.current_password}
                                onChange={handlePasswordChange}
                                className={`w-full pl-10 pr-10 py-2.5 rounded-lg ${
                                  passwordErrors.current_password 
                                    ? darkMode 
                                      ? 'border-red-500/50 bg-red-900/10' 
                                      : 'border-red-500 bg-red-50'
                                    : darkMode 
                                      ? 'border-gray-700 bg-gray-800 focus:border-cyan-500' 
                                      : 'border-gray-300 bg-white focus:border-cyan-500'
                                } ${
                                  darkMode ? 'text-white' : 'text-gray-900'
                                } focus:outline-none focus:ring-2 ${
                                  passwordErrors.current_password 
                                    ? 'focus:ring-red-500/20' 
                                    : 'focus:ring-cyan-500/20'
                                } transition-all border`}
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
                              <p className="mt-1.5 text-sm text-red-500 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                {passwordErrors.current_password}
                              </p>
                            )}
                          </div>
                          
                          {/* Nova Senha */}
                          <div>
                            <label htmlFor="new_password_modal" className={`block text-sm font-medium ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            } mb-2`}>
                              Nova Senha
                            </label>
                            <div className="relative">
                              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                                passwordErrors.new_password 
                                  ? 'text-red-500' 
                                  : 'text-gray-400'
                              }`}>
                                <Key size={16} />
                              </div>
                              <input
                                type={showNewPassword ? "text" : "password"}
                                id="new_password_modal"
                                name="new_password"
                                value={passwordForm.new_password}
                                onChange={handlePasswordChange}
                                className={`w-full pl-10 pr-10 py-2.5 rounded-lg ${
                                  passwordErrors.new_password 
                                    ? darkMode 
                                      ? 'border-red-500/50 bg-red-900/10' 
                                      : 'border-red-500 bg-red-50'
                                    : darkMode 
                                      ? 'border-gray-700 bg-gray-800 focus:border-cyan-500' 
                                      : 'border-gray-300 bg-white focus:border-cyan-500'
                                } ${
                                  darkMode ? 'text-white' : 'text-gray-900'
                                } focus:outline-none focus:ring-2 ${
                                  passwordErrors.new_password 
                                    ? 'focus:ring-red-500/20' 
                                    : 'focus:ring-cyan-500/20'
                                } transition-all border`}
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
                            {passwordErrors.new_password ? (
                              <p className="mt-1.5 text-sm text-red-500 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                {passwordErrors.new_password}
                              </p>
                            ) : passwordForm.new_password && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {getPasswordStrengthLabel(newPasswordStrength)}
                                  </div>
                                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {newPasswordStrength * 25}%
                                  </div>
                                </div>
                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-300 ${
                                      getPasswordStrengthColor(newPasswordStrength, darkMode)
                                    }`}
                                    style={{ width: `${newPasswordStrength * 25}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Confirmar Nova Senha */}
                          <div>
                            <label htmlFor="confirm_password_modal" className={`block text-sm font-medium ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            } mb-2`}>
                              Confirmar Nova Senha
                            </label>
                            <div className="relative">
                              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                                passwordErrors.confirm_password 
                                  ? 'text-red-500' 
                                  : 'text-gray-400'
                              }`}>
                                <Key size={16} />
                              </div>
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirm_password_modal"
                                name="confirm_password"
                                value={passwordForm.confirm_password}
                                onChange={handlePasswordChange}
                                className={`w-full pl-10 pr-10 py-2.5 rounded-lg ${
                                  passwordErrors.confirm_password 
                                    ? darkMode 
                                      ? 'border-red-500/50 bg-red-900/10' 
                                      : 'border-red-500 bg-red-50'
                                    : darkMode 
                                      ? 'border-gray-700 bg-gray-800 focus:border-cyan-500' 
                                      : 'border-gray-300 bg-white focus:border-cyan-500'
                                } ${
                                  darkMode ? 'text-white' : 'text-gray-900'
                                } focus:outline-none focus:ring-2 ${
                                  passwordErrors.confirm_password 
                                    ? 'focus:ring-red-500/20' 
                                    : 'focus:ring-cyan-500/20'
                                } transition-all border`}
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
                              <p className="mt-1.5 text-sm text-red-500 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                {passwordErrors.confirm_password}
                              </p>
                            )}
                          </div>
                          
                          {/* Botão Alterar Senha */}
                          <div className="pt-3">
                            <motion.button
                              type="submit"
                              disabled={loadingPassword}
                              className={`w-full px-5 py-3 ${
                                darkMode 
                                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700' 
                                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                              } text-white rounded-lg font-medium flex items-center justify-center text-sm shadow-lg ${
                                darkMode 
                                  ? 'shadow-cyan-900/20' 
                                  : 'shadow-cyan-500/20'
                              } transition-all`}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
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
                            </motion.button>
                          </div>
                          
                          {/* Dicas de senha forte */}
                          <div className={`mt-4 p-4 rounded-lg ${
                            darkMode ? 'bg-gray-800/60' : 'bg-gray-100/80'
                          }`}>
                            <h5 className={`text-sm font-medium mb-2 ${
                              darkMode ? 'text-gray-200' : 'text-gray-700'
                            }`}>
                              <Sparkles size={14} className="inline-block mr-1.5" />
                              Dicas para uma senha forte
                            </h5>
                            <ul className={`space-y-1 text-xs ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <li className="flex items-center">
                                <ArrowRight size={10} className="mr-1.5" />
                                Use pelo menos 8 caracteres
                              </li>
                              <li className="flex items-center">
                                <ArrowRight size={10} className="mr-1.5" />
                                Combine letras maiúsculas e minúsculas
                              </li>
                              <li className="flex items-center">
                                <ArrowRight size={10} className="mr-1.5" />
                                Inclua números e símbolos especiais
                              </li>
                              <li className="flex items-center">
                                <ArrowRight size={10} className="mr-1.5" />
                                Evite informações pessoais ou sequências óbvias
                              </li>
                            </ul>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
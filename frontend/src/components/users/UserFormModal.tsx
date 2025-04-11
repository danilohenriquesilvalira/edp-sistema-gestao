import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { toast } from 'react-toastify';
import { 
  Eye, 
  EyeOff, 
  X, 
  User as UserIcon, 
  Mail, 
  Lock, 
  UserCheck, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  SaveIcon,
  BadgeCheck,
  UserPlus 
} from 'lucide-react';
import { User } from '@/contexts/AuthContext';
import axios, { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  user?: User;
}

interface UserFormData {
  nome: string;
  email: string;
  password?: string;
  perfil: 'Administrador' | 'Utilizador';
  estado: 'Ativo' | 'Inativo';
  dois_fatores_ativo: boolean;
}

// Definição do estado inicial do formulário em branco
const initialFormState: UserFormData = {
  nome: '',
  email: '',
  password: '',
  perfil: 'Utilizador',
  estado: 'Ativo',
  dois_fatores_ativo: false
};

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const isEditing = !!user;
  
  // Identificador único para o formulário - forçar reset completo
  const formId = isEditing ? `edit-user-${user?.id}` : 'new-user-form';
  
  // Inicializa com estado vazio para novos usuários ou dados do usuário para edição
  const [formData, setFormData] = useState<UserFormData>(
    user ? {
      nome: user.nome || '',
      email: user.email || '',
      password: '',
      perfil: user.perfil as 'Administrador' | 'Utilizador',
      estado: user.estado as 'Ativo' | 'Inativo',
      dois_fatores_ativo: user.dois_fatores_ativo || false
    } : initialFormState
  );
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState(false);
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

  // Efeito para gerenciar o formulário quando o modal abre e fecha
  useEffect(() => {
    if (isOpen) {
      // Resetar o estado touched a cada abertura
      setFormTouched(false);
      
      // Limpar os erros
      setErrors({});
      
      // IMPORTANTE: Forçar reset do formulário para novos usuários
      if (!isEditing) {
        // Reset forçado para garantir que sempre começa vazio
        setFormData({...initialFormState});
        
        // Limpar qualquer valor que possa estar no DOM
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        if (emailField) (emailField as HTMLInputElement).value = '';
        if (passwordField) (passwordField as HTMLInputElement).value = '';
      } else if (user) {
        // Se estiver editando, preenche com dados do usuário
        setFormData({
          nome: user.nome || '',
          email: user.email || '',
          password: '', // Senha sempre vazia na edição
          perfil: user.perfil as 'Administrador' | 'Utilizador',
          estado: user.estado as 'Ativo' | 'Inativo',
          dois_fatores_ativo: user.dois_fatores_ativo || false
        });
      }
      
      // Adicionar classe para impedir scroll no body
      document.body.classList.add('overflow-hidden');
    }

    // Quando o modal fechar, limpar formulário e remover a classe
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [user, isOpen, isEditing]); // Dependências atualizadas

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!isEditing && !formData.password) {
      newErrors.password = 'Senha é obrigatória para novos utilizadores';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Limpar erro quando o campo é editado
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }

    if (!formTouched) {
      setFormTouched(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Preparar dados para envio
      const payload = { ...formData };
      
      // Se estiver editando e a senha estiver vazia, remover do payload
      if (isEditing && !payload.password) {
        delete payload.password;
      }
      
      if (isEditing && user) {
        await api.updateUser(user.id, payload);
        toast.success('Utilizador atualizado com sucesso!', {
          icon: <CheckCircle2 className="text-green-500" size={24} />,
          className: 'bg-white dark:bg-gray-800 shadow-lg rounded-lg'
        });
      } else {
        await api.createUser(payload);
        toast.success('Utilizador criado com sucesso!', {
          icon: <CheckCircle2 className="text-green-500" size={24} />,
          className: 'bg-white dark:bg-gray-800 shadow-lg rounded-lg'
        });
      }
      
      onSave();
    } catch (error: unknown) {
      console.error('Erro ao salvar utilizador:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response) {
          if (axiosError.response.status === 409) {
            toast.error('Este email já está em uso por outro utilizador', {
              icon: <AlertCircle className="text-red-500" size={24} />,
              className: 'bg-white dark:bg-gray-800 shadow-lg rounded-lg'
            });
          } else if (axiosError.response.data && typeof axiosError.response.data === 'object' && 'mensagem' in axiosError.response.data) {
            toast.error(axiosError.response.data.mensagem as string, {
              icon: <AlertCircle className="text-red-500" size={24} />,
              className: 'bg-white dark:bg-gray-800 shadow-lg rounded-lg'
            });
          } else {
            toast.error('Erro ao salvar utilizador', {
              icon: <AlertCircle className="text-red-500" size={24} />,
              className: 'bg-white dark:bg-gray-800 shadow-lg rounded-lg'
            });
          }
        } else if (axiosError.request) {
          toast.error('Não foi possível conectar ao servidor', {
            icon: <AlertCircle className="text-red-500" size={24} />,
            className: 'bg-white dark:bg-gray-800 shadow-lg rounded-lg'
          });
        } else {
          toast.error('Erro ao salvar utilizador', {
            icon: <AlertCircle className="text-red-500" size={24} />,
            className: 'bg-white dark:bg-gray-800 shadow-lg rounded-lg'
          });
        }
      } else {
        toast.error('Erro ao salvar utilizador', {
          icon: <AlertCircle className="text-red-500" size={24} />,
          className: 'bg-white dark:bg-gray-800 shadow-lg rounded-lg'
        });
      }
    } finally {
      setLoading(false);
    }
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

  // Função para obter descrição da força da senha
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

  // Função para obter a cor da barra de força da senha
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

  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : 0;

  // Definir variantes para animações
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 350, 
        damping: 30 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 20,
      transition: { 
        duration: 0.2,
        ease: "easeOut" 
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
          {/* Backdrop com blur melhorado */}
          <motion.div 
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            className="fixed inset-0 backdrop-blur-sm"
            aria-hidden="true"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-black/40 dark:bg-gray-900/80"></div>
          </motion.div>

          {/* Modal com design 2025 */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="relative bg-white dark:bg-[#1a2331] rounded-2xl overflow-hidden shadow-2xl transform w-full max-w-lg mx-4 my-8 border border-gray-100 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com gradiente e design moderno */}
            <div className="relative bg-gradient-to-r from-cyan-700 via-cyan-600 to-blue-700 dark:from-cyan-800 dark:to-blue-800 px-6 py-6">
              {/* Padrão geométrico para dar textura */}
              <div className="absolute inset-0 overflow-hidden opacity-20">
                <svg className="absolute left-0 top-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {[...Array(8)].map((_, i) => (
                    <polygon
                      key={i}
                      points={`${Math.random() * 100},${Math.random() * 100} ${Math.random() * 100},${Math.random() * 100} ${Math.random() * 100},${Math.random() * 100}`}
                      fill="rgba(255,255,255,0.1)"
                    />
                  ))}
                </svg>
              </div>
              
              <div className="flex justify-between items-center relative z-10">
                <h3 className="text-xl font-semibold text-white tracking-wide">
                  {isEditing ? 'Editar Utilizador' : 'Novo Utilizador'}
                </h3>
                <button
                  type="button"
                  className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                  onClick={onClose}
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Indicador visual reposicionado e redesenhado */}
            <div className="relative -mt-4 flex justify-center">
              <div className="bg-white dark:bg-[#212e42] shadow-lg text-cyan-600 dark:text-cyan-400 rounded-full px-5 py-1.5 text-sm font-medium flex items-center space-x-2 border border-cyan-100 dark:border-cyan-800/30">
                {isEditing ? (
                  <>
                    <UserCheck size={16} />
                    <span>Editando Perfil</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Criando Novo</span>
                  </>
                )}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-5" autoComplete="off" id={formId} key={formId}>
              <div className="px-6 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Nome */}
                <div className="space-y-1.5">
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Nome
                    {errors.nome && (
                      <span className="ml-auto text-xs text-red-500 font-normal">
                        Campo obrigatório
                      </span>
                    )}
                  </label>
                  <div className={`relative rounded-xl shadow-sm transition-all duration-200 ${
                    errors.nome 
                      ? 'ring-2 ring-red-500/30 dark:ring-red-500/30' 
                      : formData.nome && formTouched 
                        ? 'ring-2 ring-cyan-500/30 dark:ring-cyan-500/30' 
                        : 'hover:ring-2 hover:ring-cyan-500/20 dark:hover:ring-cyan-500/20'
                  }`}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon size={18} className={`${
                        errors.nome 
                          ? 'text-red-500' 
                          : formData.nome && formTouched 
                            ? 'text-cyan-500 dark:text-cyan-400' 
                            : 'text-gray-400 dark:text-gray-500'
                      }`} />
                    </div>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      placeholder="Digite o nome completo"
                      className={`block w-full pl-10 pr-3 py-3 border ${
                        errors.nome 
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-200 dark:border-gray-700 focus:ring-cyan-500 focus:border-cyan-500'
                      } rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200`}
                    />
                  </div>
                </div>
                
                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    Email
                    {errors.email && (
                      <span className="ml-auto text-xs text-red-500 font-normal">
                        {errors.email}
                      </span>
                    )}
                  </label>
                  <div className={`relative rounded-xl shadow-sm transition-all duration-200 ${
                    errors.email 
                      ? 'ring-2 ring-red-500/30 dark:ring-red-500/30' 
                      : formData.email && formTouched 
                        ? 'ring-2 ring-cyan-500/30 dark:ring-cyan-500/30' 
                        : 'hover:ring-2 hover:ring-cyan-500/20 dark:hover:ring-cyan-500/20'
                  }`}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className={`${
                        errors.email 
                          ? 'text-red-500' 
                          : formData.email && formTouched 
                            ? 'text-cyan-500 dark:text-cyan-400' 
                            : 'text-gray-400 dark:text-gray-500'
                      }`} />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="exemplo@dominio.com"
                      autoComplete="new-email"
                      className={`block w-full pl-10 pr-3 py-3 border ${
                        errors.email 
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-200 dark:border-gray-700 focus:ring-cyan-500 focus:border-cyan-500'
                      } rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200`}
                    />
                  </div>
                </div>
                
                {/* Senha */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    {isEditing ? 'Senha (opcional)' : 'Senha'}
                    {errors.password && (
                      <span className="ml-auto text-xs text-red-500 font-normal">
                        {errors.password}
                      </span>
                    )}
                  </label>
                  <div className={`relative rounded-xl shadow-sm transition-all duration-200 ${
                    errors.password 
                      ? 'ring-2 ring-red-500/30 dark:ring-red-500/30' 
                      : formData.password && formTouched 
                        ? 'ring-2 ring-cyan-500/30 dark:ring-cyan-500/30' 
                        : 'hover:ring-2 hover:ring-cyan-500/20 dark:hover:ring-cyan-500/20'
                  }`}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className={`${
                        errors.password 
                          ? 'text-red-500' 
                          : formData.password && formTouched 
                            ? 'text-cyan-500 dark:text-cyan-400' 
                            : 'text-gray-400 dark:text-gray-500'
                      }`} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password || ''}
                      onChange={handleChange}
                      placeholder={isEditing ? "••••••••••" : "Mínimo 6 caracteres"}
                      autoComplete="new-password"
                      className={`block w-full pl-10 pr-12 py-3 border ${
                        errors.password 
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-200 dark:border-gray-700 focus:ring-cyan-500 focus:border-cyan-500'
                      } rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.password && !errors.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {getPasswordStrengthLabel(passwordStrength)}
                        </div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {passwordStrength * 25}%
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            getPasswordStrengthColor(passwordStrength, isDarkMode)
                          }`}
                          style={{ width: `${passwordStrength * 25}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Seletores de Perfil e Estado em flex row com design melhorado */}
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Perfil */}
                  <div className="flex-1 space-y-1.5">
                    <label htmlFor="perfil" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Perfil
                    </label>
                    <div className="relative rounded-xl shadow-sm hover:ring-2 hover:ring-cyan-500/20 dark:hover:ring-cyan-500/20 transition-all duration-200">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield size={18} className="text-gray-400 dark:text-gray-500" />
                      </div>
                      <select
                        id="perfil"
                        name="perfil"
                        value={formData.perfil}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 focus:ring-cyan-500 focus:border-cyan-500 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 appearance-none"
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Utilizador">Utilizador</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        formData.perfil === 'Administrador'
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/30'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30'
                      }`}>
                        <BadgeCheck className="w-3 h-3 mr-1" />
                        {formData.perfil}
                      </span>
                    </div>
                  </div>
                  
                  {/* Estado */}
                  <div className="flex-1 space-y-1.5">
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Estado
                    </label>
                    <div className="relative rounded-xl hover:ring-2 hover:ring-cyan-500/20 dark:hover:ring-cyan-500/20 transition-all duration-200">
                      <select
                        id="estado"
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        className="block w-full py-3 pl-3 pr-10 border border-gray-200 dark:border-gray-700 focus:ring-cyan-500 focus:border-cyan-500 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 appearance-none"
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        formData.estado === 'Ativo'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800/30'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                          formData.estado === 'Ativo' ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        {formData.estado}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Switch de Autenticação de dois fatores modernizado */}
                <div className="mt-6">
                  <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors duration-200
                    ${isDarkMode 
                      ? 'bg-[#212e42] border-gray-700 hover:border-cyan-700/50' 
                      : 'bg-gray-50 border-gray-200 hover:border-cyan-300/50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`flex items-center justify-center p-2 rounded-lg mr-3 
                        ${isDarkMode 
                          ? 'bg-cyan-500/10 text-cyan-400' 
                          : 'bg-cyan-100 text-cyan-700'
                        }`}
                      >
                        <Shield size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Autenticação de dois fatores
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Maior segurança para o acesso à conta
                        </div>
                      </div>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="dois_fatores_ativo"
                        name="dois_fatores_ativo"
                        checked={formData.dois_fatores_ativo}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600 dark:peer-checked:bg-cyan-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Footer com botões modernizados e mais sofisticados */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-[#1a2331] border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 rounded-b-2xl">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-200"
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                >
                  Cancelar
                </motion.button>
                
                <motion.button
                  type="submit"
                  disabled={loading}
                  className={`relative py-2.5 px-6 rounded-xl shadow-md text-sm font-medium text-white ${
                    loading 
                      ? 'bg-cyan-600 dark:bg-cyan-700' 
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-200 overflow-hidden`}
                  whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                  whileTap={{ y: 0 }}
                >
                  {loading ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  ) : null}
                  <span className={loading ? 'opacity-0' : 'opacity-100'}>
                    <SaveIcon size={16} className="inline-block mr-2 -ml-1" />
                    {isEditing ? 'Atualizar' : 'Criar'} Utilizador
                  </span>
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UserFormModal;
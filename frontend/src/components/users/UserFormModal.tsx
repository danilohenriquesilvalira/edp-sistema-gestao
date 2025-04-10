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
  AlertCircle 
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

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const isEditing = !!user;
  
  const [formData, setFormData] = useState<UserFormData>({
    nome: '',
    email: '',
    password: '',
    perfil: 'Utilizador',
    estado: 'Ativo',
    dois_fatores_ativo: false
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || '',
        email: user.email || '',
        password: '',
        perfil: user.perfil as 'Administrador' | 'Utilizador',
        estado: user.estado as 'Ativo' | 'Inativo',
        dois_fatores_ativo: user.dois_fatores_ativo || false
      });
    }

    // Quando o modal abrir, adicionar classe para impedir scroll no body
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    }

    // Quando o modal fechar, remover a classe
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [user, isOpen]);

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
          {/* Backdrop com blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 backdrop-blur-sm"
            aria-hidden="true"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-70"></div>
          </motion.div>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl transform w-full max-w-lg mx-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com gradiente */}
            <div className="relative bg-gradient-to-r from-teal-500 to-cyan-600 dark:from-teal-600 dark:to-cyan-700 px-6 py-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  {isEditing ? 'Editar Utilizador' : 'Novo Utilizador'}
                </h3>
                <button
                  type="button"
                  className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                  onClick={onClose}
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Indicador visual do tipo de operação */}
              <div className="absolute -bottom-4 left-0 right-0 flex justify-center">
                <div className="bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 rounded-full px-4 py-1 text-sm font-semibold shadow-md flex items-center space-x-1.5">
                  {isEditing ? (
                    <>
                      <UserCheck size={16} />
                      <span>Editando Perfil</span>
                    </>
                  ) : (
                    <>
                      <UserIcon size={16} />
                      <span>Criando Novo</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="px-6 py-4 space-y-5">
                {/* Nome */}
                <div className="space-y-1.5">
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nome
                  </label>
                  <div className={`relative rounded-lg shadow-sm ${
                    errors.nome 
                      ? 'ring-2 ring-red-500 dark:ring-red-500' 
                      : formData.nome && formTouched 
                        ? 'ring-2 ring-green-500 dark:ring-green-500' 
                        : ''
                  }`}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon size={18} className={`${
                        errors.nome 
                          ? 'text-red-500' 
                          : formData.nome && formTouched 
                            ? 'text-green-500' 
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
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        errors.nome 
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500'
                      } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200`}
                    />
                    {errors.nome && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center mt-1.5"
                      >
                        <AlertCircle size={14} className="text-red-500 mr-1.5" />
                        <p className="text-sm text-red-600 dark:text-red-400">{errors.nome}</p>
                      </motion.div>
                    )}
                  </div>
                </div>
                
                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className={`relative rounded-lg shadow-sm ${
                    errors.email 
                      ? 'ring-2 ring-red-500 dark:ring-red-500' 
                      : formData.email && formTouched 
                        ? 'ring-2 ring-green-500 dark:ring-green-500' 
                        : ''
                  }`}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className={`${
                        errors.email 
                          ? 'text-red-500' 
                          : formData.email && formTouched 
                            ? 'text-green-500' 
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
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        errors.email 
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500'
                      } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200`}
                    />
                    {errors.email && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center mt-1.5"
                      >
                        <AlertCircle size={14} className="text-red-500 mr-1.5" />
                        <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                      </motion.div>
                    )}
                  </div>
                </div>
                
                {/* Senha */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isEditing ? 'Senha (deixe em branco para manter a atual)' : 'Senha'}
                  </label>
                  <div className={`relative rounded-lg shadow-sm ${
                    errors.password 
                      ? 'ring-2 ring-red-500 dark:ring-red-500' 
                      : formData.password && formTouched 
                        ? 'ring-2 ring-green-500 dark:ring-green-500' 
                        : ''
                  }`}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className={`${
                        errors.password 
                          ? 'text-red-500' 
                          : formData.password && formTouched 
                            ? 'text-green-500' 
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
                      className={`block w-full pl-10 pr-12 py-2.5 border ${
                        errors.password 
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500'
                      } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200`}
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
                  {errors.password && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center mt-1.5"
                    >
                      <AlertCircle size={14} className="text-red-500 mr-1.5" />
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                    </motion.div>
                  )}
                  {formData.password && !errors.password && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            formData.password.length < 6 
                              ? 'bg-red-500 w-1/3' 
                              : formData.password.length < 10 
                                ? 'bg-yellow-500 w-2/3' 
                                : 'bg-green-500 w-full'
                          }`}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formData.password.length < 6 
                          ? 'Senha fraca' 
                          : formData.password.length < 10 
                            ? 'Senha média' 
                            : 'Senha forte'}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Seletores de Perfil e Estado em flex row */}
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Perfil */}
                  <div className="flex-1 space-y-1.5">
                    <label htmlFor="perfil" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Perfil
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield size={18} className="text-gray-400 dark:text-gray-500" />
                      </div>
                      <select
                        id="perfil"
                        name="perfil"
                        value={formData.perfil}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 appearance-none"
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formData.perfil === 'Administrador' 
                        ? 'Acesso completo ao sistema' 
                        : 'Acesso limitado às funções básicas'}
                    </p>
                  </div>
                  
                  {/* Estado */}
                  <div className="flex-1 space-y-1.5">
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Estado
                    </label>
                    <div className="relative">
                      <select
                        id="estado"
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        className="block w-full py-2.5 pl-3 pr-10 border border-gray-300 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 appearance-none"
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formData.estado === 'Ativo' 
                        ? 'O utilizador pode aceder ao sistema' 
                        : 'O utilizador está bloqueado'}
                    </p>
                  </div>
                </div>
                
                {/* Switch de Autenticação de dois fatores */}
                <div className="mt-4">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <Shield size={20} className="text-gray-500 dark:text-gray-400 mr-3" />
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
                      <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500 dark:peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Footer com botões em gradiente */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-teal-500 transition-all duration-200"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={`relative py-2.5 px-6 rounded-lg shadow-sm text-sm font-medium text-white ${
                    loading ? 'bg-teal-500 dark:bg-teal-600' : 'bg-gradient-to-r from-teal-500 to-cyan-600 dark:from-teal-600 dark:to-cyan-700 hover:from-teal-600 hover:to-cyan-700 dark:hover:from-teal-700 dark:hover:to-cyan-800'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-teal-500 transition-all duration-200 overflow-hidden`}
                >
                  {loading && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  )}
                  <span className={loading ? 'opacity-0' : 'opacity-100'}>
                    {isEditing ? 'Atualizar' : 'Criar'} Utilizador
                  </span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UserFormModal;
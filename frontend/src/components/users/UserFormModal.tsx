import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { toast } from 'react-toastify';
import { Eye, EyeOff, X } from 'lucide-react';
import { User } from '@/contexts/AuthContext';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  user?: User;
}

interface UserFormData {
  nome: string;
  email: string;
  password: string;
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

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || '',
        email: user.email || '',
        password: '', // Senha vazia para edição, só será atualizada se preenchida
        perfil: user.perfil as 'Administrador' | 'Utilizador',
        estado: user.estado as 'Ativo' | 'Inativo',
        dois_fatores_ativo: user.dois_fatores_ativo || false
      });
    }
  }, [user]);

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
    
    if (!isEditing && !formData.password.trim()) {
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
      
      if (isEditing) {
        await api.put(`/api/utilizadores/${user.id}`, payload);
        toast.success('Utilizador atualizado com sucesso!');
      } else {
        await api.post('/api/utilizadores', payload);
        toast.success('Utilizador criado com sucesso!');
      }
      
      onSave();
    } catch (error) {
      console.error('Erro ao salvar utilizador:', error);
      toast.error('Erro ao salvar utilizador');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
              {isEditing ? 'Editar Utilizador' : 'Novo Utilizador'}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className={`w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 border ${
                      errors.nome ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.nome && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nome}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 border ${
                      errors.email ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isEditing ? 'Senha (deixe em branco para manter a atual)' : 'Senha'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 border ${
                        errors.password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="perfil" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Perfil
                    </label>
                    <select
                      id="perfil"
                      name="perfil"
                      value={formData.perfil}
                      onChange={handleChange}
                      className="w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Utilizador">Utilizador</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estado
                    </label>
                    <select
                      id="estado"
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      className="w-full rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="dois_fatores_ativo"
                    name="dois_fatores_ativo"
                    checked={formData.dois_fatores_ativo}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="dois_fatores_ativo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Autenticação de dois fatores
                  </label>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
              >
                {loading ? (
                  <>
                    <span className="mr-2">Salvando</span>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full"></div>
                  </>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserFormModal;
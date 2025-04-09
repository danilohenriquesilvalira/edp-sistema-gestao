import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, Sun, Moon, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTheme } from '@/contexts/ThemeContext';
import apiService from '@/services/api';
import { isStrongPassword, passwordsMatch } from '@/utils/validators';

const ResetPassword: React.FC = () => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Extrair token da URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [location.search]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!password) {
      newErrors.password = 'A senha é obrigatória';
    } else if (!isStrongPassword(password)) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres, incluindo uma letra e um número';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirme a sua senha';
    } else if (!passwordsMatch(password, confirmPassword)) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!token) {
      toast.error('Token de redefinição não encontrado. Por favor, solicite um novo link de recuperação.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await apiService.resetPassword(token, password);
      
      if (response.data.sucesso) {
        setIsSuccess(true);
        toast.success('Senha redefinida com sucesso!');
        
        // Redirecionar para o login após alguns segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast.error('Não foi possível redefinir sua senha. O token pode ser inválido ou ter expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* EDP Logo e branding à esquerda - visível apenas em telas maiores */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-b from-edp-primary-purple to-edp-primary-blue justify-center items-center p-12">
        <div className="max-w-md">
          <div className="mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-32 h-32">
              <circle cx="50" cy="50" r="45" fill="#32127A" />
              <circle cx="50" cy="50" r="35" fill="#A4D233" />
              <circle cx="50" cy="50" r="25" fill="#00ACEB" />
              <circle cx="50" cy="50" r="15" fill="#FFFFFF" />
            </svg>
          </div>
          <h1 className="text-white text-4xl font-bold mb-6">Redefinição de Senha</h1>
          <p className="text-white text-xl">
            Crie uma nova senha segura para acessar sua conta.
          </p>
        </div>
      </div>

      {/* Formulário de redefinição de senha à direita */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6">
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        
        <div className="lg:hidden mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-24 h-24">
            <circle cx="50" cy="50" r="45" fill="#32127A" />
            <circle cx="50" cy="50" r="35" fill="#A4D233" />
            <circle cx="50" cy="50" r="25" fill="#00ACEB" />
            <circle cx="50" cy="50" r="15" fill="#FFFFFF" />
          </svg>
        </div>
        
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-4">
            <div className="flex items-center mb-6">
              <Link to="/login" className="text-edp-primary-purple dark:text-edp-primary-blue hover:text-edp-primary-blue dark:hover:text-edp-primary-green transition">
                <ArrowLeft size={20} />
              </Link>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white ml-4">
                Redefinir Senha
              </h2>
            </div>
            
            {!isSuccess ? (
              <>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  Crie uma nova senha segura para sua conta. A senha deve ter pelo menos 6 caracteres.
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Lock size={18} />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 border ${
                          errors.password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                        } rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-edp-primary-purple focus:border-edp-primary-purple`}
                        placeholder="Nova senha"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Lock size={18} />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 border ${
                          errors.confirmPassword ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                        } rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-edp-primary-purple focus:border-edp-primary-purple`}
                        placeholder="Confirme a nova senha"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-edp-primary-purple hover:bg-edp-primary-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-edp-primary-purple transition-colors flex justify-center items-center"
                    >
                      {isLoading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white border-opacity-50 border-t-white rounded-full" />
                      ) : (
                        "Redefinir Senha"
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Senha Alterada</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login em instantes.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-edp-primary-purple hover:bg-edp-primary-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-edp-primary-purple transition-colors"
                >
                  Ir para o Login
                </Link>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lembrou sua senha? <Link to="/login" className="text-edp-primary-purple dark:text-edp-primary-blue hover:text-edp-primary-blue dark:hover:text-edp-primary-green font-medium">Faça login</Link>
            </p>
          </div>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} EDP - Energias de Portugal, S.A. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
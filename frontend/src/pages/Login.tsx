import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* EDP Logo e branding à esquerda */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-b from-green-600 to-teal-700 justify-center items-center p-12">
        <div className="max-w-md">
          <div className="mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-32 h-32">
              <circle cx="50" cy="50" r="45" fill="#32127A" />
              <circle cx="50" cy="50" r="35" fill="#A4D233" />
              <circle cx="50" cy="50" r="25" fill="#00ACEB" />
              <circle cx="50" cy="50" r="15" fill="#FFFFFF" />
            </svg>
          </div>
          <h1 className="text-white text-4xl font-bold mb-6">Gestão de Utilizadores</h1>
          <p className="text-white text-xl">
            Sistema interno para gestão e administração de contas, permissões e preferências de utilizadores da EDP.
          </p>
        </div>
      </div>

      {/* Formulário de login à direita */}
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
        
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Acesso ao Sistema</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                          bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none 
                          focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="seu.email@edp.pt"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                            bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none 
                            focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white 
                          bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                          focus:ring-green-500 transition-colors flex justify-center items-center"
              >
                {isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-opacity-50 border-t-white rounded-full" />
                ) : (
                  "Entrar"
                )}
              </button>
            </div>
            
            <div className="flex justify-center mt-4">
              <a href="#" className="text-sm text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300">
                Esqueceu a senha?
              </a>
            </div>
          </form>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} EDP - Energias de Portugal, S.A. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};

export default Login;
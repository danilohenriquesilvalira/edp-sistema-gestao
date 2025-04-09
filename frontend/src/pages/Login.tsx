import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Eye, EyeOff, Sun, Moon, CheckCircle, AlertCircle } from 'lucide-react'; // Importar ícones (instale 'lucide-react')

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null); // Adicionado ref para password
  const errorId = 'login-form-error';

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
      setError('Email ou senha incorretos.');
      if (passwordInputRef.current) {
        passwordInputRef.current.focus(); // Focar na senha em caso de erro
      }
    } finally {
      setIsLoading(false);
    }
  };

  const bgColor = 'bg-edp-neutral-950';
  const cardBgGradient = darkMode
    ? 'bg-gradient-to-br from-edp-neutral-800 to-edp-neutral-900'
    : 'bg-gradient-to-br from-white to-edp-neutral-50';
  const inputBgColor = darkMode ? 'dark:bg-edp-neutral-700' : 'bg-white';
  const inputBorderColor = darkMode ? 'dark:border-edp-neutral-600' : 'border-edp-neutral-300';
  const inputTextColor = darkMode ? 'dark:text-edp-neutral-100' : 'text-edp-neutral-900';
  const labelTextColor = darkMode ? 'dark:text-edp-neutral-300' : 'text-edp-neutral-700';
  const placeholderColor = darkMode ? 'dark:placeholder-edp-neutral-500' : 'placeholder-edp-neutral-400';
  const focusRingColor = 'focus:ring-edp-primary-blue';
  const buttonBgColor = 'bg-edp-primary-blue';
  const buttonHoverBgColor = 'hover:bg-opacity-80';
  const linkColor = 'text-edp-primary-blue';
  const linkHoverColor = 'hover:text-opacity-80';
  const inputErrorColor = 'border-danger-500'; // Cor para input com erro

  return (
    <div className={`relative flex min-h-screen items-center justify-center ${bgColor} overflow-hidden p-4`}>
      <img
        src="/Logo_EDP.svg"
        alt=""
        aria-hidden="true"
        className="absolute opacity-10 w-[90%] sm:w-[80%] md:w-[70%] h-auto max-w-4xl animate-fade-in-out animate-rotate-slow pointer-events-none"
      />

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${focusRingColor} focus:ring-offset-edp-neutral-950 hover:bg-edp-neutral-200 dark:hover:bg-edp-neutral-700`}
          aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-edp-neutral-400" />}
        </button>
      </div>

      <div
        className={`relative z-10 w-full max-w-md ${cardBgGradient} rounded-2xl shadow-lg dark:shadow-edp p-8 transition-all duration-300 hover:shadow-neu-light dark:hover:shadow-neu-dark animate-slide-in-bottom`}
      >
        {/* Logos */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center space-x-3">
            <img src="/Logo_EDP.svg" alt="Logo EDP" className="w-10 h-10 object-contain" />
            <img src="/name_EDP.svg" alt="Nome EDP" className="w-auto h-14 object-contain" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mensagem de Erro */}
          {error && (
            <div
              id={errorId}
              className="text-danger-700 dark:text-danger-400 text-sm p-3 bg-danger-100 dark:bg-danger-900/30 border border-danger-300 dark:border-danger-700 rounded-md transition-opacity duration-300"
              role="alert"
            >
              <div className="flex items-center">
                <AlertCircle size={16} className="mr-2" />
                {error}
              </div>
            </div>
          )}

          {/* Input Email */}
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${labelTextColor} mb-1`}>
              Email
            </label>
            <input
              ref={emailInputRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 border ${
                error ? inputErrorColor : inputBorderColor
              } rounded-lg shadow-sm ${inputBgColor} ${inputTextColor} ${placeholderColor} focus:outline-none focus:ring-2 ${focusRingColor} focus:border-transparent transition-all duration-300 hover:shadow-neu-light dark:hover:shadow-neu-dark ${
                error ? 'pr-10' : ''
              }`}
              placeholder="seu.email@edp.pt"
              required
              aria-describedby={error ? errorId : undefined}
              aria-invalid={!!error}
            />
            {error && (
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <AlertCircle size={20} className="text-danger-500" />
              </div>
            )}
          </div>

          {/* Input Senha */}
          <div>
            <label htmlFor="password" className={`block text-sm font-medium ${labelTextColor} mb-1`}>
              Senha
            </label>
            <div className="relative">
              <input
                ref={passwordInputRef}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-10 border ${
                  error ? inputErrorColor : inputBorderColor
                } rounded-lg shadow-sm ${inputBgColor} ${inputTextColor} ${placeholderColor} focus:outline-none focus:ring-2 ${focusRingColor} focus:border-transparent transition-all duration-300 hover:shadow-neu-light dark:hover:shadow-neu-dark`}
                placeholder="Sua senha"
                required
                aria-describedby={error ? errorId : undefined}
                aria-invalid={!!error}
              />
              <button
                type="button"
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-edp-neutral-400 hover:text-edp-neutral-600 dark:hover:text-edp-neutral-300 focus:outline-none focus:ring-1 ${focusRingColor} rounded`}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-controls="password"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Linha com Lembrar-me e Esqueceu a senha */}
          <div className="flex items-center justify-between text-sm flex-wrap gap-2">
            {/* Checkbox Lembrar-me (Opcional) */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={`h-4 w-4 ${focusRingColor} border-edp-neutral-300 dark:border-edp-neutral-600 rounded ${inputBgColor} focus:ring-offset-white dark:focus:ring-offset-edp-neutral-800`}
              />
              <label htmlFor="remember-me" className={`ml-2 block ${labelTextColor}`}>
                Lembrar-me
              </label>
            </div>

            {/* Link "Esqueceu a senha?" usando react-router-dom */}
            <Link
              to="/forgot-password"
              className={`font-medium ${linkColor} ${linkHoverColor} focus:outline-none focus:underline`}
            >
              Esqueceu a senha?
            </Link>
          </div>

          {/* Botão Entrar */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white ${buttonBgColor} ${buttonHoverBgColor} focus:outline-none focus:ring-2 focus:ring-offset-2 ${focusRingColor} focus:ring-offset-white dark:focus:ring-offset-edp-neutral-800 transition-all duration-300 hover:shadow-edp disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className={`absolute bottom-4 w-full text-center text-sm text-edp-neutral-500 dark:text-edp-neutral-400 z-20 px-4`}>
        © {new Date().getFullYear()} EDP - Energias de Portugal, S.A. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Login;
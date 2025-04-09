import React, { useState, useRef, useEffect } from 'react';
// Importar Link do react-router-dom
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // Opcional: Estado para "Lembrar-me"
  const [showPassword, setShowPassword] = useState(false); // Estado para visibilidade da senha (original)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const errorId = 'login-form-error'; // ID para associar erro aos inputs via aria-describedby

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
      // Se a função login suportar "rememberMe", passe o valor:
      // await login(email, password, rememberMe);
      await login(email, password);
      navigate('/dashboard'); // Ou para onde quer que redirecione após login
    } catch (err) {
      console.error('Login failed:', err);
      setError('Email ou senha incorretos.'); // Mensagem genérica por segurança
    } finally {
      setIsLoading(false);
    }
  };

  // Define as cores baseadas no tema para evitar repetição
  const bgColor = 'bg-edp-neutral-950'; // Exemplo, ajuste conforme o pretendido
  const cardBgColor = darkMode ? 'dark:bg-edp-neutral-800' : 'bg-white'; // Usa neutral-800 para dark
  const inputBgColor = darkMode ? 'dark:bg-edp-neutral-700' : 'bg-white';
  const inputBorderColor = darkMode ? 'dark:border-edp-neutral-600' : 'border-edp-neutral-300';
  const inputTextColor = darkMode ? 'dark:text-edp-neutral-100' : 'text-edp-neutral-900';
  const labelTextColor = darkMode ? 'dark:text-edp-neutral-300' : 'text-edp-neutral-700';
  const placeholderColor = darkMode ? 'dark:placeholder-edp-neutral-500' : 'placeholder-edp-neutral-400';
  const focusRingColor = 'focus:ring-edp-primary-blue'; // Usar a cor primária EDP definida
  const buttonBgColor = 'bg-edp-primary-blue'; // Cor primária EDP para o botão
  const buttonHoverBgColor = 'hover:bg-opacity-80'; // Exemplo de hover, pode ajustar
  const linkColor = 'text-edp-primary-blue';
  const linkHoverColor = 'hover:text-opacity-80';

  return (
    // Usar cores do tema Tailwind
    <div className={`relative flex min-h-screen items-center justify-center ${bgColor} overflow-hidden p-4`}>
      {/* Imagem de marca d'água responsiva e oculta para a11y */}
      <img
        src="/Logo_EDP.svg"
        alt="" // Decorativa, alt vazio
        aria-hidden="true"
        className="absolute opacity-10 w-[90%] sm:w-[80%] md:w-[70%] h-auto max-w-4xl animate-fade-in-out animate-rotate-slow pointer-events-none"
      />

      {/* Botão de Tema */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${focusRingColor} focus:ring-offset-edp-neutral-950 hover:bg-edp-neutral-200 dark:hover:bg-edp-neutral-700`} // Usar cores do tema
          aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {/* Ajustar cores dos ícones se necessário */}
          {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-edp-neutral-400" />}
        </button>
      </div>

      {/* Card do Formulário - Usar cores e sombras do tema */}
      {/* As classes de animação, sombra neu, glass vêm do seu config */}
      <div className={`relative z-10 w-full max-w-md ${cardBgColor} rounded-2xl shadow-lg dark:shadow-edp p-8 transition-all duration-300 hover:shadow-neu-light dark:hover:shadow-neu-dark animate-slide-in-bottom backdrop-blur-glass bg-gradient-glass`}>
        {/* Logos */}
        <div className="flex flex-col items-center mb-8">
           <div className="flex items-center space-x-3">
             <img src="/Logo_EDP.svg" alt="Logo EDP" className="w-10 h-10 object-contain" />
             <img src="/name_EDP.svg" alt="Nome EDP" className="w-auto h-14 object-contain" />
           </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mensagem de Erro */}
          {error && (
            <div
              id={errorId}
              // Usar cores de perigo do tema
              className="text-danger-700 dark:text-danger-400 text-sm p-3 bg-danger-100 dark:bg-danger-900/30 border border-danger-300 dark:border-danger-700 rounded-md"
              role="alert" // Informa que é uma mensagem importante
            >
              {error}
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
              name="email" // Atributo name
              type="email"
              autoComplete="email" // Atributo autoComplete
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Usar cores e estilos do tema
              className={`w-full px-4 py-3 border ${inputBorderColor} rounded-lg shadow-sm ${inputBgColor} ${inputTextColor} ${placeholderColor} focus:outline-none focus:ring-2 ${focusRingColor} focus:border-transparent transition-all duration-300 hover:shadow-neu-light dark:hover:shadow-neu-dark`}
              placeholder="seu.email@edp.pt"
              required
              aria-describedby={error ? errorId : undefined} // Associa com erro
              aria-invalid={!!error} // Indica se é inválido
            />
          </div>

          {/* Input Senha */}
          <div>
            <label htmlFor="password" className={`block text-sm font-medium ${labelTextColor} mb-1`}>
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                name="password" // Atributo name
                type={showPassword ? 'text' : 'password'} // Lógica original mantida
                autoComplete="current-password" // Atributo autoComplete
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Adicionado pr-10 para espaço do ícone
                className={`w-full px-4 py-3 pr-10 border ${inputBorderColor} rounded-lg shadow-sm ${inputBgColor} ${inputTextColor} ${placeholderColor} focus:outline-none focus:ring-2 ${focusRingColor} focus:border-transparent transition-all duration-300 hover:shadow-neu-light dark:hover:shadow-neu-dark`}
                placeholder="Sua senha"
                required
                aria-describedby={error ? errorId : undefined} // Associa com erro
                aria-invalid={!!error} // Indica se é inválido
              />
              {/* Botão para mostrar/ocultar senha (lógica original mantida) */}
              <button
                type="button"
                // Estilos do botão do olho - ajustados para foco
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-edp-neutral-400 hover:text-edp-neutral-600 dark:hover:text-edp-neutral-300 focus:outline-none focus:ring-1 ${focusRingColor} rounded`}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-controls="password" // Controla o input de senha
              >
                {/* Ícone condicional original mantido */}
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

           {/* Linha com Lembrar-me e Esqueceu a senha */}
           <div className="flex items-center justify-between text-sm flex-wrap gap-2"> {/* Adicionado flex-wrap e gap */}
              {/* Checkbox Lembrar-me (Opcional) */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  // Usar cor primária EDP para o check
                  className={`h-4 w-4 ${focusRingColor} border-edp-neutral-300 dark:border-edp-neutral-600 rounded ${inputBgColor} focus:ring-offset-white dark:focus:ring-offset-edp-neutral-800`}
                />
                <label htmlFor="remember-me" className={`ml-2 block ${labelTextColor}`}>
                  Lembrar-me
                </label>
              </div>

              {/* Link "Esqueceu a senha?" usando react-router-dom */}
             <Link
               to="/forgot-password" // <-- Defina a rota correta!
               className={`font-medium ${linkColor} ${linkHoverColor} focus:outline-none focus:underline`} // Adicionado focus style
             >
               Esqueceu a senha?
             </Link>
           </div>


          {/* Botão Entrar */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              // Usar cores e sombras do tema
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white ${buttonBgColor} ${buttonHoverBgColor} focus:outline-none focus:ring-2 focus:ring-offset-2 ${focusRingColor} focus:ring-offset-white dark:focus:ring-offset-edp-neutral-800 transition-all duration-300 hover:shadow-edp disabled:opacity-60 disabled:cursor-not-allowed`} // Usar shadow-edp e disabled styles
            >
              {/* Spinner SVG melhorado */}
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
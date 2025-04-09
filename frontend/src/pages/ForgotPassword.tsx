import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Sun, Moon } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTheme } from '@/contexts/ThemeContext';
import apiService from '@/services/api';
import { isValidEmail } from '@/utils/validators';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar email
    if (!email.trim()) {
      toast.error('Por favor, informe o seu email');
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Por favor, informe um email válido');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.forgotPassword(email);

      if (response.data.sucesso) {
        setEmailSent(true);
        toast.success('Email de recuperação enviado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      // Não mostrar erro específico por questões de segurança
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
          <h1 className="text-white text-4xl font-bold mb-6">Recuperação de Senha</h1>
          <p className="text-white text-xl">
            Não se preocupe! Vamos ajudá-lo a recuperar o acesso à sua conta.
          </p>
        </div>
      </div>

      {/* Formulário de recuperação de senha à direita */}
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
                Esqueceu sua senha?
              </h2>
            </div>
            
            {!emailSent ? (
              <>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  Informe seu endereço de e-mail cadastrado e enviaremos instruções para redefinir sua senha.
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Mail size={18} />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-edp-primary-purple focus:border-edp-primary-purple"
                        placeholder="seu.email@exemplo.com"
                        required
                      />
                    </div>
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
                        "Enviar Instruções"
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                  <Mail className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Verifique seu email</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Enviamos um link para recuperação de senha para <strong>{email}</strong>. Por favor, verifique sua caixa de entrada e siga as instruções.
                </p>
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-sm text-edp-primary-purple dark:text-edp-primary-blue hover:text-edp-primary-blue dark:hover:text-edp-primary-green transition"
                >
                  Usar outro email
                </button>
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

export default ForgotPassword;
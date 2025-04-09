import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'react-toastify'; // Remova a importação do ToastContainer
import axios from 'axios';

// Tipo para o usuário
export interface User {
  id: number;
  nome: string;
  email: string;
  perfil: 'Administrador' | 'Utilizador';
  estado: 'Ativo' | 'Inativo';
  foto_perfil?: string;
  dois_fatores_ativo?: boolean;
}

// Interface para o contexto de autenticação
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
}

// Criação do contexto
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Provedor do contexto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [axiosInstance] = useState(() =>
    axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  );

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      setLoading(false);
      return;
    }

    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    try {
      const response = await axiosInstance.get('/api/auth/me');
      if (response.data?.sucesso) {
        setUser(response.data.dados);
      }
    } catch (error) {
      // Token expirou, tentar refresh
      const refreshTokenValue = localStorage.getItem('refresh_token');
      if (refreshTokenValue) {
        const refreshed = await doRefreshToken();
        if (!refreshed) {
          // Se refresh falhar, fazer logout
          await logout(false);
        }
      } else {
        await logout(false);
      }
    } finally {
      setLoading(false);
    }
  }, [axiosInstance]);

  useEffect(() => {
    checkAuth();

    // Configurar intervalos para refresh de token e heartbeat
    const refreshInterval = setInterval(() => {
      if (localStorage.getItem('access_token')) {
        doRefreshToken();
      }
    }, 10 * 60 * 1000); // 10 minutos

    const heartbeatInterval = setInterval(() => {
      if (localStorage.getItem('access_token')) {
        axiosInstance.post('/api/status/heartbeat')
          .catch(() => { }); // Ignorar erros no heartbeat
      }
    }, 2 * 60 * 1000); // 2 minutos

    return () => {
      clearInterval(refreshInterval);
      clearInterval(heartbeatInterval);
    };
  }, [checkAuth, axiosInstance]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/login', { email, password });

      const { access_token, refresh_token, user: userData } = response.data.dados;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      setUser(userData);
      // Simplificar configuração do toast
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      let message = 'Erro de login. Verifique suas credenciais.';

      if (error.response?.data?.mensagem) {
        message = error.response.data.mensagem;
      }

      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const doRefreshToken = async () => {
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (!storedRefreshToken) return false;

    try {
      const response = await axiosInstance.post('/api/auth/refresh', {
        refresh_token: storedRefreshToken
      });

      if (response.data?.sucesso) {
        const { access_token, user: userData } = response.data.dados;
        localStorage.setItem('access_token', access_token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar token:', error);
      return false;
    }
  };

  // Função pública de refresh para o contexto
  const refreshToken = async () => {
    return doRefreshToken();
  };

  const logout = async (showToast = true) => {
    setLoading(true);
    const storedRefreshToken = localStorage.getItem('refresh_token');

    if (storedRefreshToken) {
      try {
        await axiosInstance.post('/api/auth/logout', {
          refresh_token: storedRefreshToken
        });
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete axiosInstance.defaults.headers.common['Authorization'];
    setUser(null);

    if (showToast) {
      // Simplificar o toast
      toast.success('Sessão encerrada com sucesso');
    }

    setLoading(false);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshToken,
        checkAuth
      }}
    >
      {children}
      {/* Remova o ToastContainer daqui */}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
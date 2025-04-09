import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';

class ApiService {
  private api: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;
  private refreshingQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Interceptor de requisição para adicionar token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor de resposta para tratar erros
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        // Log mais detalhado para debug
        this.logRequestError(error);
        
        // Processo de renovação de token
        if (error.response?.status === 401) {
          const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
          
          // Se não for uma tentativa de refresh e não for a rota de login ou refresh
          if (!originalRequest._retry && 
              originalRequest.url !== '/api/auth/login' && 
              originalRequest.url !== '/api/auth/refresh') {
            
            originalRequest._retry = true;
            
            try {
              const newToken = await this.refreshAccessToken();
              
              if (newToken && originalRequest.headers) {
                // Atualizar token na requisição original
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                // Repetir a requisição original
                return this.api(originalRequest);
              }
            } catch (refreshError) {
              // Se falhar o refresh, fazer logout
              this.handleLogout();
              return Promise.reject(refreshError);
            }
          }
        }
        
        // Mensagens de erro amigáveis
        this.handleErrorMessages(error);
        
        return Promise.reject(error);
      }
    );
  }

  private logRequestError(error: AxiosError): void {
    if (error.response) {
      console.error('Resposta de erro:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('Sem resposta do servidor:', error.request);
    } else {
      console.error('Erro na configuração da requisição:', error.message);
    }
  }

  private async refreshAccessToken(): Promise<string> {
    // Se já estiver refreshing, retornar a mesma promise para evitar múltiplas requisições
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Criar nova promise para o refresh
    this.refreshPromise = new Promise(async (resolve, reject) => {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        reject(new Error('Refresh token não disponível'));
        return;
      }
      
      try {
        // Fazer requisição de refresh
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
          refresh_token: refreshToken
        });
        
        if (response.data.sucesso) {
          const newToken = response.data.dados.access_token;
          
          // Atualizar token no localStorage
          localStorage.setItem('access_token', newToken);
          
          // Atualizar no Axios
          this.api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          // Resolver a promise
          resolve(newToken);
          
          // Processar fila de requisições em espera
          this.processQueue(null, newToken);
        } else {
          throw new Error('Falha ao atualizar token');
        }
      } catch (error) {
        // Rejeitar a promise
        reject(error);
        
        // Processar fila com erro
        this.processQueue(error, '');
        
        // Fazer logout
        this.handleLogout();
      } finally {
        // Limpar a promise atual
        this.refreshPromise = null;
      }
    });
    
    return this.refreshPromise;
  }

  private processQueue(error: unknown | null, token: string): void {
    // Processar todas as requisições na fila
    this.refreshingQueue.forEach(promise => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(token);
      }
    });
    
    // Limpar a fila
    this.refreshingQueue = [];
  }

  private handleErrorMessages(error: AxiosError): void {
    // Não mostrar toast para erros 401 durante o refresh
    if (error.config?.url === '/api/auth/refresh') {
      return;
    }
    
    // Mensagens de erro específicas
    if (error.response?.data && typeof error.response.data === 'object') {
      const apiError = error.response.data as { sucesso?: boolean; mensagem?: string; erro?: string };
      
      if (apiError.mensagem) {
        toast.error(apiError.mensagem);
        return;
      } else if (apiError.erro) {
        toast.error(apiError.erro);
        return;
      }
    }
    
    // Erros genéricos baseados no status HTTP
    if (error.response) {
      switch (error.response.status) {
        case 400:
          toast.error('Requisição inválida. Verifique os dados enviados.');
          break;
        case 401:
          toast.error('Sessão expirada. Faça login novamente.');
          break;
        case 403:
          toast.error('Sem permissão para acessar este recurso.');
          break;
        case 404:
          toast.error('Recurso não encontrado.');
          break;
        case 422:
          toast.error('Dados inválidos. Verifique as informações enviadas.');
          break;
        case 500:
          toast.error('Erro interno do servidor. Tente novamente mais tarde.');
          break;
        default:
          toast.error('Ocorreu um erro. Por favor, tente novamente.');
      }
    } else if (error.request) {
      // Erro de rede
      if (!navigator.onLine) {
        toast.error('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
      } else {
        toast.error('Erro ao comunicar com o servidor. Verifique sua conexão.');
      }
    } else {
      toast.error('Ocorreu um erro. Por favor, tente novamente mais tarde.');
    }
  }

  private handleLogout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete this.api.defaults.headers.common['Authorization'];
    
    // Redirecionar para login se não estiver na página de login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Métodos públicos para interação com a API

  // AUTH
  public async login(email: string, password: string): Promise<AxiosResponse> {
    return this.api.post('/api/auth/login', { email, password });
  }

  public async logout(refreshToken: string): Promise<AxiosResponse> {
    return this.api.post('/api/auth/logout', { refresh_token: refreshToken });
  }

  public async refreshToken(refreshToken: string): Promise<AxiosResponse> {
    return this.api.post('/api/auth/refresh', { refresh_token: refreshToken });
  }

  public async getCurrentUser(): Promise<AxiosResponse> {
    return this.api.get('/api/auth/me');
  }

  // USERS
  public async getUsers(params?: Record<string, string | number>): Promise<AxiosResponse> {
    return this.api.get('/api/utilizadores', { params });
  }

  public async getUserById(id: number): Promise<AxiosResponse> {
    return this.api.get(`/api/utilizadores/${id}`);
  }

  public async createUser(userData: Record<string, any>): Promise<AxiosResponse> {
    return this.api.post('/api/utilizadores', userData);
  }

  public async updateUser(id: number, userData: Record<string, any>): Promise<AxiosResponse> {
    return this.api.put(`/api/utilizadores/${id}`, userData);
  }

  public async deleteUser(id: number): Promise<AxiosResponse> {
    return this.api.delete(`/api/utilizadores/${id}`);
  }

  public async uploadProfilePicture(id: number, file: File): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.api.post(`/api/utilizadores/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // PASSWORD
  public async forgotPassword(email: string): Promise<AxiosResponse> {
    return this.api.post('/api/password/forgot', { email });
  }

  public async resetPassword(token: string, password: string): Promise<AxiosResponse> {
    return this.api.post('/api/password/reset', { token, password });
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<AxiosResponse> {
    return this.api.post('/api/password/change', { current_password: currentPassword, new_password: newPassword });
  }

  // CONFIGURATIONS
  public async getConfigs(): Promise<AxiosResponse> {
    return this.api.get('/api/configuracoes');
  }

  public async getConfigById(id: number): Promise<AxiosResponse> {
    return this.api.get(`/api/configuracoes/${id}`);
  }

  public async getConfigByKey(key: string): Promise<AxiosResponse> {
    return this.api.get(`/api/configuracoes/chave/${key}`);
  }

  public async createConfig(configData: Record<string, any>): Promise<AxiosResponse> {
    return this.api.post('/api/configuracoes', configData);
  }

  public async updateConfig(id: number, configData: Record<string, any>): Promise<AxiosResponse> {
    return this.api.put(`/api/configuracoes/${id}`, configData);
  }

  public async deleteConfig(id: number): Promise<AxiosResponse> {
    return this.api.delete(`/api/configuracoes/${id}`);
  }

  // AUDIT
  public async getAuditLogs(params?: Record<string, string | number>): Promise<AxiosResponse> {
    return this.api.get('/api/auditoria', { params });
  }

  public async getAuditLogById(id: number): Promise<AxiosResponse> {
    return this.api.get(`/api/auditoria/${id}`);
  }

  public async getAuditActions(): Promise<AxiosResponse> {
    return this.api.get('/api/auditoria/acoes');
  }

  public async getAuditModules(): Promise<AxiosResponse> {
    return this.api.get('/api/auditoria/modulos');
  }

  // PERMISSIONS
  public async getPermissions(): Promise<AxiosResponse> {
    return this.api.get('/api/permissoes');
  }

  public async getPermissionById(id: number): Promise<AxiosResponse> {
    return this.api.get(`/api/permissoes/${id}`);
  }

  public async createPermission(permissionData: Record<string, any>): Promise<AxiosResponse> {
    return this.api.post('/api/permissoes', permissionData);
  }

  public async updatePermission(id: number, permissionData: Record<string, any>): Promise<AxiosResponse> {
    return this.api.put(`/api/permissoes/${id}`, permissionData);
  }

  public async deletePermission(id: number): Promise<AxiosResponse> {
    return this.api.delete(`/api/permissoes/${id}`);
  }

  public async getProfilePermissions(profile: string): Promise<AxiosResponse> {
    return this.api.get(`/api/permissoes/perfil/${profile}`);
  }

  public async setProfilePermissions(profile: string, permissionIds: number[]): Promise<AxiosResponse> {
    return this.api.put(`/api/permissoes/perfil/${profile}`, {
      perfil: profile,
      permissao_ids: permissionIds
    });
  }

  // STATUS
  public async updateUserStatus(): Promise<AxiosResponse> {
    return this.api.post('/api/status/heartbeat');
  }

  public async getActiveUsers(timeout?: number): Promise<AxiosResponse> {
    const params = timeout ? { timeout } : undefined;
    return this.api.get('/api/status/ativos', { params });
  }

  public async getUserStatus(id: number, timeout?: number): Promise<AxiosResponse> {
    const params = timeout ? { timeout } : undefined;
    return this.api.get(`/api/status/${id}`, { params });
  }

  // PREFERENCES
  public async getUserPreferences(): Promise<AxiosResponse> {
    return this.api.get('/api/preferencias');
  }

  public async updateUserPreferences(preferencesData: Record<string, any>): Promise<AxiosResponse> {
    return this.api.put('/api/preferencias', preferencesData);
  }

  public async getUserPreferencesById(id: number): Promise<AxiosResponse> {
    return this.api.get(`/api/preferencias/${id}`);
  }

  // SESSIONS
  public async getUserSessions(id: number, activeOnly: boolean = true): Promise<AxiosResponse> {
    return this.api.get(`/api/sessoes/${id}?ativas=${activeOnly}`);
  }

  public async terminateSession(id: number): Promise<AxiosResponse> {
    return this.api.delete(`/api/sessoes/${id}`);
  }

  public async terminateAllUserSessions(userId: number): Promise<AxiosResponse> {
    return this.api.delete(`/api/sessoes/utilizador/${userId}`);
  }

  // Método genérico para requisições personalizadas
  public async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.request(config);
  }
}

// Exportar uma instância única
const apiService = new ApiService();
export default apiService;
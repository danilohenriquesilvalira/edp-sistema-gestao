/**
 * Verifica se o backend está acessível
 * @param apiUrl URL base da API
 * @returns Promise que resolve para true se conectado, false caso contrário
 */
export const checkBackendConnection = async (apiUrl: string = ''): Promise<boolean> => {
  try {
    // Tenta fazer uma requisição simples para o backend
    const baseUrl = apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout de 3 segundos
    
    const response = await fetch(`${baseUrl}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Erro ao verificar conexão com o backend:', error);
    return false;
  }
};

/**
 * Verifica se tem conexão com a internet
 * @returns true se online, false se offline
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Registra handlers para mudanças no estado da conexão
 * @param onlineCallback Função a ser chamada quando ficar online
 * @param offlineCallback Função a ser chamada quando ficar offline
 * @returns Função para remover os listeners
 */
export const registerConnectivityHandlers = (
  onlineCallback: () => void,
  offlineCallback: () => void
): () => void => {
  window.addEventListener('online', onlineCallback);
  window.addEventListener('offline', offlineCallback);
  
  return () => {
    window.removeEventListener('online', onlineCallback);
    window.removeEventListener('offline', offlineCallback);
  };
};
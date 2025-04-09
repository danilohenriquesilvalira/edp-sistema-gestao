/**
 * Função para verificar problemas comuns de configuração
 * Execute esta função no console do navegador para diagnosticar problemas
 */
export const checkConfiguration = (): void => {
  console.group('🔍 Verificação de Configuração do EDP Sistema de Gestão');
  
  // Verificar variáveis de ambiente
  console.log('📌 Variáveis de ambiente:');
  console.log('  - VITE_API_URL:', import.meta.env.VITE_API_URL || '❌ Não definida');
  
  // Verificar estado de autenticação
  console.log('📌 Estado de autenticação:');
  const hasAccessToken = !!localStorage.getItem('access_token');
  const hasRefreshToken = !!localStorage.getItem('refresh_token');
  console.log('  - Token de acesso:', hasAccessToken ? '✅ Presente' : '❌ Ausente');
  console.log('  - Token de atualização:', hasRefreshToken ? '✅ Presente' : '❌ Ausente');
  
  // Verificar conexão com a internet
  console.log('📌 Conexão:');
  console.log('  - Navegador online:', navigator.onLine ? '✅ Sim' : '❌ Não');
  
  // Verificar compatibilidade do navegador
  console.log('📌 Compatibilidade do navegador:');
  const isModernBrowser = 'Promise' in window && 'fetch' in window;
  console.log('  - Navegador moderno:', isModernBrowser ? '✅ Sim' : '❌ Não');
  
  // Verificar configuração do proxy
  console.log('📌 Configuração do proxy:');
  if (import.meta.env.DEV) {
    console.log('  - Modo de desenvolvimento:', '✅ Ativo');
    console.log('  - Verifique se o proxy em vite.config.ts está configurado corretamente para apontar para o seu backend');
  } else {
    console.log('  - Modo de produção:', '✅ Ativo');
    console.log('  - Verifique se o servidor está configurado com os cabeçalhos CORS corretos');
  }
  
  console.groupEnd();
};

// Exporta um método para verificar se o backend está respondendo
export const testBackendConnection = async (): Promise<void> => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  console.group('🔄 Teste de Conexão com o Backend');
  console.log('Testando conexão com:', apiUrl);
  
  try {
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${apiUrl}/`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const endTime = performance.now();
    const timeMs = Math.round(endTime - startTime);
    
    if (response.ok) {
      console.log(`✅ Conexão bem-sucedida (${timeMs}ms)`);
      try {
        const data = await response.json();
        console.log('Resposta:', data);
      } catch (e) {
        console.log('Resposta não é JSON. Status:', response.status);
      }
    } else {
      console.error(`❌ Resposta com erro. Status: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Falha na conexão com o backend:', error);
    console.log('Verifique se:');
    console.log('1. O servidor backend está rodando');
    console.log('2. A URL está correta');
    console.log('3. Não há problemas de CORS');
    console.log('4. A rede permite a conexão');
  }
  
  console.groupEnd();
};

// Adicione esta linha para habilitar a ferramenta no objeto window no ambiente de desenvolvimento
if (import.meta.env.DEV) {
  // @ts-ignore
  window.edpDebug = {
    checkConfiguration,
    testBackendConnection
  };
  console.log('🛠️ Ferramentas de diagnóstico disponíveis. Execute "edpDebug.checkConfiguration()" ou "edpDebug.testBackendConnection()" no console para diagnósticos.');
}
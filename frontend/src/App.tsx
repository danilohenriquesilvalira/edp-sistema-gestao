// frontend/src/App.tsx
import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

// Contextos
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Utilitários
import { registerConnectivityHandlers } from '@/utils/connectivity';

// Layout
import MainLayout from '@/components/layout/MainLayout';

// Página de carregamento
import LoadingPage from '@/components/common/LoadingPage';

// Importação das páginas com lazy loading para melhor performance
const Login = lazy(() => import('@/pages/Login'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const AuditLogs = lazy(() => import('@/pages/AuditLogs'));
const Permissions = lazy(() => import('@/pages/Permissions'));
const SystemConfig = lazy(() => import('@/pages/SystemConfig'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Importação das páginas de PLC
const PLCListPage = lazy(() => import('@/pages/plc/PLCListPage'));
const PLCCreatePage = lazy(() => import('@/pages/plc/PLCCreatePage'));
const PLCEditPage = lazy(() => import('@/pages/plc/PLCEditPage'));
const PLCDetailsPage = lazy(() => import('@/pages/plc/PLCDetailsPage'));
const TagCreatePage = lazy(() => import('@/pages/tags/TagCreatePage'));
const TagEditPage = lazy(() => import('@/pages/tags/TagEditPage'));

// Importação das páginas de Falhas
const FaultActivePage = lazy(() => import('@/pages/faults/FaultActivePage'));
const FaultDefinitionsPage = lazy(() => import('@/pages/faults/FaultDefinitionsPage'));
const FaultDefinitionCreatePage = lazy(() => import('@/pages/faults/FaultDefinitionCreatePage'));
const FaultDefinitionEditPage = lazy(() => import('@/pages/faults/FaultDefinitionEditPage'));

// Componente de proteção de rotas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <LoadingPage />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// Componente para redirecionar usuários já autenticados
const RedirectIfAuthenticated: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingPage />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Componente para rotas que requerem perfil de administrador
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <LoadingPage />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (user?.perfil !== 'Administrador') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Componente principal
const AppContent: React.FC = () => {
  const { isAuthenticated, checkAuth, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar autenticação ao iniciar
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Monitoramento de conectividade
  useEffect(() => {
    // Registrar handlers para mudanças na conexão
    const unregister = registerConnectivityHandlers(
      // Quando ficar online
      () => {
        toast.success('Conexão com a internet restaurada', { 
          autoClose: 2000,
          toastId: 'connectivity-online' 
        });
        // Verificar autenticação novamente
        checkAuth();
      },
      // Quando ficar offline
      () => {
        toast.error('Sem conexão com a internet. Algumas funcionalidades podem não estar disponíveis.', {
          autoClose: false,
          toastId: 'connectivity-offline'
        });
      }
    );
    
    // Cleanup
    return () => {
      unregister();
    };
  }, [checkAuth]);

  // Redirecionamento inteligente após autenticação
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/login') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, location.pathname, navigate]);

  if (loading && location.pathname !== '/login') {
    return <LoadingPage />;
  }

  return (
    <>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={
          <RedirectIfAuthenticated>
            <Suspense fallback={<LoadingPage />}>
              <Login />
            </Suspense>
          </RedirectIfAuthenticated>
        } />
        
        <Route path="/esqueceu-senha" element={
          <RedirectIfAuthenticated>
            <Suspense fallback={<LoadingPage />}>
              <ForgotPassword />
            </Suspense>
          </RedirectIfAuthenticated>
        } />
        
        <Route path="/redefinir-senha" element={
          <Suspense fallback={<LoadingPage />}>
            <ResetPassword />
          </Suspense>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Rotas protegidas */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={
            <Suspense fallback={<LoadingPage />}>
              <Dashboard />
            </Suspense>
          } />
          
          <Route path="perfil" element={
            <Suspense fallback={<LoadingPage />}>
              <Profile />
            </Suspense>
          } />
          
          {/* Rotas de PLC */}
          <Route path="plcs" element={
            <Suspense fallback={<LoadingPage />}>
              <PLCListPage />
            </Suspense>
          } />
          
          <Route path="plcs/novo" element={
            <Suspense fallback={<LoadingPage />}>
              <PLCCreatePage />
            </Suspense>
          } />
          
          <Route path="plcs/:id" element={
            <Suspense fallback={<LoadingPage />}>
              <PLCDetailsPage />
            </Suspense>
          } />
          
          <Route path="plcs/:id/editar" element={
            <Suspense fallback={<LoadingPage />}>
              <PLCEditPage />
            </Suspense>
          } />
          
          <Route path="plcs/:plcId/tags/nova" element={
            <Suspense fallback={<LoadingPage />}>
              <TagCreatePage />
            </Suspense>
          } />
          
          <Route path="plcs/:plcId/tags/:id/editar" element={
            <Suspense fallback={<LoadingPage />}>
              <TagEditPage />
            </Suspense>
          } />
          
          {/* Rotas de Falhas */}
          <Route path="falhas" element={
            <Suspense fallback={<LoadingPage />}>
              <FaultActivePage />
            </Suspense>
          } />
          
          <Route path="falhas/definicoes" element={
            <Suspense fallback={<LoadingPage />}>
              <FaultDefinitionsPage />
            </Suspense>
          } />
          
          <Route path="falhas/definicoes/nova" element={
            <Suspense fallback={<LoadingPage />}>
              <FaultDefinitionCreatePage />
            </Suspense>
          } />
          
          <Route path="falhas/definicoes/:id/editar" element={
            <Suspense fallback={<LoadingPage />}>
              <FaultDefinitionEditPage />
            </Suspense>
          } />
          
          {/* Rotas de administrador */}
          <Route path="utilizadores" element={
            <AdminRoute>
              <Suspense fallback={<LoadingPage />}>
                <UserManagement />
              </Suspense>
            </AdminRoute>
          } />
          
          <Route path="auditoria" element={
            <AdminRoute>
              <Suspense fallback={<LoadingPage />}>
                <AuditLogs />
              </Suspense>
            </AdminRoute>
          } />
          
          <Route path="permissoes" element={
            <AdminRoute>
              <Suspense fallback={<LoadingPage />}>
                <Permissions />
              </Suspense>
            </AdminRoute>
          } />
          
          <Route path="configuracoes" element={
            <AdminRoute>
              <Suspense fallback={<LoadingPage />}>
                <SystemConfig />
              </Suspense>
            </AdminRoute>
          } />
        </Route>
        
        {/* Página 404 */}
        <Route path="*" element={
          <Suspense fallback={<LoadingPage />}>
            <NotFound />
          </Suspense>
        } />
      </Routes>
      
      <ToastContainer 
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
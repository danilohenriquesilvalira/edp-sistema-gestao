import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { getAvatarUrl } from '@/services/api';
import {
  Users,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Bell,
  Settings,
} from 'lucide-react';
import ProfileModal from '@/components/profiles/ProfileModal';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [notificationsCount] = useState(3); // Exemplo para notificações

  // Feche o menu do usuário quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (userMenuOpen && !target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Fechar a barra lateral no mobile quando a rota mudar
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderNavLinks = (collapsed: boolean) => (
    <div className="flex flex-col">
      {/* Navegação Principal */}
      <div className="px-3 py-2 mt-6">
        <h2 className={`text-xs font-semibold text-edp-neutral-400 uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : 'px-2'}`}>
          {!collapsed && 'Navegação Principal'}
        </h2>
        <nav className="space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `group flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-cyan-500 text-white dark:bg-cyan-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/30'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title="Dashboard"
          >
            <LayoutDashboard className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'}`} />
            {!collapsed && (
              <span className="ml-3 font-medium transition-opacity duration-200">Dashboard</span>
            )}
          </NavLink>

          {user?.perfil === 'Administrador' && (
            <NavLink
              to="/utilizadores"
              className={({ isActive }) =>
                `group flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500 text-white dark:bg-cyan-600 dark:text-white'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/30'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title="Utilizadores"
            >
              <Users className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'}`} />
              {!collapsed && (
                <span className="ml-3 font-medium transition-opacity duration-200">Utilizadores</span>
              )}
            </NavLink>
          )}
        </nav>
      </div>

      {/* Divisor com gradiente */}
      <div className={`px-3 mt-6 mb-4 ${collapsed ? 'mx-auto w-2/3' : ''}`}>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>
      </div>

      {/* Sistema */}
      <div className="px-3 py-2">
        <h2 className={`text-xs font-semibold text-edp-neutral-400 uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : 'px-2'}`}>
          {!collapsed && 'Sistema'}
        </h2>
        <nav className="space-y-1">
          <button
            className={`flex items-center px-3 py-3 rounded-lg w-full transition-all duration-200
              text-gray-700 dark:text-gray-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/30
              ${collapsed ? 'justify-center' : ''}`}
            title="Configurações"
          >
            <Settings className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'}`} />
            {!collapsed && (
              <span className="ml-3 font-medium transition-opacity duration-200">Configurações</span>
            )}
          </button>
        </nav>
      </div>
    </div>
  );

  const renderBottomActions = (collapsed: boolean) => (
    <div className="absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700 px-2 py-4">
      <button
        className={`flex items-center px-3 py-2.5 mb-2 rounded-lg w-full transition-all duration-200
          text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
          ${collapsed ? 'justify-center' : ''}`}
        onClick={handleLogout}
        title="Sair"
      >
        <LogOut className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'}`} />
        {!collapsed && <span className="ml-3 font-medium">Sair</span>}
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Overlay para mobile */}
      <div
        className={`lg:hidden fixed inset-0 z-20 bg-gray-600 dark:bg-gray-900 transition-opacity ${
          sidebarOpen ? 'opacity-75' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Barra lateral */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-30 
          ${sidebarCollapsed ? 'w-20' : 'w-64'} 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 
          bg-white dark:bg-gray-800 
          overflow-hidden 
          transition-all 
          duration-300 
          ease-in-out 
          shadow-md
          relative`}
      >
        {/* Cabeçalho da barra lateral */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {/* Logo container - centralizado no espaço disponível */}
          <div className="flex-1 flex justify-center items-center">
            {!sidebarCollapsed && (
              <div className="flex items-center justify-center">
                <img src="/Logo_EDP.svg" alt="EDP Logo" className="w-6 h-6" />
                
                <svg 
                  width="80" 
                  height="28" 
                  viewBox="0 0 241 150" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 ml-1"
                >
                  <path 
                    fillRule="evenodd" 
                    clipRule="evenodd" 
                    d="M66.1996 87.1143C65.2585 92.809 58.1428 105.399 40.4739 105.399C16.8676 105.399 11.864 80.6289 12.45 76.2737L74.4729 76.2506C73.6193 55.8054 59.2031 39.521 38.5345 39.521C17.253 39.521 0 56.7859 0 78.0815C0 99.3783 17.253 116.642 38.5345 116.642C56.7079 116.642 70.7703 104.054 74.4923 87.1143H66.1996ZM36.5391 47.388C49.4208 47.388 58.7337 55.2238 62.0423 67.8881L13.1529 67.8212C16.3119 53.5693 27.5314 47.388 36.5391 47.388ZM202.453 39.4744C181.165 39.4744 163.907 56.7433 163.907 78.0475V150H176.267V106.174C182.41 112.946 192.361 116.619 202.453 116.619C223.742 116.619 241 99.3492 241 78.0475C241 56.7433 223.742 39.4744 202.453 39.4744ZM205.299 107.827C189.079 107.74 176.634 93.9221 176.534 75.2117C176.43 55.5669 190.498 47.337 199.923 47.388C216.09 47.4758 228.957 62.7433 229.052 80.6606C229.141 97.3273 217.594 107.894 205.299 107.827ZM144.891 0V49.9817C138.559 43.0451 128.796 39.4743 118.704 39.4743C97.4165 39.4743 80.1586 56.7433 80.1586 78.0475C80.1586 99.3492 97.4165 116.619 118.704 116.619C139.993 116.619 157.251 99.3492 157.251 78.0475V0H144.891ZM121.116 107.832C104.932 107.745 92.205 92.9611 92.1053 74.7798C92.0019 57.1229 104.363 47.3425 115.74 47.3929C131.943 47.4809 144.529 61.781 144.624 80.2287C144.713 98.8832 131.459 107.899 121.116 107.832Z" 
                    fill={darkMode ? "white" : "#212E3C"} 
                  />
                </svg>
              </div>
            )}
            
            {/* Logo apenas visível quando colapsado */}
            {sidebarCollapsed && (
              <div className="flex justify-center">
                <img src="/Logo_EDP.svg" alt="EDP Logo" className="w-6 h-6" />
              </div>
            )}
          </div>
          
          {/* Botão para colapsar a sidebar */}
          <button
            className="p-2 rounded-md text-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 
              dark:text-cyan-400 dark:hover:text-cyan-300 dark:hover:bg-cyan-900/20
              transition-colors duration-200"
            onClick={toggleSidebarCollapse}
          >
            {sidebarCollapsed ? 
              <ChevronsRight className="h-5 w-5" /> : 
              <ChevronsLeft className="h-5 w-5" />
            }
          </button>
        </div>
        
        {/* Conteúdo da barra lateral */}
        <div className="overflow-y-auto scrollbar-hide" style={{height: 'calc(100% - 64px)'}}>
          {renderNavLinks(sidebarCollapsed)}
        </div>
        
        {/* Ações do rodapé */}
        {renderBottomActions(sidebarCollapsed)}
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Cabeçalho */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 sm:px-6">
            <div className="flex justify-between h-16">
              <div className="flex items-center lg:hidden">
                <button
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-cyan-50 
                    dark:text-gray-300 dark:hover:text-white dark:hover:bg-cyan-900/30
                    transition-colors duration-200"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>

              {/* Lado direito do cabeçalho com notificações e tema */}
              <div className="flex items-center ml-auto">
                {/* Botão de notificações */}
                <div className="relative mr-2">
                  <button
                    className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 
                      dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700
                      transition-colors duration-200"
                  >
                    <Bell className="h-6 w-6" />
                    {notificationsCount > 0 && (
                      <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notificationsCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Botão de tema */}
                <button
                  className="p-2 mr-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 
                    dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700
                    transition-colors duration-200"
                  onClick={toggleDarkMode}
                >
                  {darkMode ? (
                    <Sun className="h-6 w-6" />
                  ) : (
                    <Moon className="h-6 w-6" />
                  )}
                </button>

                {/* Menu do usuário */}
                <div className="relative user-menu-container">
                  <button
                    className="flex items-center text-gray-700 dark:text-gray-200 hover:text-gray-900 
                      dark:hover:text-white focus:outline-none p-1 rounded-lg hover:bg-gray-100 
                      dark:hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setImageError(false);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-cyan-500 flex items-center justify-center mr-2">
                      {user?.foto_perfil && !imageError ? (
                        <img
                          src={getAvatarUrl(user.foto_perfil) || undefined}
                          alt={user?.nome || ''}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="text-white font-medium">{user?.nome.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="hidden md:block font-medium">{user?.nome}</span>
                    <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 py-2 bg-white dark:bg-gray-800 
                      rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700
                      transition-all duration-200 animate-fadeIn">
                      <div className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center mb-2">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-cyan-500 flex items-center justify-center mr-3">
                            {user?.foto_perfil && !imageError ? (
                              <img
                                src={getAvatarUrl(user.foto_perfil) || undefined}
                                alt={user?.nome || ''}
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                              />
                            ) : (
                              <span className="text-white text-lg font-medium">{user?.nome.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 dark:text-white">{user?.nome}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                          </div>
                        </div>
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-100">
                          {user?.perfil}
                        </div>
                      </div>

                      {/* Opções do menu do usuário */}
                      <button
                        className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 
                          hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-colors duration-200"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                      >
                        <span className="mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </span>
                        Meu Perfil
                      </button>

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 
                          hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      >
                        <span className="mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                          </svg>
                        </span>
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Modal de Perfil */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
};

export default MainLayout;
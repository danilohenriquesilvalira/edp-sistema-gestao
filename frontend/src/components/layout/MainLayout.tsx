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
    <nav className={`mt-6 px-2 space-y-1 transition-all duration-300`}>
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
  );

  const renderBottomActions = (collapsed: boolean) => (
    <div className="absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700 px-2 py-4">
      <button
        className={`flex items-center px-3 py-2.5 mb-2 rounded-lg w-full transition-all duration-200
          text-gray-700 dark:text-gray-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/30
          ${collapsed ? 'justify-center' : ''}`}
        onClick={toggleDarkMode}
        title={darkMode ? "Modo Claro" : "Modo Escuro"}
      >
        {darkMode ? (
          <Sun className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'} text-cyan-500`} />
        ) : (
          <Moon className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'} text-cyan-500`} />
        )}
        {!collapsed && (
          <span className="ml-3 font-medium">{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
        )}
      </button>
      <button
        className={`flex items-center px-3 py-2.5 rounded-lg w-full transition-all duration-200
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
          <div className={`flex items-center space-x-2 transition-all duration-300 
            ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            <img src="/Logo_EDP.svg" alt="EDP Logo" className="w-6 h-6" />
            <img src="/name_EDP.svg" alt="EDP Name" className="h-10" />
          </div>
          
          {/* Botão Sidebar Collapse */}
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

        {renderNavLinks(sidebarCollapsed)}
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

              {/* Menu do usuário */}
              <div className="flex items-center ml-auto user-menu-container">
                <div className="relative">
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
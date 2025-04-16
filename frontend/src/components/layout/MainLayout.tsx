// frontend/src/components/layout/MainLayout.tsx
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
  UserCircle,
  Shield,
  Sparkles,
  Server,
  Tag,
  AlertTriangle,
  DatabaseBackup,
} from 'lucide-react';
import ProfileModal from '@/components/profiles/ProfileModal';
import { AnimatePresence, motion } from 'framer-motion';

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

          {/* PLC Navigation Link */}
          <NavLink
            to="/plcs"
            className={({ isActive }) =>
              `group flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-cyan-500 text-white dark:bg-cyan-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/30'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title="PLCs"
          >
            <Server className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'}`} />
            {!collapsed && (
              <span className="ml-3 font-medium transition-opacity duration-200">PLCs</span>
            )}
          </NavLink>

          {/* Falhas Navigation Link */}
          <NavLink
            to="/falhas"
            className={({ isActive }) =>
              `group flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-cyan-500 text-white dark:bg-cyan-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/30'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title="Falhas"
          >
            <AlertTriangle className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'}`} />
            {!collapsed && (
              <span className="ml-3 font-medium transition-opacity duration-200">Falhas</span>
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
          {/* Administration navigation links */}
          {user?.perfil === 'Administrador' && (
            <>
              <NavLink
                to="/auditoria"
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500 text-white dark:bg-cyan-600 dark:text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/30'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title="Auditoria"
              >
                <DatabaseBackup className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'}`} />
                {!collapsed && (
                  <span className="ml-3 font-medium transition-opacity duration-200">Auditoria</span>
                )}
              </NavLink>

              <NavLink
                to="/permissoes"
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500 text-white dark:bg-cyan-600 dark:text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/30'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title="Permissões"
              >
                <Shield className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'}`} />
                {!collapsed && (
                  <span className="ml-3 font-medium transition-opacity duration-200">Permissões</span>
                )}
              </NavLink>
            </>
          )}

          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              `group flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-cyan-500 text-white dark:bg-cyan-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/30'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title="Configurações"
          >
            <Settings className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'}`} />
            {!collapsed && (
              <span className="ml-3 font-medium transition-opacity duration-200">Configurações</span>
            )}
          </NavLink>
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

                {/* Menu do usuário - VERSÃO MELHORADA */}
                <div className="relative user-menu-container">
                  <motion.button
                    className="flex items-center text-gray-700 dark:text-gray-200 hover:text-gray-900 
                      dark:hover:text-white focus:outline-none rounded-xl px-3 py-2
                      bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700
                      hover:bg-white dark:hover:bg-gray-700 transition-all duration-300
                      hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setImageError(false);
                    }}
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ 
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                      y: -1
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center mr-2 ring-1 ring-cyan-500/30 dark:ring-cyan-400/30">
                      {user?.foto_perfil && !imageError ? (
                        <motion.img
                          src={getAvatarUrl(user.foto_perfil) || undefined}
                          alt={user?.nome || ''}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : (
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700 flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="text-white font-medium">{user?.nome?.charAt(0).toUpperCase()}</span>
                        </motion.div>
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm leading-tight">{user?.nome}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{user?.perfil}</span>
                    </div>
                    <motion.div 
                      animate={{ rotate: userMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="ml-1.5"
                    >
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div 
                        className="absolute right-0 mt-2 w-64 overflow-hidden bg-white dark:bg-gray-800 
                          rounded-xl shadow-xl z-50 border border-gray-200 dark:border-gray-700"
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 500, 
                          damping: 30,
                          duration: 0.2
                        }}
                      >
                        {/* Cabeçalho do menu com perfil */}
                        <div className="relative">
                          {/* Fundo com gradiente mais sutil */}
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-800/20 dark:to-blue-800/20"></div>
                          
                          <div className="relative px-4 pt-4 pb-3">
                            <div className="flex items-center">
                              <motion.div 
                                className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 mr-3"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                              >
                                {user?.foto_perfil && !imageError ? (
                                  <img
                                    src={getAvatarUrl(user.foto_perfil) || undefined}
                                    alt={user?.nome || ''}
                                    className="w-full h-full object-cover"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700 flex items-center justify-center">
                                    <span className="text-white text-lg font-medium">{user?.nome?.charAt(0).toUpperCase()}</span>
                                  </div>
                                )}
                              </motion.div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user?.nome}
                                  </h3>
                                  <div className="ml-1.5 flex items-center text-xs text-green-600 dark:text-green-400">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                                    <span className="text-xs">Disponível</span>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                  {user?.email}
                                </p>
                                
                                <div className="flex items-center mt-1">
                                  <div className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-cyan-100 dark:bg-cyan-800/50 text-cyan-700 dark:text-cyan-300">
                                    <Shield className="w-3 h-3 mr-1" />
                                    {user?.perfil}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Separador estilizado */}
                        <div className="px-4 py-1">
                          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>
                        </div>
                        
                        {/* Área de opções do menu */}
                        <div className="p-1.5">
                          <motion.button
                            className="flex w-full items-center px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 
                              hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-all duration-200"
                            onClick={() => {
                              setUserMenuOpen(false);
                              setIsProfileModalOpen(true);
                            }}
                            whileHover={{ 
                              backgroundColor: darkMode ? "rgba(8, 145, 178, 0.2)" : "rgba(8, 145, 178, 0.1)",
                              x: 2
                            }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                          >
                            <span className="mr-2.5 bg-cyan-100 dark:bg-cyan-800/50 p-1.5 rounded-md text-cyan-600 dark:text-cyan-400">
                              <UserCircle className="w-4 h-4" />
                            </span>
                            <span className="font-medium">Meu Perfil</span>
                          </motion.button>
                          
                          <div className="px-2 py-1.5">
                            <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                          </div>
                          
                          <motion.button
                            onClick={handleLogout}
                            className="flex w-full items-center px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 
                              hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                            whileHover={{ 
                              backgroundColor: darkMode ? "rgba(220, 38, 38, 0.2)" : "rgba(220, 38, 38, 0.1)",
                              x: 2
                            }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                          >
                            <span className="mr-2.5 bg-red-100 dark:bg-red-800/50 p-1.5 rounded-md text-red-600 dark:text-red-400">
                              <LogOut className="w-4 h-4" />
                            </span>
                            <span className="font-medium">Sair</span>
                          </motion.button>
                        </div>
                        
                        {/* Rodapé com versão - mais compacto */}
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                            EDP v1.0.0
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
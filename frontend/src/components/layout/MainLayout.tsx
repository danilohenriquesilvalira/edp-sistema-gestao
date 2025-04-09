import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  User,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderNavLinks = (collapsed: boolean) => (
    <nav className={`mt-5 px-4 space-y-1 transition-opacity duration-300 
      ${collapsed ? 'opacity-100' : 'opacity-100'}`}>
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `group flex items-center px-2 py-3 rounded-md ${
            isActive
              ? 'bg-green-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          } ${collapsed ? 'justify-center' : ''}`
        }
        onClick={closeSidebar}
        title="Dashboard"
      >
        <LayoutDashboard className={`${collapsed ? 'h-6 w-10' : 'h-5 w-5'}`} />
        {!collapsed && <span className="ml-3">Dashboard</span>}
      </NavLink>

      {user?.perfil === 'Administrador' && (
        <NavLink
          to="/utilizadores"
          className={({ isActive }) =>
            `group flex items-center px-2 py-3 rounded-md ${
              isActive
                ? 'bg-green-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            } ${collapsed ? 'justify-center' : ''}`
          }
          onClick={closeSidebar}
          title="Utilizadores"
        >
          <Users className={`${collapsed ? 'h-6 w-10' : 'h-5 w-5'}`} />
          {!collapsed && <span className="ml-3">Utilizadores</span>}
        </NavLink>
      )}

      <NavLink
        to="/perfil"
        className={({ isActive }) =>
          `group flex items-center px-2 py-3 rounded-md ${
            isActive
              ? 'bg-green-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          } ${collapsed ? 'justify-center' : ''}`
        }
        onClick={closeSidebar}
        title="Meu Perfil"
      >
        <User className={`${collapsed ? 'h-6 w-10' : 'h-5 w-5'}`} />
        {!collapsed && <span className="ml-3">Meu Perfil</span>}
      </NavLink>
    </nav>
  );

  const renderBottomActions = (collapsed: boolean) => (
    <div className={`absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700 px-4 py-4 transition-opacity duration-300 
      ${collapsed ? 'opacity-100' : 'opacity-100'}`}>
      <button
        className={`flex items-center px-2 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full rounded-md
          ${collapsed ? 'justify-center' : ''}`}
        onClick={toggleDarkMode}
        title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
      >
        {darkMode ? <Sun className={`${collapsed ? 'h-6 w-10' : 'h-5 w-5'}`} /> : <Moon className={`${collapsed ? 'h-6 w-10' : 'h-5 w-5'}`} />}
        {!collapsed && (darkMode ? 'Modo Claro' : 'Modo Escuro')}
      </button>
      <button
        className={`flex items-center px-2 py-2 mt-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full rounded-md
          ${collapsed ? 'justify-center' : ''}`}
        onClick={handleLogout}
        title="Sair"
      >
        <LogOut className={`${collapsed ? 'h-6 w-10' : 'h-5 w-5'}`} />
        {!collapsed && <span>Sair</span>}
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar for mobile */}
      <div
        className={`lg:hidden fixed inset-0 z-20 transition-opacity ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-gray-600 dark:bg-gray-900 opacity-75"
          onClick={closeSidebar}
        ></div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-30 
          ${sidebarCollapsed ? 'w-16' : 'w-64'} 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 
          bg-white dark:bg-gray-800 
          overflow-hidden 
          transition-all 
          duration-300 
          ease-in-out 
          relative`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex items-center space-x-2 transition-opacity duration-300 
            ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            <img src="/Logo_EDP.svg" alt="EDP Logo" className="w-8 h-8" />
            <img src="/name_EDP.svg" alt="EDP Name" className="h-6" />
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Mobile close button */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              onClick={closeSidebar}
            >
              <X size={20} />
            </button>
            
            {/* Sidebar collapse toggle */}
            <button
              className="hidden lg:block p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              onClick={toggleSidebarCollapse}
            >
              {sidebarCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {renderNavLinks(sidebarCollapsed)}

        {renderBottomActions(sidebarCollapsed)}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10 flex-shrink-0">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center -ml-2 lg:hidden">
                <button
                  className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>

              <div className="flex items-center ml-auto">
                <div className="relative">
                  <button
                    className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setImageError(false);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-green-600 flex items-center justify-center mr-2">
                      {user?.foto_perfil && !imageError ? (
                        <img
                          src={getAvatarUrl(user.foto_perfil) || undefined}
                          alt={user?.nome || ''}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="text-white">{user?.nome.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="hidden md:block">{user?.nome}</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center mb-2">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-green-600 flex items-center justify-center mr-3">
                            {user?.foto_perfil && !imageError ? (
                              <img
                                src={getAvatarUrl(user.foto_perfil) || undefined}
                                alt={user?.nome || ''}
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                              />
                            ) : (
                              <span className="text-white">{user?.nome.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800 dark:text-white">{user?.nome}</div>
                            <div className="text-xs">{user?.email}</div>
                          </div>
                        </div>
                        <div className="text-xs mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          {user?.perfil}
                        </div>
                      </div>

                      <NavLink
                        to="/perfil"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Meu Perfil
                      </NavLink>

                      <button
                        onClick={handleLogout}
                        className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
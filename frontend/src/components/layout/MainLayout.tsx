import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Users,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  ChevronDown,
  User
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar para dispositivos móveis */}
      <div className={`lg:hidden fixed inset-0 z-20 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-gray-600 dark:bg-gray-900 opacity-75" onClick={closeSidebar}></div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 overflow-y-auto transition-transform transform 
                  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8">
              <circle cx="50" cy="50" r="45" fill="#32127A" />
              <circle cx="50" cy="50" r="35" fill="#A4D233" />
              <circle cx="50" cy="50" r="25" fill="#00ACEB" />
              <circle cx="50" cy="50" r="15" fill="#FFFFFF" />
            </svg>
            <span className="text-lg font-semibold text-gray-800 dark:text-white">EDP Gestão</span>
          </div>
          <button className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>

        <nav className="mt-5 px-4 space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `group flex items-center px-2 py-3 rounded-md ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            onClick={closeSidebar}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </NavLink>

          {user?.perfil === 'Administrador' && (
            <NavLink
              to="/utilizadores"
              className={({ isActive }) =>
                `group flex items-center px-2 py-3 rounded-md ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
              onClick={closeSidebar}
            >
              <Users className="mr-3 h-5 w-5" />
              Utilizadores
            </NavLink>
          )}

          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `group flex items-center px-2 py-3 rounded-md ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            onClick={closeSidebar}
          >
            <User className="mr-3 h-5 w-5" />
            Meu Perfil
          </NavLink>
        </nav>

        <div className="absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700 px-4 py-4">
          <button
            className="flex items-center px-2 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full rounded-md"
            onClick={toggleDarkMode}
          >
            {darkMode ? <Sun className="mr-3 h-5 w-5" /> : <Moon className="mr-3 h-5 w-5" />}
            {darkMode ? 'Modo Claro' : 'Modo Escuro'}
          </button>
          <button
            className="flex items-center px-2 py-2 mt-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full rounded-md"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        {/* Cabeçalho */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
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
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-2">
                      {user?.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:block">{user?.nome}</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <div className="font-medium text-gray-800 dark:text-white">{user?.nome}</div>
                        <div className="text-xs">{user?.email}</div>
                        <div className="text-xs mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          {user?.perfil}
                        </div>
                      </div>
                      <a
                        href="/perfil"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Meu Perfil
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                      >
                        Sair
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
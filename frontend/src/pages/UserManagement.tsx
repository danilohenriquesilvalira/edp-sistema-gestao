import React, { useState, useEffect, useMemo } from 'react';
import api, { getAvatarUrl } from '@/services/api';
import { toast } from 'react-toastify';
import { 
  Search, Edit, Trash2, Eye, Filter, X, ChevronLeft, ChevronRight, 
  UserPlus, Users, RefreshCw, UserCheck, UserX, BarChart3, PieChart,
  Activity, Calendar, Zap, Clock, CheckCircle, Database, Mail, History,
  FileText, Shield, LogIn, AlertTriangle, Info, ExternalLink, Monitor,
  ChevronDown, Terminal, Server, Code, User, MapPin, Lock, Smartphone,
  Settings
} from 'lucide-react';
import UserFormModal from '@/components/users/UserFormModal';
import UserDetailsModal from '@/components/users/UserDetailsModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import ErrorState from '@/components/common/ErrorState';
import { isOnline } from '@/utils/connectivity';
import { User as AuthUser } from '@/contexts/AuthContext';
import { 
  PieChart as RPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  Brush
} from 'recharts';

// Interface para usuário do sistema
interface User {
  id: number;
  nome: string;
  email: string;
  perfil: "Administrador" | "Utilizador";  // Restringindo para os valores esperados
  estado: "Ativo" | "Inativo";  // Restringindo para os valores esperados
  foto_perfil?: string;
}

// Interface para logs de auditoria
interface AuditLog {
  id: number;
  acao: string;
  modulo: string;
  entidade_id?: number;
  entidade_tipo?: string;
  detalhes: string; // JSON string
  ip: string;
  usuario_id: number;
  usuario_nome: string;
  created_at?: string; // Tornando opcional para compatibilidade
  updated_at?: string; // Tornando opcional para compatibilidade
  // Campos que podem vir do backend em português
  criado_em?: string;
  atualizado_em?: string;
  utilizador_id?: number;
  nome_utilizador?: string;
}

// Interface para detalhes de auditoria parseados
interface ParsedAuditDetails {
  [key: string]: any;
  session_id?: string;
  user_agent?: string;
  browser?: string;
  os?: string;
  before?: any;
  after?: any;
  changes?: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  request_ip?: string;
  affected_id?: number;
  affected_type?: string;
  status?: string;
  message?: string;
  action_details?: string;
}

// Interface para sessões de usuário
interface UserSession {
  id: number;
  usuario_id: number;
  ip: string;
  user_agent: string;
  ultimo_acesso: string;
  created_at: string;
  dispositivo: string;
  localizacao: string;
}

// Interface para ações de auditoria
interface AuditAction {
  id: number;
  nome: string;
  descricao: string;
}

// Interface para módulos de auditoria
interface AuditModule {
  id: number;
  nome: string;
  descricao: string;
}

// Interface para contagens de auditoria por módulo
interface ModuleCount {
  module: string;
  count: number;
}

// Interface para contagens de auditoria por ação
interface ActionCount {
  action: string;
  count: number;
}

// Interface para dados de atividade por dia
interface DailyActivity {
  date: string;
  count: number;
  module?: string;
}

const UserManagement: React.FC = () => {
  // Estados para usuários e paginação
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Estados para auditoria e sessões
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [parsedAuditLogs, setParsedAuditLogs] = useState<(AuditLog & { parsedDetails: ParsedAuditDetails })[]>([]);
  const [auditActions, setAuditActions] = useState<AuditAction[]>([]);
  const [auditModules, setAuditModules] = useState<AuditModule[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [selectedAuditLog, setSelectedAuditLog] = useState<(AuditLog & { parsedDetails: ParsedAuditDetails }) | null>(null);
  const [isAuditDetailModalOpen, setIsAuditDetailModalOpen] = useState(false);
  const [auditLogPage, setAuditLogPage] = useState(1);
  const [auditLogLimit, setAuditLogLimit] = useState(10);
  const [auditLogsFiltered, setAuditLogsFiltered] = useState<(AuditLog & { parsedDetails: ParsedAuditDetails })[]>([]);
  const [auditLogFilters, setAuditLogFilters] = useState({
    acao: '',
    modulo: '',
    usuario: '',
    periodo: 'todos'
  });
  
  // Estados para análise e gráficos derivados dos dados reais
  const [moduleCountData, setModuleCountData] = useState<ModuleCount[]>([]);
  const [actionCountData, setActionCountData] = useState<ActionCount[]>([]);
  const [dailyActivityData, setDailyActivityData] = useState<DailyActivity[]>([]);
  const [userActivityRanking, setUserActivityRanking] = useState<{userId: number, userName: string, count: number}[]>([]);
  
  // Estados de UI
  const [showFilters, setShowFilters] = useState(false);
  const [showAuditFilters, setShowAuditFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [activeDashboardTab, setActiveDashboardTab] = useState<'overview' | 'activity' | 'security'>('overview');
  const [filters, setFilters] = useState({
    perfil: '',
    estado: ''
  });
  
  // Estados de erro
  const [error, setError] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  
  // Estados para modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Carregar usuários paginados para a tabela
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    setIsNetworkError(false);
    
    try {
      // Verificar conexão com internet
      if (!isOnline()) {
        setIsNetworkError(true);
        setError('Sem conexão com a internet');
        toast.error('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
        setLoading(false);
        return;
      }
      
      // Parâmetros para a consulta
      const queryParams: Record<string, string | number> = {
        page: page.toString(),
        limit: limit.toString()
      };
      
      // Adicionar filtros se existirem
      if (search) queryParams.nome = search;
      if (filters.perfil) queryParams.perfil = filters.perfil;
      if (filters.estado) queryParams.estado = filters.estado;
      
      // Consultar API
      const response = await api.getUsers(queryParams);
      
      if (response.data.sucesso) {
        setUsers(response.data.dados);
        setTotalPages(response.data.meta.total_pages || 1);
        setTotalUsers(response.data.meta.total || 0);
      } else {
        console.error('API retornou sucesso=false:', response.data);
        setError(response.data.mensagem || 'Erro ao carregar usuários');
        toast.error(response.data.mensagem || 'Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      
      if (!navigator.onLine) {
        setIsNetworkError(true);
        setError('Sem conexão com a internet');
        toast.error('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
      } else {
        setError('Erro ao carregar a lista de usuários');
        toast.error('Erro ao carregar a lista de usuários. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Carregar todos os dados para dashboard
  const loadDashboardData = async () => {
    setLoadingStats(true);
    
    try {
      // Carregar todos os usuários (sem paginação)
      const allUsersResponse = await api.getUsers({ limit: 1000 });
      if (allUsersResponse.data.sucesso) {
        setAllUsers(allUsersResponse.data.dados || []);
      } else {
        console.error('Erro ao carregar usuários:', allUsersResponse.data);
        setError('Erro ao carregar dados de usuários');
      }

      // Carregar usuários ativos (sessões)
      try {
        const activeUsersResponse = await api.getActiveUsers();
        if (activeUsersResponse.data.sucesso) {
          setActiveUsers(activeUsersResponse.data.dados || []);
          setActiveSessionsCount(activeUsersResponse.data.dados?.length || 0);
        }
      } catch (err) {
        console.error('Erro ao carregar usuários ativos:', err);
        // Não interromper o fluxo, apenas registrar o erro
      }

      // Carregar logs de auditoria
      try {
        const auditLogsResponse = await api.getAuditLogs({ limit: 1000 });
        if (auditLogsResponse.data.sucesso) {
          // Mapear campos do backend para o frontend se necessário
          const logs = auditLogsResponse.data.dados.map((log: any) => ({
            id: log.id,
            acao: log.acao,
            modulo: log.modulo,
            entidade_id: log.entidade_id,
            entidade_tipo: log.entidade_tipo,
            detalhes: log.detalhes || '{}',
            ip: log.ip,
            usuario_id: log.utilizador_id || log.usuario_id || 0, // Garantir um valor válido
            usuario_nome: log.nome_utilizador || log.usuario_nome || 'Não identificado',
            created_at: log.criado_em || log.created_at || new Date().toISOString(), // Valor padrão
            updated_at: log.atualizado_em || log.updated_at
          }));
          
          setAuditLogs(logs);
          
          // Processar e parsear os logs de auditoria
          processAuditLogs(logs);
        }
      } catch (err) {
        console.error('Erro ao carregar logs de auditoria:', err);
        // Não interromper o fluxo, apenas registrar o erro
      }

      // Carregar ações de auditoria - omitir se não estiver funcionando
      /*
      try {
        const auditActionsResponse = await api.getAuditActions();
        if (auditActionsResponse.data.sucesso) {
          setAuditActions(auditActionsResponse.data.dados || []);
        }
      } catch (err) {
        console.error('Erro ao carregar ações de auditoria:', err);
      }
      */

      // Carregar módulos de auditoria - omitir se não estiver funcionando
      /*
      try {
        const auditModulesResponse = await api.getAuditModules();
        if (auditModulesResponse.data.sucesso) {
          setAuditModules(auditModulesResponse.data.dados || []);
        }
      } catch (err) {
        console.error('Erro ao carregar módulos de auditoria:', err);
      }
      */

      // Criar alguns dados de exemplo para ações, já que a API não está funcionando
      setAuditActions([
        { id: 1, nome: 'Login', descricao: 'Autenticação no sistema' },
        { id: 2, nome: 'Logout', descricao: 'Saída do sistema' },
        { id: 3, nome: 'Criar', descricao: 'Criação de registro' },
        { id: 4, nome: 'Atualizar', descricao: 'Atualização de registro' },
        { id: 5, nome: 'Excluir', descricao: 'Exclusão de registro' },
        { id: 6, nome: 'Visualizar', descricao: 'Visualização de dados' }
      ]);

      // Criar alguns dados de exemplo para módulos, já que a API não está funcionando
      setAuditModules([
        { id: 1, nome: 'Usuários', descricao: 'Gestão de usuários' },
        { id: 2, nome: 'Autenticação', descricao: 'Sistema de autenticação' },
        { id: 3, nome: 'Configurações', descricao: 'Configurações do sistema' },
        { id: 4, nome: 'Relatórios', descricao: 'Geração de relatórios' }
      ]);

      // Carregar todas as sessões de usuários
      if (allUsersResponse.data.sucesso && allUsersResponse.data.dados && allUsersResponse.data.dados.length > 0) {
        try {
          // Obter a primeira ID de usuário para exemplo (idealmente isso seria dinâmico)
          const firstUser = allUsersResponse.data.dados[0];
          
          if (firstUser && firstUser.id) {
            const sessionsResponse = await api.getUserSessions(firstUser.id, false);
            if (sessionsResponse.data.sucesso) {
              setUserSessions(sessionsResponse.data.dados || []);
            }
          }
        } catch (err) {
          console.error('Erro ao carregar sessões de usuário:', err);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados para dashboard:', error);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoadingStats(false);
    }
  };

  // Parsear o JSON do campo "detalhes" dos logs de auditoria
  const parseAuditDetails = (detalhesJson: string): ParsedAuditDetails => {
    try {
      if (!detalhesJson || detalhesJson.trim() === '') return {};
      
      // Tentativa de parse do JSON
      let details;
      try {
        details = JSON.parse(detalhesJson);
      } catch (error) {
        console.error('Erro ao parsear o JSON dos detalhes:', error);
        // Se falhar o parse, retornar um objeto com o texto bruto
        return {
          raw_data: detalhesJson
        };
      }
      
      // Se não for um objeto, envolver em um objeto
      if (typeof details !== 'object' || details === null) {
        details = { value: details };
      }
      
      // Detectar padrões específicos e formatar os dados
      const parsedDetails: ParsedAuditDetails = { ...details };
      
      // Se houver campos before e after, extrair as mudanças
      if (details.before && details.after) {
        parsedDetails.changes = [];
        
        // Comparar os objetos e extrair as mudanças
        Object.keys(details.after).forEach(key => {
          const oldValue = details.before[key];
          const newValue = details.after[key];
          
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            if (parsedDetails.changes) {
              parsedDetails.changes.push({
                field: key,
                old_value: oldValue,
                new_value: newValue
              });
            }
          }
        });
      }
      
      // Detectar informações de user agent se existirem
      if (details.user_agent) {
        const uaString = details.user_agent.toLowerCase();
        
        // Extrair informações de browser
        if (uaString.includes('chrome')) {
          parsedDetails.browser = 'Chrome';
        } else if (uaString.includes('firefox')) {
          parsedDetails.browser = 'Firefox';
        } else if (uaString.includes('safari') && !uaString.includes('chrome')) {
          parsedDetails.browser = 'Safari';
        } else if (uaString.includes('edge')) {
          parsedDetails.browser = 'Edge';
        } else if (uaString.includes('opera')) {
          parsedDetails.browser = 'Opera';
        } else {
          parsedDetails.browser = 'Outro';
        }
        
        // Extrair informações de sistema operacional
        if (uaString.includes('windows')) {
          parsedDetails.os = 'Windows';
        } else if (uaString.includes('macintosh') || uaString.includes('mac os')) {
          parsedDetails.os = 'macOS';
        } else if (uaString.includes('linux')) {
          parsedDetails.os = 'Linux';
        } else if (uaString.includes('android')) {
          parsedDetails.os = 'Android';
        } else if (uaString.includes('iphone') || uaString.includes('ipad')) {
          parsedDetails.os = 'iOS';
        } else {
          parsedDetails.os = 'Outro';
        }
      }
      
      return parsedDetails;
    } catch (error) {
      console.error('Erro ao parsear detalhes de auditoria:', error);
      return { error: 'Erro ao processar detalhes' };
    }
  };

  // Processar logs de auditoria e parsear os detalhes
  const processAuditLogs = (logs: AuditLog[]) => {
    if (!logs || logs.length === 0) return;
    
    // Parsear os detalhes de cada log
    try {
      const processed = logs.map(log => {
        // Garantir que sempre temos um created_at válido
        const processedLog = {
          ...log,
          // Garantir que temos um campo created_at, mesmo que o backend use criado_em
          created_at: log.created_at || log.criado_em || new Date().toISOString()
        };
        
        return {
          ...processedLog,
          parsedDetails: parseAuditDetails(log.detalhes)
        } as AuditLog & { parsedDetails: ParsedAuditDetails };
      });
      
      setParsedAuditLogs(processed);
      setAuditLogsFiltered(processed);
      
      // Processar dados para gráficos e estatísticas
      processAuditData(logs);
    } catch (error) {
      console.error('Erro ao processar logs de auditoria:', error);
    }
  };

  // Processar dados de auditoria para gráficos e estatísticas
  const processAuditData = (logs: AuditLog[]) => {
    if (!logs || logs.length === 0) return;

    // Contar ocorrências por módulo
    const moduleMap = new Map<string, number>();
    logs.forEach(log => {
      const module = log.modulo || 'Desconhecido';
      moduleMap.set(module, (moduleMap.get(module) || 0) + 1);
    });
    
    // Converter para formato de gráfico
    const moduleData: ModuleCount[] = Array.from(moduleMap.entries()).map(([module, count]) => ({
      module,
      count
    }));
    
    setModuleCountData(moduleData);

    // Contar ocorrências por ação
    const actionMap = new Map<string, number>();
    logs.forEach(log => {
      const action = log.acao || 'Desconhecido';
      actionMap.set(action, (actionMap.get(action) || 0) + 1);
    });
    
    // Converter para formato de gráfico
    const actionData: ActionCount[] = Array.from(actionMap.entries()).map(([action, count]) => ({
      action,
      count
    }));
    
    setActionCountData(actionData);

    // Agrupar atividades por dia
    const dailyMap = new Map<string, number>();
    logs.forEach(log => {
      // Extrair a data (sem a hora)
      const date = new Date(log.created_at || '').toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });
    
    // Ordenar por data
    const dailyData: DailyActivity[] = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    setDailyActivityData(dailyData);

    // Ranking de usuários por atividade
    const userActivityMap = new Map<number, { count: number, name: string }>();
    logs.forEach(log => {
      if (!log.usuario_id) return;
      
      const current = userActivityMap.get(log.usuario_id) || { count: 0, name: log.usuario_nome || `User ${log.usuario_id}` };
      userActivityMap.set(log.usuario_id, {
        count: current.count + 1,
        name: current.name
      });
    });
    
    // Converter para array, ordenar e pegar os top 10
    const userRanking = Array.from(userActivityMap.entries())
      .map(([userId, data]) => ({ userId, userName: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    setUserActivityRanking(userRanking);
  };

  // Filtrar logs de auditoria
  const filterAuditLogs = () => {
    if (!parsedAuditLogs || parsedAuditLogs.length === 0) return;
    
    let filtered = [...parsedAuditLogs];
    
    // Filtrar por ação
    if (auditLogFilters.acao) {
      filtered = filtered.filter(log => 
        log.acao.toLowerCase().includes(auditLogFilters.acao.toLowerCase())
      );
    }
    
    // Filtrar por módulo
    if (auditLogFilters.modulo) {
      filtered = filtered.filter(log => 
        log.modulo.toLowerCase().includes(auditLogFilters.modulo.toLowerCase())
      );
    }
    
    // Filtrar por usuário
    if (auditLogFilters.usuario) {
      filtered = filtered.filter(log => 
        log.usuario_nome.toLowerCase().includes(auditLogFilters.usuario.toLowerCase()) ||
        log.usuario_id.toString() === auditLogFilters.usuario
      );
    }
    
    // Filtrar por período
    if (auditLogFilters.periodo !== 'todos') {
      const now = new Date();
      let startDate: Date;
      
      switch (auditLogFilters.periodo) {
        case 'hoje':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'ontem':
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'semana':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'mes':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0); // início dos tempos
      }
      
      filtered = filtered.filter(log => new Date(log.created_at || '') >= startDate);
    }
    
    // Ordenar por data, mais recentes primeiro
    filtered.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
    
    setAuditLogsFiltered(filtered);
    setAuditLogPage(1); // Reset para a primeira página
  };

  // Resetar filtros de auditoria
  const resetAuditFilters = () => {
    setAuditLogFilters({
      acao: '',
      modulo: '',
      usuario: '',
      periodo: 'todos'
    });
    
    setAuditLogsFiltered(parsedAuditLogs);
    setAuditLogPage(1);
  };

  // Carregar usuários quando a página ou filtros mudam
  useEffect(() => {
    loadUsers();
  }, [page, limit, filters]);

  // Carregar dados do dashboard na montagem inicial
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Aplicar filtros quando mudarem
  useEffect(() => {
    filterAuditLogs();
  }, [auditLogFilters]);

  // Pesquisar quando o formulário for submetido
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  // Obter logs de auditoria paginados
  const getPaginatedAuditLogs = () => {
    const startIndex = (auditLogPage - 1) * auditLogLimit;
    const endIndex = startIndex + auditLogLimit;
    return auditLogsFiltered.slice(startIndex, endIndex);
  };

  // Abrir modal de detalhes de auditoria
  const handleViewAuditDetails = (log: AuditLog & { parsedDetails: ParsedAuditDetails }) => {
    console.log("Visualizando detalhes do log:", log);
    setSelectedAuditLog(log);
    setIsAuditDetailModalOpen(true);
  };

  // Resetar filtros
  const resetFilters = () => {
    setFilters({
      perfil: '',
      estado: ''
    });
    setSearch('');
    setPage(1);
  };

  // Abrir modal de criação
  const handleCreate = () => {
    setSelectedUser(null);
    setIsCreateModalOpen(true);
  };

  // Abrir modal de edição
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // Abrir modal de visualização
  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  // Abrir modal de exclusão
  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Confirmar exclusão
  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await api.deleteUser(selectedUser.id);
      
      if (response.data.sucesso) {
        toast.success('Utilizador excluído com sucesso');
        loadUsers();
        loadDashboardData();
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir utilizador');
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  // Após salvar usuário
  const handleUserSaved = () => {
    loadUsers();
    loadDashboardData();
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Recarregar todos os dados
  const refreshAll = () => {
    loadUsers();
    loadDashboardData();
  };

  // Estatísticas derivadas de usuários
  const userStats = useMemo(() => {
    // Verificar se existem dados antes de calcular
    if (!allUsers || allUsers.length === 0) {
      return {
        totalUsers: 0,
        adminUsers: 0,
        regularUsers: 0,
        activeUsersCount: 0,
        inactiveUsers: 0,
        onlineUsers: 0,
        profileDistribution: [
          { name: 'Administradores', value: 0 },
          { name: 'Utilizadores', value: 0 }
        ],
        statusDistribution: [
          { name: 'Ativos', value: 0 },
          { name: 'Inativos', value: 0 }
        ]
      };
    }

    // Calcular estatísticas quando existem dados
    try {
      const adminUsers = allUsers.filter(user => user.perfil === 'Administrador').length;
      const regularUsers = allUsers.length - adminUsers;
      const activeUsersCount = allUsers.filter(user => user.estado === 'Ativo').length;
      const inactiveUsers = allUsers.length - activeUsersCount;
      
      return {
        totalUsers: allUsers.length,
        adminUsers,
        regularUsers,
        activeUsersCount,
        inactiveUsers,
        onlineUsers: activeSessionsCount,
        profileDistribution: [
          { name: 'Administradores', value: adminUsers },
          { name: 'Utilizadores', value: regularUsers }
        ],
        statusDistribution: [
          { name: 'Ativos', value: activeUsersCount },
          { name: 'Inativos', value: inactiveUsers }
        ]
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas de usuários:', error);
      // Retornar valores padrão em caso de erro
      return {
        totalUsers: allUsers.length || 0,
        adminUsers: 0,
        regularUsers: 0,
        activeUsersCount: 0,
        inactiveUsers: 0,
        onlineUsers: activeSessionsCount,
        profileDistribution: [
          { name: 'Administradores', value: 0 },
          { name: 'Utilizadores', value: 0 }
        ],
        statusDistribution: [
          { name: 'Ativos', value: 0 },
          { name: 'Inativos', value: 0 }
        ]
      };
    }
  }, [allUsers, activeSessionsCount]);

  // Estatísticas derivadas de auditoria
  const auditStats = useMemo(() => {
    if (!auditLogs || auditLogs.length === 0) {
      return {
        totalLogs: 0,
        uniqueUsers: 0,
        loginCount: 0,
        dataChangeCount: 0,
        lastActivity: null
      };
    }
    
    const uniqueUserIds = new Set(auditLogs.map(log => log.usuario_id));
    const loginLogs = auditLogs.filter(log => log.acao.toLowerCase().includes('login') || log.acao.toLowerCase().includes('autenticar'));
    const dataChangeLogs = auditLogs.filter(log => 
      log.acao.toLowerCase().includes('criar') || 
      log.acao.toLowerCase().includes('atualizar') || 
      log.acao.toLowerCase().includes('editar') || 
      log.acao.toLowerCase().includes('excluir') || 
      log.acao.toLowerCase().includes('remover')
    );
    
    // Encontrar a atividade mais recente
    const sortedLogs = [...auditLogs].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
    
    return {
      totalLogs: auditLogs.length,
      uniqueUsers: uniqueUserIds.size,
      loginCount: loginLogs.length,
      dataChangeCount: dataChangeLogs.length,
      lastActivity: sortedLogs.length > 0 ? sortedLogs[0] : null
    };
  }, [auditLogs]);

  // Cores para gráficos
  const chartColors = {
    primary: '#00B0EA', // Azul EDP
    secondary: '#64D2FF',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    gradient: {
      cyan: ['#00B0EA', '#64D2FF', '#c8eeff'],
      green: ['#10B981', '#34D399', '#A7F3D0'],
      red: ['#EF4444', '#F87171', '#FCA5A5'],
      amber: ['#F59E0B', '#FBBF24', '#FCD34D'],
      blue: ['#3B82F6', '#60A5FA', '#93C5FD']
    }
  };

  // Formatar números com separadores de milhares
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('pt-PT').format(num);
  };

  // Formatar data - corrigido para lidar com undefined
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Data não disponível';
    
    try {
      const date = new Date(dateString);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      
      return date.toLocaleDateString('pt-PT', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Erro ao formatar data';
    }
  };

  // Customizar tooltip para gráficos
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Pegar o ícone para um tipo de ação de auditoria
  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('login') || actionLower.includes('autenticar')) {
      return <LogIn className="h-4 w-4" />;
    } else if (actionLower.includes('criar') || actionLower.includes('adicionar')) {
      return <UserPlus className="h-4 w-4" />;
    } else if (actionLower.includes('atualizar') || actionLower.includes('editar')) {
      return <Edit className="h-4 w-4" />;
    } else if (actionLower.includes('excluir') || actionLower.includes('remover')) {
      return <Trash2 className="h-4 w-4" />;
    } else if (actionLower.includes('visualizar') || actionLower.includes('ver')) {
      return <Eye className="h-4 w-4" />;
    } else if (actionLower.includes('erro')) {
      return <AlertTriangle className="h-4 w-4" />;
    } else {
      return <Activity className="h-4 w-4" />;
    }
  };

  // Pegar a cor de classe para um tipo de ação de auditoria
  const getActionColorClass = (action: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('login') || actionLower.includes('autenticar')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    } else if (actionLower.includes('criar') || actionLower.includes('adicionar')) {
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300';
    } else if (actionLower.includes('atualizar') || actionLower.includes('editar')) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    } else if (actionLower.includes('excluir') || actionLower.includes('remover')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    } else if (actionLower.includes('visualizar') || actionLower.includes('ver')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    } else if (actionLower.includes('erro')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Pegar o ícone para um módulo
  const getModuleIcon = (module: string) => {
    const moduleLower = module.toLowerCase();
    
    if (moduleLower.includes('usuario') || moduleLower.includes('utilizador')) {
      return <User className="h-4 w-4" />;
    } else if (moduleLower.includes('auth') || moduleLower.includes('autenticacao')) {
      return <Lock className="h-4 w-4" />;
    } else if (moduleLower.includes('sistema')) {
      return <Server className="h-4 w-4" />;
    } else if (moduleLower.includes('relatorio')) {
      return <FileText className="h-4 w-4" />;
    } else if (moduleLower.includes('config')) {
      return <Settings className="h-4 w-4" />;
    } else {
      return <Database className="h-4 w-4" />;
    }
  };

  // Renderizar o conteúdo do dashboard conforme a aba ativa
  const renderDashboardContent = () => {
    switch (activeDashboardTab) {
      case 'overview':
        return renderOverviewTab();
      case 'activity':
        return renderActivityTab();
      case 'security':
        return renderSecurityTab();
      default:
        return renderOverviewTab();
    }
  };

  // Renderizar aba de visão geral
  const renderOverviewTab = () => {
    return (
      <>
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total de Utilizadores */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl blur-md opacity-50 group-hover:opacity-60 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700 text-white rounded-xl p-4 backdrop-blur-sm overflow-hidden h-full transition-transform group-hover:translate-y-[-2px] group-hover:shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-sm opacity-90">Total de Utilizadores</div>
                <div className="bg-white/20 rounded-lg p-2">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              
              {loadingStats ? (
                <div className="h-10 w-24 bg-white/20 rounded-md animate-pulse"></div>
              ) : (
                <div className="text-3xl font-bold">{formatNumber(userStats.totalUsers)}</div>
              )}
              
              <div className="flex mt-4 text-xs">
                <div className="bg-white/20 px-2 py-1 rounded-md">
                  <FileText className="h-3 w-3 inline mr-1" />
                  <span>Todos os registros</span>
                </div>
              </div>
              
              {/* Elemento decorativo */}
              <div className="absolute -right-8 -bottom-8 bg-white/5 rounded-full h-32 w-32"></div>
            </div>
          </div>

          {/* Utilizadores Online */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl blur-md opacity-50 group-hover:opacity-60 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white rounded-xl p-4 backdrop-blur-sm overflow-hidden h-full transition-transform group-hover:translate-y-[-2px] group-hover:shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-sm opacity-90">Utilizadores Online</div>
                <div className="bg-white/20 rounded-lg p-2">
                  <UserCheck className="h-5 w-5" />
                </div>
              </div>
              
              {loadingStats ? (
                <div className="h-10 w-24 bg-white/20 rounded-md animate-pulse"></div>
              ) : (
                <>
                  <div className="text-3xl font-bold">{formatNumber(userStats.onlineUsers)}</div>
                  <div className="text-sm mt-1 opacity-80">de {formatNumber(userStats.totalUsers)} totais</div>
                </>
              )}
              
              <div className="flex mt-2 text-xs">
                <div className="bg-white/20 px-2 py-1 rounded-md">
                  <Clock className="h-3 w-3 inline mr-1" />
                  <span>Sessões ativas</span>
                </div>
              </div>
              
              {/* Elemento decorativo */}
              <div className="absolute -right-8 -bottom-8 bg-white/5 rounded-full h-32 w-32"></div>
            </div>
          </div>

          {/* Administradores */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl blur-md opacity-50 group-hover:opacity-60 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white rounded-xl p-4 backdrop-blur-sm overflow-hidden h-full transition-transform group-hover:translate-y-[-2px] group-hover:shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-sm opacity-90">Administradores</div>
                <div className="bg-white/20 rounded-lg p-2">
                  <Shield className="h-5 w-5" />
                </div>
              </div>
              
              {loadingStats ? (
                <div className="h-10 w-24 bg-white/20 rounded-md animate-pulse"></div>
              ) : (
                <>
                  <div className="text-3xl font-bold">{formatNumber(userStats.adminUsers)}</div>
                  <div className="text-sm mt-1 opacity-80">
                    {Math.round((userStats.adminUsers / userStats.totalUsers) * 100) || 0}% do total
                  </div>
                </>
              )}
              
              <div className="flex mt-2 text-xs">
                <div className="bg-white/20 px-2 py-1 rounded-md">
                  <Shield className="h-3 w-3 inline mr-1" />
                  <span>Acesso total</span>
                </div>
              </div>
              
              {/* Elemento decorativo */}
              <div className="absolute -right-8 -bottom-8 bg-white/5 rounded-full h-32 w-32"></div>
            </div>
          </div>

          {/* Utilizadores Inativos */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl blur-md opacity-50 group-hover:opacity-60 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white rounded-xl p-4 backdrop-blur-sm overflow-hidden h-full transition-transform group-hover:translate-y-[-2px] group-hover:shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-sm opacity-90">Utilizadores Inativos</div>
                <div className="bg-white/20 rounded-lg p-2">
                  <UserX className="h-5 w-5" />
                </div>
              </div>
              
              {loadingStats ? (
                <div className="h-10 w-24 bg-white/20 rounded-md animate-pulse"></div>
              ) : (
                <>
                  <div className="text-3xl font-bold">{formatNumber(userStats.inactiveUsers)}</div>
                  <div className="text-sm mt-1 opacity-80">
                    {Math.round((userStats.inactiveUsers / userStats.totalUsers) * 100) || 0}% do total
                  </div>
                </>
              )}
              
              <div className="flex mt-2 text-xs">
                <div className="bg-white/20 px-2 py-1 rounded-md">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  <span>Acesso restrito</span>
                </div>
              </div>
              
              {/* Elemento decorativo */}
              <div className="absolute -right-8 -bottom-8 bg-white/5 rounded-full h-32 w-32"></div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-2">
          {/* Distribuição de Perfis - Gráfico de Donut moderno */}
          <div className="relative group">
            <div className="absolute inset-0 bg-white/5 dark:bg-white/5 rounded-xl blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white dark:bg-[#1a2632] rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-800 h-full group-hover:shadow-md transition-all">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Distribuição por Perfil</h3>
                <div className="p-1.5 bg-cyan-50 dark:bg-cyan-900/20 rounded-md">
                  <PieChart className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>
              
              {loadingStats ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
                </div>
              ) : (
                <div className="h-64 relative">
                  {/* Valor central - Total de usuários */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                    <span className="text-3xl font-bold text-gray-800 dark:text-white">{userStats.totalUsers}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Utilizadores</span>
                  </div>
                  
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <defs>
                        {/* Gradientes mais vibrantes */}
                        <linearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#2563EB" />
                        </linearGradient>
                        <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" />
                          <stop offset="100%" stopColor="#0EA5E9" />
                        </linearGradient>
                        <filter id="shadow" height="200%">
                          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#64748B" floodOpacity="0.2" />
                        </filter>
                      </defs>
                      <Pie
                        data={userStats.profileDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        strokeWidth={3}
                        animationDuration={1500}
                        animationBegin={300}
                        filter="url(#shadow)"
                      >
                        {userStats.profileDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? 'url(#adminGradient)' : 'url(#userGradient)'} 
                            stroke={index === 0 ? '#2563EB' : '#0EA5E9'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={<CustomTooltip />}
                        animationDuration={200}
                        animationEasing="ease-out"
                      />
                    </RPieChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              <div className="flex justify-center gap-8 mt-4">
                {userStats.profileDistribution.map((entry, index) => (
                  <div key={`legend-${index}`} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: index === 0 ? '#3B82F6' : '#38BDF8' }} 
                    />
                    <span className="text-gray-600 dark:text-gray-400 text-sm flex items-center">
                      <span className="font-medium mr-1">{entry.name}:</span> 
                      <span className="font-semibold">{formatNumber(entry.value)}</span>
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-500">
                        ({entry.value ? Math.round((entry.value / userStats.totalUsers) * 100) : 0}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Estado dos Utilizadores - Gráfico de Donut moderno */}
          <div className="relative group">
            <div className="absolute inset-0 bg-white/5 dark:bg-white/5 rounded-xl blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white dark:bg-[#1a2632] rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-800 h-full group-hover:shadow-md transition-all">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado dos Utilizadores</h3>
                <div className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              {loadingStats ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="h-64 relative">
                  {/* Valor central - Taxa de atividade */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                    <span className="text-3xl font-bold text-gray-800 dark:text-white">
                      {userStats.totalUsers ? Math.round((userStats.activeUsersCount / userStats.totalUsers) * 100) : 0}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Taxa de Atividade</span>
                  </div>
                  
                  <ResponsiveContainer width="100%" height="100%">
                    <RPieChart>
                      <defs>
                        {/* Gradientes mais vibrantes */}
                        <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="inactiveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F87171" />
                          <stop offset="100%" stopColor="#EF4444" />
                        </linearGradient>
                        <filter id="shadow2" height="200%">
                          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#64748B" floodOpacity="0.2" />
                        </filter>
                      </defs>
                      <Pie
                        data={userStats.statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        strokeWidth={3}
                        animationDuration={1500}
                        animationBegin={300}
                        filter="url(#shadow2)"
                      >
                        {userStats.statusDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? 'url(#activeGradient)' : 'url(#inactiveGradient)'} 
                            stroke={index === 0 ? '#059669' : '#EF4444'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={<CustomTooltip />}
                        animationDuration={200}
                        animationEasing="ease-out"
                      />
                    </RPieChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              <div className="flex justify-center gap-8 mt-4">
                {userStats.statusDistribution.map((entry, index) => (
                  <div key={`legend-${index}`} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ 
                        backgroundColor: index === 0 ? '#10B981' : '#F87171'
                      }} 
                    />
                    <span className="text-gray-600 dark:text-gray-400 text-sm flex items-center">
                      <span className="font-medium mr-1">{entry.name}:</span> 
                      <span className="font-semibold">{formatNumber(entry.value)}</span>
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-500">
                        ({entry.value && userStats.totalUsers ? Math.round((entry.value / userStats.totalUsers) * 100) : 0}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Renderizar aba de atividade (com dados de auditoria reais)
  const renderActivityTab = () => {
    const paginatedLogs = getPaginatedAuditLogs();
    const totalAuditPages = Math.ceil(auditLogsFiltered.length / auditLogLimit);
    
    return (
      <>
        {/* Gráficos de Atividade por Módulo e Usuários Mais Ativos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Atividade por Módulo */}
          <div className="relative group">
            <div className="absolute inset-0 bg-white/5 dark:bg-white/5 rounded-xl blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white dark:bg-[#1a2632] rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-800 h-full group-hover:shadow-md transition-all">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Atividade por Módulo</h3>
                <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                  <Database className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              
              {loadingStats || moduleCountData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  {loadingStats ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
                  ) : (
                    <div className="text-center">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">Sem dados de módulos disponíveis</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={moduleCountData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        type="number" 
                        stroke="#94a3b8" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        dataKey="module" 
                        type="category" 
                        stroke="#94a3b8" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <defs>
                        <linearGradient id="barGradientModule" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={chartColors.gradient.amber[0]} />
                          <stop offset="100%" stopColor={chartColors.gradient.amber[1]} />
                        </linearGradient>
                      </defs>
                      <Bar 
                        dataKey="count" 
                        name="Atividades" 
                        fill="url(#barGradientModule)" 
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Usuários Mais Ativos */}
          <div className="relative group">
            <div className="absolute inset-0 bg-white/5 dark:bg-white/5 rounded-xl blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-white dark:bg-[#1a2632] rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-800 h-full group-hover:shadow-md transition-all">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Usuários Mais Ativos</h3>
                <div className="p-1.5 bg-cyan-50 dark:bg-cyan-900/20 rounded-md">
                  <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>
              
              {loadingStats || userActivityRanking.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  {loadingStats ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
                  ) : (
                    <div className="text-center">
                      <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">Sem dados de atividade por usuário</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                  {userActivityRanking.map((user, index) => (
                    <div 
                      key={user.userId} 
                      className={`flex items-center justify-between p-3 rounded-lg mb-2 ${
                        index === 0 
                          ? 'bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-100 dark:border-cyan-900/30' 
                          : index === 1 
                            ? 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700' 
                            : index === 2 
                              ? 'bg-gradient-to-r from-amber-50 to-amber-100/80 dark:from-amber-900/20 dark:to-amber-900/10 border border-amber-100 dark:border-amber-900/30' 
                              : 'bg-white dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white ${
                          index === 0 
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-600' 
                            : index === 1 
                              ? 'bg-gradient-to-br from-gray-500 to-gray-600' 
                              : index === 2 
                                ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
                                : 'bg-gradient-to-br from-cyan-600 to-cyan-700'
                        }`}>
                          {index < 3 ? (index + 1) : <Users size={14} />}
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[150px]">
                            {user.userName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {user.userId}
                          </p>
                        </div>
                      </div>
                      <div className="flex-none">
                        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          index === 0 
                            ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' 
                            : index === 1 
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-800/70 dark:text-gray-300' 
                              : index === 2 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' 
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}>
                          {user.count} atividades
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Filtros de Logs de Auditoria */}
        <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-800 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <History className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
              Logs de Auditoria
              <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                {auditLogsFiltered.length} registros
              </span>
            </h3>
            
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <button
                className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
                onClick={() => setShowAuditFilters(!showAuditFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showAuditFilters ? 'Ocultar Filtros' : 'Filtros'}
              </button>
              
              {(auditLogFilters.acao || auditLogFilters.modulo || auditLogFilters.usuario || auditLogFilters.periodo !== 'todos') && (
                <button
                  className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
                  onClick={resetAuditFilters}
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpar
                </button>
              )}
              
              <button
                onClick={refreshAll}
                className={`bg-blue-600 hover:bg-blue-700 transition-all px-2.5 py-1.5 rounded-lg text-sm flex items-center shadow-sm text-white ${loadingStats ? 'opacity-75 cursor-not-allowed' : ''}`}
                disabled={loadingStats}
                title="Atualizar logs"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${loadingStats ? 'animate-spin' : ''}`} />
                {loadingStats ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
          </div>
          
          {showAuditFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ação
                </label>
                <input
                  type="text"
                  placeholder="Filtrar por ação..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={auditLogFilters.acao}
                  onChange={(e) => setAuditLogFilters({...auditLogFilters, acao: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Módulo
                </label>
                <input
                  type="text"
                  placeholder="Filtrar por módulo..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={auditLogFilters.modulo}
                  onChange={(e) => setAuditLogFilters({...auditLogFilters, modulo: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Usuário
                </label>
                <input
                  type="text"
                  placeholder="Nome ou ID do usuário..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={auditLogFilters.usuario}
                  onChange={(e) => setAuditLogFilters({...auditLogFilters, usuario: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Período
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={auditLogFilters.periodo}
                  onChange={(e) => setAuditLogFilters({...auditLogFilters, periodo: e.target.value})}
                >
                  <option value="todos">Todos os períodos</option>
                  <option value="hoje">Hoje</option>
                  <option value="ontem">Ontem</option>
                  <option value="semana">Última semana</option>
                  <option value="mes">Último mês</option>
                </select>
              </div>
            </div>
          )}
          
          {/* Tabela de Logs de Auditoria Melhorada */}
          <div className="overflow-x-auto">
            {loadingStats ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : auditLogsFiltered.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum log de auditoria encontrado</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Tente ajustar os filtros ou verificar se os logs estão sendo gerados</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-4"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ação</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Módulo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entidade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-gray-400 dark:text-gray-600">
                          {getActionIcon(log.acao)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs font-medium rounded-full ${getActionColorClass(log.acao)}`}>
                          {log.acao}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 flex items-center">
                        <span className="mr-1.5">
                          {getModuleIcon(log.modulo)}
                        </span>
                        {log.modulo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {log.entidade_tipo ? (
                          <span>
                            {log.entidade_tipo} #{log.entidade_id}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-6 w-6 mr-2">
                            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                              {log.usuario_nome ? log.usuario_nome.charAt(0).toUpperCase() : 'U'}
                            </div>
                          </div>
                          <div>
                            {log.usuario_nome || `ID ${log.usuario_id}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          {log.ip}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewAuditDetails(log)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Ver detalhes do log"
                        >
                          <Info size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Paginação para Logs de Auditoria */}
          {auditLogsFiltered.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando <span className="font-medium">{(auditLogPage - 1) * auditLogLimit + 1}</span> a <span className="font-medium">{Math.min(auditLogPage * auditLogLimit, auditLogsFiltered.length)}</span> de <span className="font-medium">{auditLogsFiltered.length}</span> registros
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAuditLogPage(auditLogPage - 1)}
                  disabled={auditLogPage === 1}
                  className={`relative inline-flex items-center px-2 py-1 rounded-lg text-sm font-medium ${
                    auditLogPage === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                
                <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium">
                  {auditLogPage} de {totalAuditPages}
                </span>
                
                <button
                  onClick={() => setAuditLogPage(auditLogPage + 1)}
                  disabled={auditLogPage === totalAuditPages}
                  className={`relative inline-flex items-center px-2 py-1 rounded-lg text-sm font-medium ${
                    auditLogPage === totalAuditPages 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              
              <div className="flex items-center">
                <label className="text-xs text-gray-700 dark:text-gray-300 mr-2">Por página:</label>
                <select
                  className="border border-gray-300 dark:border-gray-600 rounded-md text-sm py-1 px-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  value={auditLogLimit}
                  onChange={(e) => {
                    setAuditLogLimit(Number(e.target.value));
                    setAuditLogPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  // Modal de Detalhes do Log de Auditoria
  const AuditLogDetailModal = () => {
    if (!selectedAuditLog) return null;
    
    // Extrair informações do log selecionado
    const { 
      id, 
      acao, 
      modulo, 
      entidade_id, 
      entidade_tipo, 
      detalhes, 
      ip, 
      usuario_id, 
      usuario_nome, 
      created_at, 
      parsedDetails 
    } = selectedAuditLog;
    
    // Determinar tipo de log para exibição específica
    const isLoginLog = acao.toLowerCase().includes('login') || acao.toLowerCase().includes('autenticar');
    const isDataChangeLog = parsedDetails.before && parsedDetails.after;
    const isViewLog = acao.toLowerCase().includes('visualizar') || acao.toLowerCase().includes('ver');
    const isErrorLog = acao.toLowerCase().includes('erro');
    
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
        <div className="relative bg-white dark:bg-[#212E3C] rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Cabeçalho */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-[#212E3C] z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getActionColorClass(acao)}`}>
                  {getActionIcon(acao)}
                </span>
                Detalhes do Log de Auditoria #{id}
              </h3>
              <button
                onClick={() => setIsAuditDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Conteúdo */}
          <div className="px-6 py-4">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Informações Gerais</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Ação:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColorClass(acao)}`}>{acao}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Módulo:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      {getModuleIcon(modulo)}
                      <span className="ml-1.5">{modulo}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Data:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(created_at)}</span>
                  </div>
                  {entidade_tipo && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Entidade:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{entidade_tipo} #{entidade_id}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Usuário e Acesso</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Usuário:</span>
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium mr-2">
                        {usuario_nome ? usuario_nome.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{usuario_nome || `ID ${usuario_id}`}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">IP:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" /> {ip}
                    </span>
                  </div>
                  {parsedDetails.user_agent && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Dispositivo:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {parsedDetails.browser && parsedDetails.os ? `${parsedDetails.browser} / ${parsedDetails.os}` : parsedDetails.user_agent.substring(0, 30)}
                      </span>
                    </div>
                  )}
                  {parsedDetails.session_id && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Sessão:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">#{parsedDetails.session_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Detalhes Específicos do Log */}
            <div className="mt-6">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-4">Detalhes da Atividade</h4>
              
              {/* Diferentes visualizações baseadas no tipo de log */}
              {isLoginLog && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="bg-green-100 dark:bg-green-800/40 rounded-full p-2 mr-3">
                      <LogIn className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-green-800 dark:text-green-300">Login Realizado</h5>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        Usuário {usuario_nome || `ID ${usuario_id}`} acessou o sistema a partir de {ip}
                      </p>
                      {parsedDetails.browser && parsedDetails.os && (
                        <div className="mt-2 text-xs text-green-600 dark:text-green-500 flex items-center">
                          <Monitor className="h-3.5 w-3.5 mr-1.5" /> Usando {parsedDetails.browser} em {parsedDetails.os}
                        </div>
                      )}
                      {parsedDetails.status && (
                        <div className="mt-2 flex items-center">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                            parsedDetails.status.toLowerCase() === 'sucesso' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                          }`}>
                            Status: {parsedDetails.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {isDataChangeLog && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="bg-amber-100 dark:bg-amber-800/40 rounded-full p-2 mr-3">
                      <Edit className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-grow">
                      <h5 className="text-sm font-medium text-amber-800 dark:text-amber-300">Alterações Realizadas</h5>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                        {parsedDetails.changes?.length || 0} campos foram modificados em {entidade_tipo} #{entidade_id}
                      </p>
                      
                      {parsedDetails.changes && parsedDetails.changes.length > 0 && (
                        <div className="mt-3 border border-amber-200 dark:border-amber-900/50 rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-amber-200 dark:divide-amber-900/50">
                            <thead className="bg-amber-100 dark:bg-amber-900/30">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-amber-800 dark:text-amber-300">Campo</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-amber-800 dark:text-amber-300">Valor Anterior</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-amber-800 dark:text-amber-300">Novo Valor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-200 dark:divide-amber-900/50">
                              {parsedDetails.changes.map((change, index) => (
                                <tr key={index} className="bg-white dark:bg-transparent">
                                  <td className="px-3 py-2 text-xs text-amber-800 dark:text-amber-300 font-medium whitespace-nowrap">
                                    {change.field}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-amber-700 dark:text-amber-400 whitespace-nowrap">
                                    {change.old_value === null || change.old_value === undefined 
                                      ? <span className="text-amber-400 dark:text-amber-600">Não definido</span> 
                                      : String(change.old_value).substring(0, 50)}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-amber-700 dark:text-amber-400 whitespace-nowrap">
                                    {change.new_value === null || change.new_value === undefined
                                      ? <span className="text-amber-400 dark:text-amber-600">Removido</span>
                                      : String(change.new_value).substring(0, 50)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {isViewLog && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-800/40 rounded-full p-2 mr-3">
                      <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300">Visualização de Dados</h5>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        Usuário {usuario_nome || `ID ${usuario_id}`} visualizou informações de {entidade_tipo || 'recurso'} 
                        {entidade_id ? ` #${entidade_id}` : ''}
                      </p>
                      {parsedDetails.request_ip && (
                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-500 flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1.5" /> IP de acesso: {parsedDetails.request_ip}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {isErrorLog && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="bg-red-100 dark:bg-red-800/40 rounded-full p-2 mr-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-red-800 dark:text-red-300">Erro Registrado</h5>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                        {parsedDetails.message || 'Ocorreu um erro durante a operação'}
                      </p>
                      {parsedDetails.status && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-500">
                          Status: {parsedDetails.status}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Detalhes JSON Brutos */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dados Completos</h5>
                  <div className="flex text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Formato JSON</span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-auto max-h-60">
                  <pre className="text-xs text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(parsedDetails, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setIsAuditDetailModalOpen(false)}
                className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm transition-colors text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar aba de segurança
  const renderSecurityTab = () => {
    return (
      <>
        {/* Cards de Estatísticas de Segurança */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Sessões Ativas */}
          <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <div className="text-gray-500 dark:text-gray-400 text-sm">Sessões Ativas</div>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Shield className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
            
            {loadingStats ? (
              <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {formatNumber(userStats.onlineUsers)}
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Usuários conectados
            </div>
          </div>
          
          {/* Última Atividade */}
          <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <div className="text-gray-500 dark:text-gray-400 text-sm">Última Atividade</div>
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <Clock className="h-4 w-4 text-green-500 dark:text-green-400" />
              </div>
            </div>
            
            {loadingStats || !auditStats.lastActivity ? (
              <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <div className="text-sm font-medium text-gray-800 dark:text-white">
                {formatDate(auditStats.lastActivity.created_at)}
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {auditStats.lastActivity ? `${auditStats.lastActivity.usuario_nome} - ${auditStats.lastActivity.acao}` : 'Sem atividades recentes'}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Dashboard com Estatísticas e Gráficos */}
      {showStats && (
        <div className="bg-white dark:bg-[#212E3C] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 dark:from-cyan-700 dark:to-cyan-600 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Dashboard de Utilizadores</h2>
              </div>
              <div className="flex items-center gap-2 mt-3 sm:mt-0">
                <button 
                  onClick={refreshAll}
                  className={`bg-white/20 hover:bg-white/30 transition-all px-2.5 py-1.5 rounded-lg text-sm flex items-center shadow-sm backdrop-blur-sm ${loadingStats ? 'opacity-75 cursor-not-allowed' : ''}`}
                  disabled={loadingStats}
                  title="Atualizar estatísticas"
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${loadingStats ? 'animate-spin' : ''}`} />
                  {loadingStats ? 'Atualizando...' : 'Atualizar'}
                </button>
                <button 
                  onClick={() => setShowStats(false)}
                  className="bg-white/20 hover:bg-white/30 transition-all px-2.5 py-1.5 rounded-lg text-sm flex items-center shadow-sm backdrop-blur-sm"
                  title="Esconder dashboard"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Esconder
                </button>
              </div>
            </div>
          </div>

          {/* Tabs do Dashboard */}
          <div className="bg-gray-50 dark:bg-[#1a2632] border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveDashboardTab('overview')}
                className={`py-3 px-4 flex items-center text-sm font-medium border-b-2 transition-colors ${
                  activeDashboardTab === 'overview'
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                Visão Geral
              </button>
              <button
                onClick={() => setActiveDashboardTab('activity')}
                className={`py-3 px-4 flex items-center text-sm font-medium border-b-2 transition-colors ${
                  activeDashboardTab === 'activity'
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Activity className="h-4 w-4 mr-2" />
                Auditoria
              </button>
              <button
                onClick={() => setActiveDashboardTab('security')}
                className={`py-3 px-4 flex items-center text-sm font-medium border-b-2 transition-colors ${
                  activeDashboardTab === 'security'
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Shield className="h-4 w-4 mr-2" />
                Segurança
              </button>
            </div>
          </div>

          {/* Conteúdo do Dashboard */}
          <div className="p-6">
            {renderDashboardContent()}
          </div>
        </div>
      )}

      {/* Card Principal da Lista */}
      <div className="bg-white dark:bg-[#212E3C] rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        {/* Cabeçalho com Stats */}
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 dark:from-cyan-700 dark:to-cyan-600 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 mr-2" />
              <span className="text-lg font-semibold">
                {formatNumber(totalUsers)} {totalUsers === 1 ? 'Utilizador' : 'Utilizadores'}
              </span>
            </div>
            <div className="flex gap-2">
              {!showStats && (
                <button 
                  onClick={() => setShowStats(true)}
                  className="bg-white/20 hover:bg-white/30 transition-all px-2.5 py-1.5 rounded-lg text-sm flex items-center shadow-sm backdrop-blur-sm"
                  title="Mostrar dashboard"
                >
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  Dashboard
                </button>
              )}
              <button 
                onClick={loadUsers}
                className={`bg-white/20 hover:bg-white/30 transition-all px-2.5 py-1.5 rounded-lg text-sm flex items-center shadow-sm backdrop-blur-sm ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                disabled={loading}
                title="Atualizar lista"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
          </div>
        </div>

        {/* Barra de pesquisa e filtros */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar por nome ou email..."
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            
            <div className="flex flex-wrap gap-2 items-center">
              <button
                className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? 'Ocultar Filtros' : 'Filtros'}
              </button>
              
              {(filters.perfil || filters.estado) && (
                <button
                  className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm"
                  onClick={resetFilters}
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpar
                </button>
              )}
              
              <button
                onClick={handleCreate}
                className="flex items-center px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-sm transition-colors text-sm ml-auto"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Utilizador
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Perfil
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                  value={filters.perfil}
                  onChange={(e) => setFilters({...filters, perfil: e.target.value})}
                >
                  <option value="">Todos</option>
                  <option value="Administrador">Administrador</option>
                  <option value="Utilizador">Utilizador</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                  value={filters.estado}
                  onChange={(e) => setFilters({...filters, estado: e.target.value})}
                >
                  <option value="">Todos</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tabela de usuários */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#1a2632]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Perfil
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#212E3C] divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 border-t-4 border-b-4 border-cyan-500 rounded-full animate-spin mb-4"></div>
                      <p className="text-sm font-medium mb-1">Carregando utilizadores...</p>
                      <p className="text-xs text-gray-400">Por favor, aguarde enquanto obtemos os dados</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4">
                    <ErrorState 
                      title={isNetworkError ? "Erro de Conexão" : "Erro ao Carregar Dados"}
                      message={error}
                      isNetworkError={isNetworkError}
                      onRetry={loadUsers}
                    />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                        <Users className="h-10 w-10 text-gray-300 dark:text-gray-500" />
                      </div>
                      <p className="text-sm font-medium mb-2">Nenhum utilizador encontrado</p>
                      <p className="text-xs text-gray-400 max-w-sm text-center">
                        Tente ajustar seus filtros ou adicione um novo utilizador para começar.
                      </p>
                      <button
                        onClick={handleCreate}
                        className="mt-4 flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow-sm transition-colors text-sm"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Criar Novo Utilizador
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2632] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.foto_perfil ? (
                            <img 
                              className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm" 
                              src={getAvatarUrl(user.foto_perfil) || undefined} 
                              alt={user.nome}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerText = user.nome.charAt(0).toUpperCase();
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-medium border border-cyan-500 shadow-sm">
                              {user.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.nome}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-300">
                        <Mail className="h-3.5 w-3.5 mr-2 opacity-70" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                        user.perfil === 'Administrador' 
                          ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      }`}>
                        {user.perfil}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                        user.estado === 'Ativo' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800'
                      }`}>
                        {user.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => handleView(user)}
                          className="p-1.5 text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className={`p-1.5 ${
                            user.perfil === 'Administrador'
                              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                              : 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          } bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors`}
                          title={user.perfil === 'Administrador' ? "Não é possível excluir administradores" : "Excluir"}
                          disabled={user.perfil === 'Administrador'} // Impedir exclusão de administradores
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginação */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-[#1a2632] border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="mb-4 sm:mb-0 text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span className="font-medium">{users.length}</span> de <span className="font-medium">{totalUsers}</span> utilizadores
            </div>
            
            <div className="flex items-center">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`relative inline-flex items-center px-3 py-2 rounded-lg mr-2 border text-sm font-medium ${
                  page === 1 
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#212E3C] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#273a4d] transition-colors'
                }`}
              >
                <ChevronLeft size={16} className="mr-1" />
                Anterior
              </button>
              
              <div className="px-3 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-sm font-medium">
                Página {page} de {totalPages}
              </div>
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={`relative inline-flex items-center px-3 py-2 rounded-lg ml-2 border text-sm font-medium ${
                  page === totalPages 
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#212E3C] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#273a4d] transition-colors'
                }`}
              >
                Próximo
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      {isCreateModalOpen && (
        <UserFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleUserSaved}
        />
      )}
      
      {isEditModalOpen && selectedUser && (
        <UserFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleUserSaved}
          user={selectedUser}
        />
      )}
      
      {isViewModalOpen && selectedUser && (
        <UserDetailsModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          user={selectedUser}
        />
      )}
      
      {isDeleteModalOpen && selectedUser && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Excluir Utilizador"
          message={`Tem certeza que deseja excluir o utilizador "${selectedUser.nome}"? Esta ação não pode ser desfeita.`}
          confirmButtonText="Excluir"
          cancelButtonText="Cancelar"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
        />
      )}
      
      {/* Modal de Detalhes do Log de Auditoria */}
      {isAuditDetailModalOpen && selectedAuditLog && <AuditLogDetailModal />}
    </div>
  );
};

export default UserManagement;
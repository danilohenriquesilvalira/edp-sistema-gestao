// frontend/src/components/plc/PLCDetails.tsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Server, 
  Edit, 
  ArrowLeft,
  Clock,
  Activity,
  Tag,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { PLC } from '../../types/plc';
import plcApi from '../../services/plcApi';
import { formatDateTime } from '../../utils/format';
import ErrorState from '../common/ErrorState';
import TagList from '../plc/TagList';  // Corrected import path
import useNats from '../../hooks/useNats';

const PLCDetails: React.FC = () => {
  const [plc, setPlc] = useState<PLC | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // NATS connection for real-time updates
  const { isConnected, connect, subscribe } = useNats();
  
  const fetchPLC = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await plcApi.getPLCById(Number(id));
      
      if (response.data.sucesso) {
        setPlc(response.data.dados);
      } else {
        throw new Error(response.data.mensagem || 'Falha ao carregar PLC');
      }
    } catch (err) {
      console.error('Erro ao carregar PLC:', err);
      setError('Não foi possível carregar os detalhes do PLC. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchPLC();
  }, [id]);
  
  // Connect to NATS when component mounts
  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);
  
  // Subscribe to PLC status updates
  useEffect(() => {
    if (!isConnected || !plc) return;
    
    const plcSubject = `plc.status.${plc.id}`;
    
    const sub = subscribe(plcSubject, (subject, message) => {
      // Update local PLC state with new status
      if (message && message.data) {
        setPlc(prevPlc => {
          if (!prevPlc) return null;
          
          return {
            ...prevPlc,
            conectado: message.data.conectado,
            ultimo_erro: message.data.ultimo_erro,
            ultima_leitura: message.data.timestamp
          };
        });
      }
    });
    
    // Cleanup subscription
    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [isConnected, plc, subscribe]);
  
  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <ErrorState 
        message={error}
        onRetry={fetchPLC}
      />
    );
  }
  
  if (!plc) {
    return (
      <ErrorState 
        title="PLC não encontrado"
        message="O PLC solicitado não foi encontrado ou não está disponível."
      />
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/plcs')}
            className="mr-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Server className="mr-3 h-7 w-7 text-cyan-500" />
            {plc.nome}
            <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              plc.conectado 
                ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100' 
                : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100'
            }`}>
              {plc.conectado ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Conectado
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Desconectado
                </>
              )}
            </span>
          </h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchPLC}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </button>
          <Link
            to={`/plcs/${plc.id}/editar`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </div>
      </div>
      
      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-cyan-500 rounded-md p-3">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Status de Conexão
                  </dt>
                  <dd>
                    <div className={`text-lg font-medium ${
                      plc.conectado 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {plc.conectado ? 'Conectado' : 'Desconectado'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <Tag className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total de Tags
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {plc.tags?.length || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Última Atualização
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {plc.ultima_leitura ? formatDateTime(plc.ultima_leitura) : 'N/A'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* PLC Details */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Detalhes do PLC</h2>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Endereço IP</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{plc.ip_address}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Rack / Slot</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{plc.rack} / {plc.slot}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gateway</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{plc.gateway || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {plc.ativo ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    Inativo
                  </span>
                )}
              </p>
            </div>
            
            {plc.ultimo_erro && (
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Último Erro</h3>
                <div className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md text-sm">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>{plc.ultimo_erro}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tags List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Tag className="mr-2 h-5 w-5 text-cyan-500" />
            Tags
          </h2>
          <Link
            to={`/plcs/${plc.id}/tags/nova`}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
          >
            Nova Tag
          </Link>
        </div>
        
        <div className="px-6 py-4">
          <TagList plcId={Number(id)} />
        </div>
      </div>
    </div>
  );
};

export default PLCDetails;
import { format, parseISO, formatDistance, isValid } from 'date-fns';
import { pt } from 'date-fns/locale';

/**
 * Formata uma data para o formato local
 * @param date - A data a ser formatada (string ISO ou objeto Date)
 * @param formatString - O formato desejado (padrão: dd/MM/yyyy)
 * @returns String formatada ou string vazia se inválida
 */
export const formatDate = (
  date: string | Date | null | undefined,
  formatString: string = 'dd/MM/yyyy'
): string => {
  if (!date) return '';
  
  try {
    // Se for string, converter para objeto Date
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, formatString, { locale: pt });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
};

/**
 * Formata uma data com hora
 * @param date - A data a ser formatada (string ISO ou objeto Date)
 * @returns String formatada ou string vazia se inválida
 */
export const formatDateTime = (
  date: string | Date | null | undefined
): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Retorna uma representação relativa da data (ex: "há 2 horas")
 * @param date - A data a ser formatada (string ISO ou objeto Date)
 * @returns String formatada ou string vazia se inválida
 */
export const timeAgo = (
  date: string | Date | null | undefined
): string => {
  if (!date) return '';
  
  try {
    // Se for string, converter para objeto Date
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return formatDistance(dateObj, new Date(), { 
      addSuffix: true,
      locale: pt
    });
  } catch (error) {
    console.error('Erro ao calcular tempo relativo:', error);
    return '';
  }
};

/**
 * Verifica se uma data já expirou
 * @param date - A data a ser verificada (string ISO ou objeto Date)
 * @returns true se expirou, false caso contrário
 */
export const isExpired = (date: string | Date | null | undefined): boolean => {
  if (!date) return true;
  
  try {
    // Se for string, converter para objeto Date
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return true;
    }
    
    return dateObj < new Date();
  } catch (error) {
    console.error('Erro ao verificar expiração:', error);
    return true;
  }
};

/**
 * Formata uma duração em segundos para formato legível
 * @param seconds - Número de segundos
 * @returns String formatada (ex: "2h 30m")
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};
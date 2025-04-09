/**
 * Formata uma data para o formato local
 * @param dateString - String da data para formatar
 * @param options - Opções de formatação
 * @returns String formatada
 */
export const formatDate = (
  dateString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-PT', options).format(date);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return dateString;
  }
};

/**
 * Formata uma data com hora para o formato local
 * @param dateString - String da data para formatar
 * @returns String formatada
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
  return formatDate(dateString, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formata um número como moeda (EUR)
 * @param value - Valor a ser formatado
 * @returns String formatada
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

/**
 * Trunca um texto com elipses se ele for maior que o tamanho especificado
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo (padrão: 50)
 * @returns Texto truncado
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return '';
  
  return text.length > maxLength
    ? `${text.substring(0, maxLength)}...`
    : text;
};

/**
 * Formata bytes para unidades legíveis (KB, MB, GB)
 * @param bytes - Número de bytes
 * @returns String formatada
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formata um número com separadores de milhares
 * @param num - Número a ser formatado
 * @param decimals - Número de casas decimais (padrão: 0)
 * @returns String formatada
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Formata um número de telefone português
 * @param phone - Número de telefone
 * @returns String formatada
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remover caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Verificar se é um formato conhecido
  if (cleaned.length === 9) {
    // Formato português: XXX XXX XXX
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  
  // Retornar como está se não reconhecer o formato
  return phone;
};

/**
 * Formata um NIF (Número de Identificação Fiscal) português
 * @param nif - NIF a ser formatado
 * @returns String formatada
 */
export const formatNIF = (nif: string): string => {
  if (!nif) return '';
  
  // Remover caracteres não numéricos
  const cleaned = nif.replace(/\D/g, '');
  
  if (cleaned.length !== 9) return nif;
  
  // Formato: XXX XXX XXX
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
};

/**
 * Converte a primeira letra de cada palavra para maiúscula
 * @param text - Texto a ser formatado
 * @returns String formatada
 */
export const toTitleCase = (text: string): string => {
  if (!text) return '';
  
  return text.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
};

/**
 * Formata um código postal português
 * @param postalCode - Código postal a ser formatado
 * @returns String formatada
 */
export const formatPostalCode = (postalCode: string): string => {
  if (!postalCode) return '';
  
  // Remover caracteres não numéricos e traços existentes
  const cleaned = postalCode.replace(/[^\d]/g, '');
  
  if (cleaned.length !== 7) return postalCode;
  
  // Formato: XXXX-XXX
  return cleaned.slice(0, 4) + '-' + cleaned.slice(4);
};

/**
 * Formata o nome completo para mostrar apenas primeiro e último nome
 * @param fullName - Nome completo
 * @returns Nome formatado
 */
export const formatShortName = (fullName: string): string => {
  if (!fullName) return '';
  
  const names = fullName.trim().split(/\s+/);
  
  if (names.length <= 1) return fullName;
  if (names.length === 2) return fullName;
  
  return `${names[0]} ${names[names.length - 1]}`;
};

/**
 * Formata um texto para URL amigável (slug)
 * @param text - Texto para formatar
 * @returns String formatada
 */
export const slugify = (text: string): string => {
  if (!text) return '';
  
  return text
    .toString()
    .normalize('NFD') // Normalizar acentos
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '') // Remover caracteres especiais
    .replace(/\s+/g, '-'); // Substituir espaços por traços
};
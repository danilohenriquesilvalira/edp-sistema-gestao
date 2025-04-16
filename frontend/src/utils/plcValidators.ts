// frontend/src/utils/plcValidators.ts

/**
 * Valida um endereço IP
 * @param ip - Endereço IP para validar
 * @returns boolean indicando se o IP é válido
 */
export const isValidIpAddress = (ip: string): boolean => {
  // Regex para validar IPv4
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

/**
 * Valida número de rack do PLC
 * @param rack - Número de rack para validar
 * @returns boolean indicando se o rack é válido
 */
export const isValidRack = (rack: number): boolean => {
  return rack >= 0 && rack <= 7;
};

/**
 * Valida número de slot do PLC
 * @param slot - Número de slot para validar
 * @returns boolean indicando se o slot é válido
 */
export const isValidSlot = (slot: number): boolean => {
  return slot >= 0 && slot <= 31;
};

/**
 * Valida número de DB
 * @param dbNumber - Número de DB para validar
 * @returns boolean indicando se o DB é válido
 */
export const isValidDBNumber = (dbNumber: number): boolean => {
  return dbNumber >= 0 && dbNumber <= 65535;
};

/**
 * Valida offset de byte
 * @param byteOffset - Offset para validar
 * @returns boolean indicando se o offset é válido
 */
export const isValidByteOffset = (byteOffset: number): boolean => {
  return byteOffset >= 0 && byteOffset <= 65535;
};

/**
 * Valida offset de bit
 * @param bitOffset - Offset para validar
 * @returns boolean indicando se o offset é válido
 */
export const isValidBitOffset = (bitOffset: number): boolean => {
  return bitOffset >= 0 && bitOffset <= 7;
};

/**
 * Valida tamanho de string para PLC
 * @param size - Tamanho para validar
 * @returns boolean indicando se o tamanho é válido
 */
export const isValidStringSize = (size: number): boolean => {
  return size >= 1 && size <= 254;
};

/**
 * Valida intervalo de atualização
 * @param interval - Intervalo em ms para validar
 * @returns boolean indicando se o intervalo é válido
 */
export const isValidUpdateInterval = (interval: number): boolean => {
  return interval >= 100; // Mínimo de 100ms
};

/**
 * Valida tipos de dados do S7
 * @param dataType - Tipo de dados para validar
 * @returns boolean indicando se o tipo é válido
 */
export const isValidS7DataType = (dataType: string): boolean => {
  const validTypes = ['Bool', 'Int', 'Word', 'Real', 'String'];
  return validTypes.includes(dataType);
};

/**
 * Verifica se o endereço de tag S7 é válido
 * @param dbNumber - Número do DB
 * @param byteOffset - Offset do byte
 * @param bitOffset - Offset do bit (opcional, para Bool)
 * @param dataType - Tipo de dados
 * @returns boolean indicando se o endereço é válido
 */
export const isValidS7TagAddress = (
  dbNumber: number,
  byteOffset: number,
  bitOffset: number | undefined,
  dataType: string
): boolean => {
  // Verificar DB
  if (!isValidDBNumber(dbNumber)) {
    return false;
  }
  
  // Verificar byte offset
  if (!isValidByteOffset(byteOffset)) {
    return false;
  }
  
  // Para tipo Bool, verificar bit offset
  if (dataType === 'Bool' && bitOffset !== undefined) {
    if (!isValidBitOffset(bitOffset)) {
      return false;
    }
  }
  
  // Verificar se o tipo é válido
  if (!isValidS7DataType(dataType)) {
    return false;
  }
  
  return true;
};

/**
 * Valida um valor antes de escrever para o PLC
 * @param value - Valor para validar
 * @param dataType - Tipo de dados do valor
 * @returns objeto com validade e valor convertido
 */
export const validateValueForWrite = (
  value: any,
  dataType: string
): { isValid: boolean; value: any; error?: string } => {
  try {
    switch (dataType) {
      case 'Bool':
        if (typeof value === 'boolean') {
          return { isValid: true, value };
        } else if (typeof value === 'string') {
          if (value.toLowerCase() === 'true' || value === '1') {
            return { isValid: true, value: true };
          } else if (value.toLowerCase() === 'false' || value === '0') {
            return { isValid: true, value: false };
          }
        } else if (typeof value === 'number') {
          return { isValid: true, value: value !== 0 };
        }
        return { isValid: false, value, error: 'Valor booleano inválido' };
        
      case 'Int':
        if (typeof value === 'number' && Number.isInteger(value)) {
          if (value >= -32768 && value <= 32767) {
            return { isValid: true, value };
          }
          return { isValid: false, value, error: 'Valor fora do intervalo para Int (-32768 a 32767)' };
        } else if (typeof value === 'string') {
          const parsedValue = parseInt(value);
          if (!isNaN(parsedValue) && parsedValue >= -32768 && parsedValue <= 32767) {
            return { isValid: true, value: parsedValue };
          }
        }
        return { isValid: false, value, error: 'Valor inteiro inválido' };
        
      case 'Word':
        if (typeof value === 'number' && Number.isInteger(value)) {
          if (value >= 0 && value <= 65535) {
            return { isValid: true, value };
          }
          return { isValid: false, value, error: 'Valor fora do intervalo para Word (0 a 65535)' };
        } else if (typeof value === 'string') {
          const parsedValue = parseInt(value);
          if (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 65535) {
            return { isValid: true, value: parsedValue };
          }
        }
        return { isValid: false, value, error: 'Valor de Word inválido' };
        
      case 'Real':
        if (typeof value === 'number') {
          return { isValid: true, value };
        } else if (typeof value === 'string') {
          const parsedValue = parseFloat(value);
          if (!isNaN(parsedValue)) {
            return { isValid: true, value: parsedValue };
          }
        }
        return { isValid: false, value, error: 'Valor de ponto flutuante inválido' };
        
      case 'String':
        if (typeof value === 'string') {
          return { isValid: true, value };
        }
        return { isValid: false, value, error: 'Valor de string inválido' };
        
      default:
        return { isValid: false, value, error: `Tipo de dados desconhecido: ${dataType}` };
    }
  } catch (error) {
    return { isValid: false, value, error: `Erro ao validar: ${error}` };
  }
};
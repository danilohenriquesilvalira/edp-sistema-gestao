/**
 * Valida um endereço de email
 * @param email - Email para validar
 * @returns boolean indicando se o email é válido
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida uma senha com requisitos mínimos
 * @param password - Senha para validar
 * @returns boolean indicando se a senha atende aos requisitos
 */
export const isStrongPassword = (password: string): boolean => {
  // Pelo menos 6 caracteres, pelo menos 1 letra e 1 número
  return password.length >= 6 && 
         /[A-Za-z]/.test(password) && 
         /[0-9]/.test(password);
};

/**
 * Valida se duas senhas são iguais
 * @param password - Senha principal
 * @param confirmPassword - Confirmação da senha
 * @returns boolean indicando se as senhas são iguais
 */
export const passwordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

/**
 * Checa erros de validação em um formulário
 * @param data - Objeto com os dados
 * @param rules - Regras de validação
 * @returns Objeto com os erros de validação
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, (value: any) => boolean | string>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const field in rules) {
    if (Object.prototype.hasOwnProperty.call(rules, field)) {
      const value = data[field];
      const validation = rules[field](value);
      
      if (typeof validation === 'string') {
        errors[field] = validation;
      } else if (validation === false) {
        errors[field] = `Campo ${field} inválido`;
      }
    }
  }

  return errors;
};

/**
 * Verifica se um objeto é vazio
 * @param obj - Objeto para verificar
 * @returns boolean indicando se o objeto é vazio
 */
export const isEmptyObject = (obj: Record<string, any>): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Valida um arquivo de imagem
 * @param file - Arquivo para validar
 * @param maxSizeInMB - Tamanho máximo em MB
 * @returns string com erro ou null se válido
 */
export const validateImageFile = (file: File, maxSizeInMB: number = 2): string | null => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  
  if (!validTypes.includes(file.type)) {
    return `O arquivo deve ser uma imagem (JPEG, PNG, GIF ou WebP)`;
  }
  
  if (file.size > maxSizeInBytes) {
    return `O arquivo não pode ser maior que ${maxSizeInMB}MB`;
  }
  
  return null;
};

/**
 * Valida se um URL é válido
 * @param url - URL para validar
 * @returns boolean indicando se o URL é válido
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Valida um número de documento (NIF português)
 * @param nif - Número a ser validado
 * @returns boolean indicando se o NIF é válido
 */
export const isValidNIF = (nif: string): boolean => {
  // Remover espaços e letras
  const cleanNIF = nif.replace(/\D/g, '');
  
  // NIF deve ter 9 dígitos
  if (cleanNIF.length !== 9) {
    return false;
  }
  
  // Verificar se é número
  if (!/^\d+$/.test(cleanNIF)) {
    return false;
  }
  
  // Algoritmo de validação NIF
  const firstDigit = parseInt(cleanNIF.charAt(0), 10);
  
  // Primeiro dígito válido: 1, 2, 5, 6, 8, 9
  if (![1, 2, 5, 6, 8, 9].includes(firstDigit)) {
    return false;
  }
  
  // Cálculo do dígito de verificação
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(cleanNIF.charAt(i), 10) * (9 - i);
  }
  
  const checkDigit = 11 - (sum % 11);
  const finalDigit = checkDigit === 10 || checkDigit === 11 ? 0 : checkDigit;
  
  return finalDigit === parseInt(cleanNIF.charAt(8), 10);
};

/**
 * Valida um código postal português
 * @param postalCode - Código postal a ser validado
 * @returns boolean indicando se o código postal é válido
 */
export const isValidPostalCode = (postalCode: string): boolean => {
  // Formato: XXXX-XXX (4 dígitos, hífen, 3 dígitos)
  const regex = /^[0-9]{4}-[0-9]{3}$/;
  return regex.test(postalCode);
};
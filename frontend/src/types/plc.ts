// frontend/src/types/plc.ts

// PLC type definition
export interface PLC {
  id: number;
  nome: string;
  ip_address: string;
  rack: number;
  slot: number;
  gateway?: string;
  ativo: boolean;
  
  // Runtime fields (not stored in DB)
  conectado?: boolean;
  ultimo_erro?: string;
  ultima_leitura?: string;
  tags?: Tag[];
}

// Tag type definition
export interface Tag {
  id: number;
  plc_id: number;
  nome: string;
  db_number: number;
  byte_offset: number;
  bit_offset?: number;
  tipo: string;
  tamanho: number;
  subsistema?: string;
  descricao?: string;
  ativo: boolean;
  update_interval_ms: number;
  only_on_change: boolean;
  
  // Runtime fields
  ultimo_valor?: any;
  ultima_leitura?: string;
  ultimo_erro_time?: string;
  ultimo_erro?: string;
}

// Fault definition type
export interface FaultDefinition {
  id: number;
  plc_id: number;
  word_name: string;
  db_number: number;
  byte_offset: number;
  bit_offset: number;
  eclusa: string;
  subsistema: string;
  descricao: string;
  tipo: string; // 'Alarme' ou 'Evento'
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Fault status type
export interface FaultStatus {
  fault_id: number;
  ativo: boolean;
  inicio_timestamp?: string;
  reconhecido: boolean;
  reconhecido_por?: number;
  reconhecido_em?: string;
}

// Fault history type
export interface FaultHistory {
  id: number;
  fault_id: number;
  inicio_timestamp: string;
  fim_timestamp: string;
  duracao_segundos: number;
  reconhecido: boolean;
  reconhecido_por?: number;
  reconhecido_em?: string;
  notas?: string;
  created_at: string;
}

// Fault event (used for sending to frontend)
export interface FaultEvent {
  id: number;
  plc_id: number;
  plc_nome: string;
  word_name: string;
  bit_offset: number;
  eclusa: string;
  subsistema: string;
  descricao: string;
  tipo: string;
  ativo: boolean;
  inicio_timestamp: string;
  reconhecido: boolean;
}
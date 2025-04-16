// frontend/src/hooks/useNats.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import plcApi from '../services/plcApi';

// Mock types for nats.ws if not installed
interface NatsConnection {
  publish: (subject: string, data: Uint8Array) => void;
  subscribe: (subject: string) => Subscription;
  close: () => void;
}

interface Subscription {
  unsubscribe: () => void;
  getSubject: () => string;
  getReceived: () => number;
  [Symbol.asyncIterator](): AsyncIterator<any>;
}

// Structure to hold NATS subjects information
interface NatsSubjects {
  plc_status: string;
  tag_updates: string;
  plc_updates: string;
  tag_write: string;
  fault_updates?: string;
  fault_ack?: string;
}

// Type for NATS message callbacks
type MessageCallback = (subject: string, data: any) => void;

// Simple string codec for encoding/decoding messages
const stringCodec = {
  encode: (data: string): Uint8Array => {
    return new TextEncoder().encode(data);
  },
  decode: (data: Uint8Array): string => {
    return new TextDecoder().decode(data);
  }
};

export const useNats = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [subjects, setSubjects] = useState<NatsSubjects | null>(null);
  const natsRef = useRef<NatsConnection | null>(null);
  const subscriptionsRef = useRef<Subscription[]>([]);
  
  // Connect to NATS server
  const connect = useCallback(async () => {
    try {
      // Get NATS server info
      const response = await plcApi.getNatsInfo();
      const { url, subjects: serverSubjects } = response.data;
      
      if (!url) {
        throw new Error('NATS URL não disponível');
      }
      
      setSubjects(serverSubjects);
      
      // Mock connection for now until nats.ws is installed
      // In a real implementation, this would be:
      // const nc = await natsWs.connect(url);
      const mockNats: NatsConnection = {
        publish: (subject: string, data: Uint8Array) => {
          console.log(`Publishing to ${subject}:`, new TextDecoder().decode(data));
        },
        subscribe: (subject: string) => {
          console.log(`Subscribing to ${subject}`);
          const mockSub: Subscription = {
            unsubscribe: () => console.log(`Unsubscribing from ${subject}`),
            getSubject: () => subject,
            getReceived: () => 0,
            [Symbol.asyncIterator]: function() {
              return {
                next: async () => ({ done: true, value: undefined })
              };
            }
          };
          return mockSub;
        },
        close: () => {
          console.log('Closing NATS connection');
        }
      };
      
      natsRef.current = mockNats;
      
      setIsConnected(true);
      toast.success('Conectado ao servidor de dados em tempo real');
      
      return true;
    } catch (error) {
      console.error('Erro ao conectar com servidor NATS:', error);
      toast.error('Falha ao conectar com servidor de dados em tempo real');
      setIsConnected(false);
      return false;
    }
  }, []);
  
  // Subscribe to a subject
  const subscribe = useCallback((subject: string, callback: MessageCallback) => {
    if (!natsRef.current || !isConnected) {
      console.error('NATS não está conectado');
      return null;
    }
    
    try {
      const sub = natsRef.current.subscribe(subject);
      
      // Process incoming messages - in a real implementation with nats.ws
      // this would iterate through messages using for await
      // For now, we'll just simulate it
      // In a real implementation, this would be:
      /* 
      (async () => {
        for await (const msg of sub) {
          try {
            const data = JSON.parse(stringCodec.decode(msg.data));
            callback(msg.subject, data);
          } catch (error) {
            console.error('Erro ao processar mensagem NATS:', error);
          }
        }
      })();
      */
      
      // Add subscription to the list
      subscriptionsRef.current.push(sub);
      
      return sub;
    } catch (error) {
      console.error(`Erro ao assinar tópico ${subject}:`, error);
      return null;
    }
  }, [isConnected]);
  
  // Publish a message to a subject
  const publish = useCallback((subject: string, data: any) => {
    if (!natsRef.current || !isConnected) {
      console.error('NATS não está conectado');
      return false;
    }
    
    try {
      const jsonData = JSON.stringify(data);
      natsRef.current.publish(subject, stringCodec.encode(jsonData));
      return true;
    } catch (error) {
      console.error(`Erro ao publicar em ${subject}:`, error);
      return false;
    }
  }, [isConnected]);
  
  // Disconnect from NATS server
  const disconnect = useCallback(() => {
    if (!natsRef.current) return;
    
    // Unsubscribe from all subscriptions
    subscriptionsRef.current.forEach(sub => {
      try {
        sub.unsubscribe();
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Clear subscriptions
    subscriptionsRef.current = [];
    
    // Disconnect from NATS
    try {
      natsRef.current.close();
      natsRef.current = null;
      setIsConnected(false);
    } catch (error) {
      console.error('Erro ao desconectar do NATS:', error);
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  return {
    isConnected,
    subjects,
    connect,
    disconnect,
    subscribe,
    publish
  };
};

export default useNats;
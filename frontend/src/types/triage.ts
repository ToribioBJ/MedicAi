export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  metadata?: {
    nivel?: 'EMERGENCIA' | 'URGENCIA' | 'ESTABLE';
    accion?: string;
    especialidad?: string;
    sintomas?: string[];
  };
}

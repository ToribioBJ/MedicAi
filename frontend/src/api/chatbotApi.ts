import { api } from './client';

export interface Mensaje {
  role: 'user' | 'assistant';
  contenido: string;
  id?: number;
  fecha_envio?: string;
}

export interface Conversacion {
  id: number;
  titulo: string;
  paciente_id?: number;
  fecha_creacion: string;
}

export interface ChatResponse {
  respuesta: string;
  conversacion_id: number;
  paciente_id?: number;
}

export const enviarMensajeChat = (mensaje: string, conversacionId?: number, pacienteId?: number) =>
  api.post<ChatResponse>('/chatbot/mensaje', { mensaje, conversacion_id: conversacionId, paciente_id: pacienteId });

export const listarConversaciones = (pacienteId?: number) =>
  api.get<Conversacion[]>('/chatbot/conversaciones', { params: { paciente_id: pacienteId } });

export const obtenerDetalleChat = (convId: number) =>
  api.get<Conversacion & { mensajes: Mensaje[] }>(`/chatbot/conversaciones/${convId}`);

export const eliminarConversacion = (convId: number) =>
  api.delete(`/chatbot/conversaciones/${convId}`);

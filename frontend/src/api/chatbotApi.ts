import { api } from './client';

export interface Mensaje {
  role: 'user' | 'assistant';
  contenido: string;
  id?: number;
  fecha_envio?: string;
  imagen?: string;
}

export interface Conversacion {
  id: number;
  titulo: string;
  usuario_id?: number;
  fecha_creacion: string;
}

export interface ChatResponse {
  respuesta: string;
  conversacion_id: number;
  usuario_id?: number;
}

export const enviarMensajeChat = (mensaje: string, conversacionId?: number, usuarioId?: number, imagen?: string) =>
  api.post<ChatResponse>('/chatbot/mensaje', { 
    mensaje, 
    conversacion_id: conversacionId, 
    usuario_id: usuarioId,
    imagen 
  });

export const listarConversaciones = (usuarioId?: number) =>
  api.get<Conversacion[]>('/chatbot/conversaciones', { params: { usuario_id: usuarioId } });

export const obtenerDetalleChat = (convId: number) =>
  api.get<Conversacion & { mensajes: Mensaje[] }>(`/chatbot/conversaciones/${convId}`);

export const eliminarConversacion = (convId: number) =>
  api.delete(`/chatbot/conversaciones/${convId}`);

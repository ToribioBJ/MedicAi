import { api } from './client';

export interface Cita {
  id: number;
  usuario_id: number;
  fecha_hora: string;  // ISO
  duracion_min: number;
  motivo?: string | null;
  notas?: string | null;
  estado: 'pendiente' | 'confirmada' | 'atendida' | 'cancelada' | 'no_asistio';
  creada_en: string;
}

export interface CitaCreate {
  usuario_id: number;
  fecha_hora: string;
  duracion_min?: number;
  motivo?: string;
  notas?: string;
}

export type CitaUpdate = Partial<Omit<Cita, 'id' | 'creada_en' | 'usuario_id'>>;

export const listarCitas = (params?: {
  usuario_id?: number;
  estado?: string;
  desde?: string;
  hasta?: string;
}) => api.get<Cita[]>('/citas/', { params });

export const crearCita = (data: CitaCreate) => api.post<Cita>('/citas/', data);

export const actualizarCita = (id: number, data: CitaUpdate) =>
  api.put<Cita>(`/citas/${id}`, data);

export const eliminarCita = (id: number) => api.delete(`/citas/${id}`);

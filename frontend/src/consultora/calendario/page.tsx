import { useEffect, useState } from 'react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, isSameMonth, isSameDay,
  eachDayOfInterval, parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

import { listarCitas, eliminarCita, type Cita } from '../../api/citasApi';

const estadoColor: Record<string, string> = {
  pendiente:   'bg-amber-100 text-amber-700',
  confirmada:  'bg-emerald-100 text-emerald-700',
  atendida:    'bg-blue-100 text-blue-700',
  cancelada:   'bg-rose-100 text-rose-700',
  no_asistio:  'bg-slate-200 text-slate-600 dark:text-white/70',
};

const CalendarioPage = () => {
  const { isDark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [citas, setCitas] = useState<Cita[]>([]);
  const [error, setError] = useState('');

  const cargar = async () => {
    try {
      const { data } = await listarCitas();
      setCitas(data);
    } catch { 
      setError('No se pudieron cargar las citas. Asegúrate de que el servidor esté activo.'); 
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const borrar = async (id: number) => {
    if (!confirm('¿Eliminar esta cita?')) return;
    try {
      await eliminarCita(id);
      await cargar();
    } catch {
      setError('No se pudo eliminar la cita.');
    }
  };

  const citasDelDia = citas.filter(c => isSameDay(parseISO(c.fecha_hora), selectedDate));
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });

  return (
    <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500">
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendario */}
        <div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/10 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition"><ChevronLeft size={20} /></button>
              <button onClick={() => setCurrentMonth(new Date())} className="px-5 text-sm font-bold bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition">Hoy</button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-4 text-center text-[11px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {days.map((day, idx) => {
              const tiene = citas.some(c => isSameDay(parseISO(c.fecha_hora), day));
              const sel = isSameDay(day, selectedDate);
              const mismoMes = isSameMonth(day, monthStart);
              const today = isSameDay(day, new Date());
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square p-2 rounded-2xl flex flex-col items-center justify-center text-center transition-all relative
                    ${!mismoMes ? 'opacity-20' : 'opacity-100'}
                    ${sel ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' :
                      today ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  <span className="text-base font-bold">{format(day, 'd')}</span>
                  {tiene && !sel && (
                    <span className="absolute bottom-3 w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel lateral: citas del día */}
        <div className="bg-white dark:bg-white/5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/10 p-8 flex flex-col">
          <div className="mb-6">
            <div className="text-[11px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1">Citas del día</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white capitalize">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
            {citasDelDia.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-slate-400 dark:text-white/20 text-sm italic">No hay consultas programadas para este día.</p>
              </div>
            ) : citasDelDia.map(c => (
              <div key={c.id} className="p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:border-blue-500/30 transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${estadoColor[c.estado]}`}>
                        {c.estado}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-white/30 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg">
                        <Clock size={12} />
                        {format(parseISO(c.fecha_hora), 'HH:mm')}
                      </div>
                    </div>
                    <div className="font-bold text-base text-slate-900 dark:text-white truncate">
                       Cita #{c.id}
                    </div>
                    {c.motivo && (
                      <p className="text-sm text-slate-500 dark:text-white/50 mt-1 line-clamp-2 italic">
                        "{c.motivo}"
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => borrar(c.id)} 
                    className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
            <p className="text-[11px] text-slate-400 dark:text-white/30 leading-relaxed">
              Las nuevas citas se agendan automáticamente a través del **Asistente AI**. 
              Aquí puedes visualizar y gestionar tu disponibilidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarioPage;

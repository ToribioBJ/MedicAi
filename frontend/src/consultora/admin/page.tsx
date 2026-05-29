import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Users, UserCheck, ShieldAlert, UserX, Search,
  RotateCw, ShieldCheck, Mail, Calendar, Settings2, Loader2, AlertCircle, CheckCircle2,
  Database, Cpu, Activity, X, MessageSquare
} from 'lucide-react';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  role: string;
  email_verified: boolean;
  fecha_registro: string;
  cant_conversaciones: number;
  telegram_chat_id?: string | null;
}

export const AdminDashboardPage = () => {
  const { token, user: currentAdmin } = useAuth();
  const { isDark } = useTheme();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<'web' | 'telegram'>('web');
  const [telegramUsers, setTelegramUsers] = useState<any[]>([]);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgSearchTerm, setTgSearchTerm] = useState('');
  const [hoveredSegment, setHoveredSegment] = useState<'web' | 'tg_linked' | 'tg_guest' | null>(null);


  // Selected User for Sidebar details
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  // Alertas
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Health Status
  const [healthStatus, setHealthStatus] = useState<{
    database: { status: 'connected' | 'disconnected' | 'error'; details: string; latency_ms: number };
    groq: { status: 'connected' | 'disconnected' | 'error'; details: string; latency_ms: number };
    telegram: { status: 'connected' | 'disconnected' | 'error'; details: string; latency_ms: number };
  } | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const fetchHealthStatus = async () => {
    setHealthLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/usuarios/health-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHealthStatus(data);
      }
    } catch (err) {
      console.error("Error fetching health status:", err);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('http://localhost:8000/api/usuarios/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de usuarios. Asegúrate de tener permisos.');
      }
      const data = await response.json();
      setUsuarios(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchTelegramUsers = async () => {
    setTgLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/usuarios/telegram', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTelegramUsers(data);
      }
    } catch (err) {
      console.error("Error fetching telegram users:", err);
    } finally {
      setTgLoading(false);
    }
  };

  const handleUnlinkTelegramAdmin = async (userId: number) => {
    setActionLoading(userId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await fetch(`http://localhost:8000/api/usuarios/${userId}/unlink-telegram`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setSuccessMsg("Usuario de Telegram desvinculado con éxito.");
        fetchTelegramUsers();
        fetchUsuarios();
      } else {
        throw new Error("No se pudo desvincular al usuario.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al desvincular");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchHealthStatus();
    fetchTelegramUsers();
  }, []);

  const handleToggleEstado = async (userId: number, currentActivo: boolean) => {
    if (userId === currentAdmin?.id) {
      setErrorMsg('No puedes desactivar tu propia cuenta de administrador.');
      return;
    }

    setActionLoading(userId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`http://localhost:8000/api/usuarios/${userId}/status?activo=${!currentActivo}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cambiar el estado del usuario');
      }

      const updatedActivo = !currentActivo;
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, activo: updatedActivo } : u));
      
      // Update sidebar if open on the same user
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, activo: updatedActivo } : null);
      }
      
      setSuccessMsg(`Estado del usuario actualizado a ${updatedActivo ? 'Activo' : 'Inactivo'}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar el estado');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCambiarRol = async (userId: number, nuevoRol: string) => {
    setActionLoading(userId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`http://localhost:8000/api/usuarios/${userId}/role?nuevo_rol=${nuevoRol}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cambiar el rol del usuario');
      }

      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, role: nuevoRol } : u));

      // Update sidebar if open on the same user
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, role: nuevoRol } : null);
      }

      setSuccessMsg(`Rol del usuario actualizado a ${nuevoRol.toUpperCase()}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cambiar el rol');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrado
  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const telegramUsersFiltrados = telegramUsers.filter(tg => {
    const term = tgSearchTerm.toLowerCase();
    return (
      (tg.first_name && tg.first_name.toLowerCase().includes(term)) ||
      (tg.last_name && tg.last_name.toLowerCase().includes(term)) ||
      (tg.username && tg.username.toLowerCase().includes(term)) ||
      tg.telegram_chat_id.includes(term) ||
      (tg.linked && tg.web_user && (
        tg.web_user.nombre.toLowerCase().includes(term) ||
        tg.web_user.email.toLowerCase().includes(term)
      ))
    );
  });

  // Estadísticas
  const stats = {
    total: usuarios.length,
    verificados: usuarios.filter(u => u.email_verified).length,
    administradores: usuarios.filter(u => u.role === 'administrador').length,
    inactivos: usuarios.filter(u => !u.activo).length
  };

  const verifiedPercentage = stats.total > 0 ? Math.round((stats.verificados / stats.total) * 100) : 0;
  const adminPercentage = stats.total > 0 ? Math.round((stats.administradores / stats.total) * 100) : 0;
  const inactivePercentage = stats.total > 0 ? Math.round((stats.inactivos / stats.total) * 100) : 0;
  const totalConversaciones = usuarios.reduce((acc, u) => acc + (u.cant_conversaciones || 0), 0);



  return (
    <div className={`p-6 sm:p-10 max-w-7xl mx-auto space-y-8 font-sans transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>

      {/* Action Header Row */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Panel Administrativo</h1>
          <p className="text-xs text-slate-400 mt-1">Supervisa usuarios, roles y la salud operativa del sistema.</p>
        </div>
        <button
          onClick={() => {
            fetchUsuarios();
            fetchHealthStatus();
            fetchTelegramUsers();
          }}
          disabled={loading || healthLoading || tgLoading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 transition shadow-sm font-bold disabled:opacity-50 cursor-pointer ${isDark
            ? 'bg-white/5 border-white/10 text-slate-200 hover:border-[var(--color-accent)] hover:text-white'
            : 'bg-white border-slate-200 text-slate-700 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
            }`}
        >
          <RotateCw size={16} className={loading || healthLoading ? 'animate-spin' : ''} />
          Actualizar Datos
        </button>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 border ${isDark
          ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400'
          : 'bg-emerald-50 border-emerald-100 text-emerald-700'
          }`}>
          <CheckCircle2 size={20} className="shrink-0" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 border ${isDark
          ? 'bg-rose-950/20 border-rose-900/50 text-rose-400'
          : 'bg-rose-50 border-rose-100 text-rose-600'
          }`}>
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}



      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Total Usuarios */}
        <div className={`p-6 rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'
          }`}>
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}>
              <Users size={24} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Usuarios</div>
              <div className={`text-2xl font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.total}</div>
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ backgroundColor: 'var(--color-accent)', width: '100%' }}></div>
          </div>
        </div>

        {/* Verificados */}
        <div className={`p-6 rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'
          }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <UserCheck size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verificados</div>
              <div className={`text-2xl font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.verificados}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1 uppercase">
              <span>Progreso</span>
              <span>{verifiedPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${verifiedPercentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Administradores */}
        <div className={`p-6 rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'
          }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Administradores</div>
              <div className={`text-2xl font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.administradores}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1 uppercase">
              <span>Ratio Admins</span>
              <span>{adminPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${adminPercentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Inactivos */}
        <div className={`p-6 rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'
          }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
              <UserX size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inactivos</div>
              <div className={`text-2xl font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.inactivos}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1 uppercase">
              <span>Bloqueados</span>
              <span>{inactivePercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${inactivePercentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Total Conversaciones */}
        <div className={`p-6 rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'
          }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <MessageSquare size={24} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversaciones</div>
              <div className={`text-2xl font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>{totalConversaciones}</div>
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-blue-500" style={{ width: '100%' }}></div>
          </div>
        </div>

      </div>

      {/* Sección de Gráficos Estadísticos */}
      {!loading && !tgLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Tarjeta 1: Donut de Distribución de Cuentas */}
          <div className={`p-6 rounded-[2.5rem] border shadow-[0_12px_30px_rgba(0,0,0,0.015)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'
          }`}>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Distribución por Canales</h3>
              <p className="text-xs text-slate-400 mt-1">Proporción de usuarios registrados según el canal de interacción.</p>
            </div>

            {(() => {
              const webOnlyCount = usuarios.filter(u => !u.email.endsWith('@telegram.medicai')).length;
              const tgLinkedCount = telegramUsers.filter(tg => tg.linked).length;
              const tgGuestCount = telegramUsers.filter(tg => !tg.linked).length;
              const total = webOnlyCount + tgLinkedCount + tgGuestCount;

              const webPercent = total > 0 ? Math.round((webOnlyCount / total) * 100) : 0;
              const linkedPercent = total > 0 ? Math.round((tgLinkedCount / total) * 100) : 0;
              const guestPercent = total > 0 ? Math.round((tgGuestCount / total) * 100) : 0;

              // Parámetros de los arcos del Donut SVG
              // C = 2 * pi * r = 2 * 3.14159 * 50 = 314.16
              const r = 50;
              const circ = 2 * Math.PI * r;

              const webStroke = (webOnlyCount / (total || 1)) * circ;
              const linkedStroke = (tgLinkedCount / (total || 1)) * circ;
              const guestStroke = (tgGuestCount / (total || 1)) * circ;

              const offset1 = 0;

              return (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-6">
                  {/* SVG Donut */}
                  <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      {total === 0 ? (
                        <circle cx="60" cy="60" r={r} fill="transparent" stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth="14" />
                      ) : (
                        <>
                          {/* Segmento 1: Web Only */}
                          {webOnlyCount > 0 && (
                            <circle
                              cx="60"
                              cy="60"
                              r={r}
                              fill="transparent"
                              stroke="var(--color-accent)"
                              strokeWidth={hoveredSegment === 'web' ? '18' : '14'}
                              strokeDasharray={`${webStroke} ${circ - webStroke}`}
                              strokeDashoffset={offset1}
                              onMouseEnter={() => setHoveredSegment('web')}
                              onMouseLeave={() => setHoveredSegment(null)}
                              className="transition-all duration-300 cursor-pointer animate-draw"
                            />
                          )}
                          {/* Segmento 2: Telegram Vinculado */}
                          {tgLinkedCount > 0 && (
                            <circle
                              cx="60"
                              cy="60"
                              r={r}
                              fill="transparent"
                              stroke="#6366f1"
                              strokeWidth={hoveredSegment === 'tg_linked' ? '18' : '14'}
                              strokeDasharray={`${linkedStroke} ${circ - linkedStroke}`}
                              strokeDashoffset={-webStroke}
                              onMouseEnter={() => setHoveredSegment('tg_linked')}
                              onMouseLeave={() => setHoveredSegment(null)}
                              className="transition-all duration-300 cursor-pointer"
                            />
                          )}
                          {/* Segmento 3: Telegram Invitado */}
                          {tgGuestCount > 0 && (
                            <circle
                              cx="60"
                              cy="60"
                              r={r}
                              fill="transparent"
                              stroke="#06b6d4"
                              strokeWidth={hoveredSegment === 'tg_guest' ? '18' : '14'}
                              strokeDasharray={`${guestStroke} ${circ - guestStroke}`}
                              strokeDashoffset={-(webStroke + linkedStroke)}
                              onMouseEnter={() => setHoveredSegment('tg_guest')}
                              onMouseLeave={() => setHoveredSegment(null)}
                              className="transition-all duration-300 cursor-pointer"
                            />
                          )}
                        </>
                      )}
                    </svg>
                    
                    {/* Etiqueta Central */}
                    <div className="absolute flex flex-col items-center justify-center leading-none text-center pointer-events-none">
                      {hoveredSegment === 'web' && (
                        <>
                          <span className="text-[10px] font-black uppercase text-slate-400">Web</span>
                          <span className="text-xl font-black mt-1 text-[var(--color-accent)]">{webPercent}%</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5">{webOnlyCount} {webOnlyCount === 1 ? 'usuario' : 'usuarios'}</span>
                        </>
                      )}
                      {hoveredSegment === 'tg_linked' && (
                        <>
                          <span className="text-[10px] font-black uppercase text-slate-400">Vinculados</span>
                          <span className="text-xl font-black mt-1 text-indigo-500">{linkedPercent}%</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5">{tgLinkedCount} {tgLinkedCount === 1 ? 'usuario' : 'usuarios'}</span>
                        </>
                      )}
                      {hoveredSegment === 'tg_guest' && (
                        <>
                          <span className="text-[10px] font-black uppercase text-slate-400">Invitados</span>
                          <span className="text-xl font-black mt-1 text-cyan-500">{guestPercent}%</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5">{tgGuestCount} {tgGuestCount === 1 ? 'chat' : 'chats'}</span>
                        </>
                      )}
                      {!hoveredSegment && (
                        <>
                          <span className="text-[10px] font-black uppercase text-slate-400">Total</span>
                          <span className={`text-2xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>{total}</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5">Registros</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Leyenda Lateral Interactiva */}
                  <div className="flex-1 space-y-3.5 w-full">
                    {/* Web Only */}
                    <div 
                      onMouseEnter={() => setHoveredSegment('web')}
                      onMouseLeave={() => setHoveredSegment(null)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 ${
                        hoveredSegment === 'web'
                          ? 'bg-[var(--color-accent)]/5 border-[var(--color-accent)]/20 shadow-sm'
                          : 'bg-transparent border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full bg-[var(--color-accent)] shrink-0"></span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Acceso Web Exclusivo</span>
                          <span className="text-[10px] text-slate-400">Registrados por la plataforma web</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{webOnlyCount}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">{webPercent}%</span>
                      </div>
                    </div>

                    {/* Telegram Vinculado */}
                    <div 
                      onMouseEnter={() => setHoveredSegment('tg_linked')}
                      onMouseLeave={() => setHoveredSegment(null)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 ${
                        hoveredSegment === 'tg_linked'
                          ? 'bg-indigo-500/5 border-indigo-500/20 shadow-sm'
                          : 'bg-transparent border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full bg-indigo-500 shrink-0"></span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Telegram Vinculados</span>
                          <span className="text-[10px] text-slate-400">Chats asociados a una cuenta web</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{tgLinkedCount}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">{linkedPercent}%</span>
                      </div>
                    </div>

                    {/* Telegram Invitado */}
                    <div 
                      onMouseEnter={() => setHoveredSegment('tg_guest')}
                      onMouseLeave={() => setHoveredSegment(null)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 ${
                        hoveredSegment === 'tg_guest'
                          ? 'bg-cyan-500/5 border-cyan-500/20 shadow-sm'
                          : 'bg-transparent border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full bg-cyan-500 shrink-0"></span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Telegram Invitados</span>
                          <span className="text-[10px] text-slate-400">Interacción directa sin cuenta web</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{tgGuestCount}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">{guestPercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Tarjeta 2: Gráfico de Barras de Salud de Cuentas */}
          <div className={`p-6 rounded-[2.5rem] border shadow-[0_12px_30px_rgba(0,0,0,0.015)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'
          }`}>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Estado de Cuentas</h3>
              <p className="text-xs text-slate-400 mt-1">Comparativa de salud de las cuentas de usuario y telemetría de accesos.</p>
            </div>

            {(() => {
              const total = usuarios.length;
              const activosCount = usuarios.filter(u => u.activo).length;
              const verificadosCount = usuarios.filter(u => u.email_verified).length;
              const adminsCount = usuarios.filter(u => u.role === 'administrador').length;
              const telegramTotal = telegramUsers.length;

              const activePct = total > 0 ? Math.round((activosCount / total) * 100) : 0;
              const verifiedPct = total > 0 ? Math.round((verificadosCount / total) * 100) : 0;
              const adminPct = total > 0 ? Math.round((adminsCount / total) * 100) : 0;
              
              // El porcentaje de telegram es en base a los usuarios web registrados para comparar volumen
              const tgPct = total > 0 ? Math.min(Math.round((telegramTotal / total) * 100), 100) : 0;

              return (
                <div className="space-y-4 mt-6">
                  {/* Fila 1: Activos */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Cuentas Activas</span>
                      <span className="text-slate-400 font-extrabold">{activosCount} / {total} ({activePct}%)</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-slate-200/40 dark:border-white/5">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-out origin-left"
                        style={{ width: `${activePct}%` }}
                      />
                    </div>
                  </div>

                  {/* Fila 2: Verificados */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Correos Verificados</span>
                      <span className="text-slate-400 font-extrabold">{verificadosCount} / {total} ({verifiedPct}%)</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-slate-200/40 dark:border-white/5">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all duration-1000 ease-out origin-left"
                        style={{ width: `${verifiedPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Fila 3: Administradores */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Administradores</span>
                      <span className="text-slate-400 font-extrabold">{adminsCount} / {total} ({adminPct}%)</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-slate-200/40 dark:border-white/5">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-1000 ease-out origin-left"
                        style={{ width: `${adminPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Fila 4: Telegram */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Volumen en Telegram</span>
                      <span className="text-slate-400 font-extrabold">{telegramTotal} chats registrados</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-slate-200/40 dark:border-white/5">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-1000 ease-out origin-left"
                        style={{ width: `${tgPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      )}

      {/* Selector de Pestañas */}
      <div className="flex gap-4 border-b border-slate-100 dark:border-white/5 pb-2">
        <button
          onClick={() => { setActiveTab('web'); setSelectedUser(null); }}
          className={`pb-3 px-4 text-sm font-extrabold transition-all relative ${
            activeTab === 'web'
              ? 'text-[var(--color-accent)] font-extrabold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <span>Usuarios del Sistema (Web)</span>
          {activeTab === 'web' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)] rounded-full animate-in fade-in duration-300" />
          )}
        </button>
        <button
          onClick={() => { setActiveTab('telegram'); setSelectedUser(null); }}
          className={`pb-3 px-4 text-sm font-extrabold transition-all relative flex items-center gap-2 ${
            activeTab === 'telegram'
              ? 'text-[var(--color-accent)] font-extrabold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <span>Usuarios de Telegram</span>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
            activeTab === 'telegram'
              ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
              : 'bg-slate-100 dark:bg-white/5 text-slate-400'
          }`}>
            {telegramUsers.length}
          </span>
          {activeTab === 'telegram' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)] rounded-full animate-in fade-in duration-300" />
          )}
        </button>
      </div>

      {/* Main Card with Table */}
      <div className={`rounded-[2rem] border shadow-[0_15px_40px_rgba(0,0,0,0.015)] overflow-hidden transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'
        }`}>

        {activeTab === 'web' ? (
          <>
            {/* Table Search Header */}
            <div className={`p-6 border-b flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-slate-100'
              }`}>
          <div>
            <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Listado Clínico de Usuarios</h2>
            <p className="text-xs text-slate-400 mt-1">Selecciona una fila para ver el historial y controles detallados.</p>
          </div>

          <div className="relative w-full sm:w-[320px] flex items-center group">
            <Search className="absolute left-4 text-slate-400 group-hover:text-[var(--color-accent)] transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full placeholder-slate-400 pl-11 pr-5 py-3 rounded-2xl text-[14px] outline-none border-2 transition shadow-sm font-medium ${isDark
                ? 'bg-white/5 text-white border-white/10 focus:border-[var(--color-accent)] focus:bg-[#0E1320]'
                : 'bg-slate-50 text-slate-900 border-slate-100 focus:border-[var(--color-accent)] focus:bg-white'
                }`}
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--color-accent)' }} />
            <span className="text-slate-400 font-bold">Cargando base de datos de usuarios...</span>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20 space-y-2">
            <ShieldAlert size={48} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
            <span className="text-slate-400 font-bold">No se encontraron usuarios en el sistema.</span>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-slate-400 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/50 border-slate-100'
                  }`}>
                  <th className="py-4 px-6">Usuario</th>
                  <th className="py-4 px-6">Rol</th>
                  <th className="py-4 px-6 text-center">Verificación</th>
                  <th className="py-4 px-6 text-center">Telegram</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                  <th className="py-4 px-6">Fecha Registro</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors duration-300 ${isDark ? 'divide-white/10' : 'divide-slate-100'}`}>
                {usuariosFiltrados.map((u) => {
                  const isCurrentAdmin = u.id === currentAdmin?.id;
                  const isSelected = selectedUser?.id === u.id;

                  return (
                    <tr 
                      key={u.id} 
                      onClick={() => setSelectedUser(u)}
                      className={`transition-all font-medium cursor-pointer ${
                        isSelected 
                          ? 'bg-[var(--color-accent)]/10 dark:bg-[var(--color-accent)]/15 border-l-4 border-l-[var(--color-accent)]' 
                          : isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/30'
                      }`}
                    >

                      {/* Usuario info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0`}
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                              color: 'var(--color-accent)'
                            }}
                          >
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {u.nombre}
                              {isCurrentAdmin && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                  Tú
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail size={12} /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-4 px-6">
                        <div className="relative inline-block w-40" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={u.role}
                            onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                            disabled={actionLoading === u.id || isCurrentAdmin}
                            className={`w-full px-3 py-2 rounded-xl text-xs outline-none font-bold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border ${isDark
                              ? 'bg-[#0E1320] border-white/10 text-white focus:border-[var(--color-accent)] hover:border-white/20'
                              : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-[var(--color-accent)] hover:border-slate-300'
                              }`}
                          >
                            <option value="usuario">Usuario normal</option>
                            <option value="administrador">Administrador</option>
                          </select>
                        </div>
                      </td>

                      {/* Verificación de correo */}
                      <td className="py-4 px-6 text-center">
                        {u.email_verified ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${isDark ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
                            }`}>
                            <ShieldCheck size={12} /> Verificado
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${isDark ? 'bg-amber-950/20 border-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700 border-amber-100/50'
                            }`}>
                            <AlertCircle size={12} /> Pendiente
                          </span>
                        )}
                      </td>

                      {/* Telegram status */}
                      <td className="py-4 px-6 text-center">
                        {u.telegram_chat_id ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${isDark ? 'bg-blue-950/20 border-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700 border-blue-100/50'
                            }`}>
                            Conectado
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${isDark ? 'bg-slate-950/20 border-slate-900/30 text-slate-400' : 'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>
                            No conectado
                          </span>
                        )}
                      </td>

                      {/* Estado Activo */}
                      <td className="py-4 px-6 text-center">
                        {u.activo ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${isDark ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>Activo</span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${isDark ? 'bg-rose-950/20 border-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>Inactivo</span>
                        )}
                      </td>

                      {/* Fecha de Registro */}
                      <td className={`py-4 px-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(u.fecha_registro).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleEstado(u.id, u.activo);
                          }}
                          disabled={actionLoading === u.id || isCurrentAdmin}
                          className={`flex items-center gap-1.5 mx-auto font-bold text-xs py-2 px-4 rounded-xl border transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${u.activo
                            ? isDark
                              ? 'bg-rose-950/20 text-rose-400 border-rose-900/50 hover:bg-rose-900/30 hover:border-rose-800'
                              : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100/50 hover:border-rose-200'
                            : isDark
                              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/30 hover:border-emerald-800'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50 hover:border-emerald-200'
                            }`}
                        >
                          {actionLoading === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : u.activo ? (
                            <>
                              <UserX size={14} /> Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} /> Activar
                            </>
                          )}
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
          </>
        ) : (
          <>
            {/* Table Search Header for Telegram */}
            <div className={`p-6 border-b flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
              <div>
                <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Chats de Telegram Registrados</h2>
                <p className="text-xs text-slate-400 mt-1">Supervisa las cuentas que interactúan con el bot de Telegram.</p>
              </div>
              <div className="relative w-full sm:w-[320px] flex items-center group">
                <Search className="absolute left-4 text-slate-400 group-hover:text-[var(--color-accent)] transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por alias, chat ID o cuenta asociada..."
                  value={tgSearchTerm}
                  onChange={(e) => setTgSearchTerm(e.target.value)}
                  className={`w-full placeholder-slate-400 pl-11 pr-5 py-3 rounded-2xl text-[14px] outline-none border-2 transition shadow-sm font-medium ${isDark
                    ? 'bg-white/5 text-white border-white/10 focus:border-[var(--color-accent)] focus:bg-[#0E1320]'
                    : 'bg-slate-50 text-slate-900 border-slate-100 focus:border-[var(--color-accent)] focus:bg-white'
                    }`}
                />
              </div>
            </div>

            {/* Telegram Content */}
            {tgLoading ? (
              <div className="flex flex-col justify-center items-center py-20 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--color-accent)' }} />
                <span className="text-slate-400 font-bold">Cargando base de datos de Telegram...</span>
              </div>
            ) : telegramUsersFiltrados.length === 0 ? (
              <div className="flex flex-col justify-center items-center py-20 space-y-2">
                <ShieldAlert size={48} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
                <span className="text-slate-400 font-bold">No se encontraron chats de Telegram.</span>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-slate-400 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50/50 border-slate-100'}`}>
                      <th className="py-4 px-6">Chat de Telegram</th>
                      <th className="py-4 px-6">ID Chat</th>
                      <th className="py-4 px-6 text-center">Estado Vinculación</th>
                      <th className="py-4 px-6">Cuenta Web Asociada</th>
                      <th className="py-4 px-6">Primer Contacto</th>
                      <th className="py-4 px-6 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors duration-300 ${isDark ? 'divide-white/10' : 'divide-slate-100'}`}>
                    {telegramUsersFiltrados.map((tg) => {
                      return (
                        <tr key={tg.id} className={isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/30'}>
                          <td className="py-4 px-6 font-bold">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-blue-500/10 text-blue-500">
                                T
                              </div>
                              <div>
                                <div className={isDark ? 'text-white' : 'text-slate-800'}>
                                  {tg.first_name || ''} {tg.last_name || ''}
                                </div>
                                {tg.username && (
                                  <div className="text-xs text-blue-500">@{tg.username}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono text-xs">{tg.telegram_chat_id}</td>
                          <td className="py-4 px-6 text-center">
                            {tg.linked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase">
                                Vinculado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-slate-500/10 text-slate-500 border-slate-500/20 uppercase">
                                Invitado
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-xs font-semibold">
                            {tg.linked && tg.web_user ? (
                              <div>
                                <div className={isDark ? 'text-white' : 'text-slate-800'}>{tg.web_user.nombre}</div>
                                <div className="text-slate-400 mt-0.5">{tg.web_user.email}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic font-normal">Sin cuenta oficial</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-500">
                            {new Date(tg.fecha_registro).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {tg.linked && tg.web_user && (
                              <button
                                onClick={() => handleUnlinkTelegramAdmin(tg.web_user.id)}
                                disabled={actionLoading === tg.web_user.id}
                                className="flex items-center gap-1.5 mx-auto font-bold text-xs py-2 px-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer disabled:opacity-50 transition-all"
                              >
                                {actionLoading === tg.web_user.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <span>Desvincular</span>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

      </div>

      {/* Telemetría y Salud del Sistema */}
      <div className={`p-4 rounded-3xl border shadow-sm transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold ${
        isDark 
          ? 'bg-[#0E1320]/60 border-white/10 text-slate-300' 
          : 'bg-white border-slate-100 text-slate-600'
      }`}>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[var(--color-accent)] animate-pulse" />
          <span className="font-extrabold uppercase tracking-wider text-slate-400">Telemetría de Red</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 justify-center md:justify-end flex-1">
          {/* DB Status */}
          <div className="flex items-center gap-2">
            <Database size={14} className="text-slate-400" />
            <span>Base de Datos:</span>
            {healthStatus ? (
              healthStatus.database.status === 'connected' ? (
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-emerald-500 font-bold">Online</span>
                  <span className="text-slate-400">({healthStatus.database.latency_ms}ms)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1" title={healthStatus.database.details}>
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  <span className="text-rose-500 font-bold">Error</span>
                </div>
              )
            ) : (
              <span className="text-slate-400 animate-pulse">Chequeando...</span>
            )}
          </div>

          {/* Separator */}
          <div className="hidden md:block w-px h-4 bg-slate-200 dark:bg-white/10"></div>

          {/* Groq IA Status */}
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-slate-400" />
            <span>Servicio de IA:</span>
            {healthStatus ? (
              healthStatus.groq.status === 'connected' ? (
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span className="text-indigo-500 font-bold">Online</span>
                  <span className="text-slate-400">({healthStatus.groq.latency_ms}ms)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1" title={healthStatus.groq.details}>
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  <span className="text-rose-500 font-bold">Error</span>
                </div>
              )
            ) : (
              <span className="text-slate-400 animate-pulse">Chequeando...</span>
            )}
          </div>

          {/* Separator */}
          <div className="hidden md:block w-px h-4 bg-slate-200 dark:bg-white/10"></div>

          {/* Telegram Bot Status */}
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-slate-400" />
            <span>Bot Telegram:</span>
            {healthStatus ? (
              healthStatus.telegram.status === 'connected' ? (
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-blue-500 font-bold">Online</span>
                  <span className="text-slate-400">({healthStatus.telegram.latency_ms}ms)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1" title={healthStatus.telegram.details}>
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  <span className="text-rose-500 font-bold">Error</span>
                </div>
              )
            ) : (
              <span className="text-slate-400 animate-pulse">Chequeando...</span>
            )}
          </div>

          {/* Action button */}
          <button 
            onClick={fetchHealthStatus}
            disabled={healthLoading}
            className="px-3 py-1 rounded-xl border text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-accent)] border-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/5 cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0 ml-2"
          >
            <RotateCw size={10} className={healthLoading ? 'animate-spin' : ''} />
            Re-test
          </button>
        </div>
      </div>

      {/* Info panel */}
      <div className={`rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_15px_30px_rgba(15,23,42,0.1)] border transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-900 border-slate-900 text-white'
        }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white/10'}`}>
            <Settings2 size={24} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <h3 className="font-extrabold text-lg">Seguridad Avanzada Activada</h3>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-300'} text-sm font-medium mt-1`}>Todos los cambios de roles y estados requieren una cabecera de autenticación JWT cifrada con firma digital.</p>
          </div>
        </div>
        <div
          className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border"
          style={{
            color: 'var(--color-accent)',
            backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-accent) 20%, transparent)'
          }}
        >
          MedicAI Admin CLI v1.0.0
        </div>
      </div>

      {/* Sidebar de Detalles de Usuario (Slide-over) */}
      {selectedUser && (
        <>
          {/* Backdrop on mobile/tablet */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-300"
            onClick={() => setSelectedUser(null)}
          />
          
          <div className={`fixed inset-y-0 right-0 z-40 w-full sm:w-96 shadow-2xl border-l transition-all duration-300 ease-in-out p-6 flex flex-col justify-between ${
            isDark 
              ? 'bg-[#0E1320] border-white/10 text-white shadow-black/80' 
              : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/80'
          } backdrop-blur-md animate-in slide-in-from-right duration-300`}>
            
            <div className="space-y-6 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-[var(--color-accent)]" />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Perfil del Paciente</span>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors cursor-pointer"
                  title="Cerrar panel"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Avatar & Basic Info */}
              <div className="flex flex-col items-center text-center py-4 space-y-3">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-3xl shadow-md transition-all duration-300"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                    color: 'var(--color-accent)',
                    border: '3px solid var(--color-accent)'
                  }}
                >
                  {selectedUser.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg flex items-center justify-center gap-1.5">
                    {selectedUser.nombre}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                    <Mail size={12} /> {selectedUser.email}
                  </p>
                </div>
                <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${
                  selectedUser.role === 'administrador'
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20'
                }`}>
                  {selectedUser.role}
                </span>
              </div>

              {/* Status Details */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Detalles del Historial</h4>
                
                <div className={`p-4 rounded-2xl space-y-3.5 border ${
                  isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">ID de Registro</span>
                    <span className="font-bold text-slate-800 dark:text-white">{selectedUser.id}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Verificación de Correo</span>
                    {selectedUser.email_verified ? (
                      <span className="text-emerald-500 dark:text-emerald-400 font-extrabold flex items-center gap-1 uppercase text-[10px]">
                        <ShieldCheck size={12} /> Verificado
                      </span>
                    ) : (
                      <span className="text-amber-500 dark:text-amber-400 font-extrabold flex items-center gap-1 uppercase text-[10px]">
                        <AlertCircle size={12} /> Pendiente
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Estado de la Cuenta</span>
                    {selectedUser.activo ? (
                      <span className="text-emerald-500 dark:text-emerald-400 font-bold uppercase text-[10px]">Activo</span>
                    ) : (
                      <span className="text-rose-500 dark:text-rose-400 font-bold uppercase text-[10px]">Inactivo</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Fecha de Registro</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      {new Date(selectedUser.fecha_registro).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Conversaciones</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <MessageSquare size={12} className="text-slate-400" />
                      {selectedUser.cant_conversaciones || 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Telegram</span>
                    {selectedUser.telegram_chat_id ? (
                      <span className="text-blue-500 dark:text-blue-400 font-extrabold flex items-center gap-1 uppercase text-[10px]">
                        Conectado ({selectedUser.telegram_chat_id})
                      </span>
                    ) : (
                      <span className="text-slate-400 font-extrabold flex items-center gap-1 uppercase text-[10px]">
                        No conectado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Controles Administrativos</h4>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Cambiar Rol del Usuario</label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => {
                        handleCambiarRol(selectedUser.id, e.target.value);
                      }}
                      disabled={actionLoading === selectedUser.id || selectedUser.id === currentAdmin?.id}
                      className={`w-full px-3 py-2.5 rounded-xl text-xs outline-none font-bold border transition-colors cursor-pointer ${
                        isDark 
                          ? 'bg-[#0E1320] border-white/10 text-white focus:border-[var(--color-accent)]' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-[var(--color-accent)]'
                      }`}
                    >
                      <option value="usuario">Usuario normal</option>
                      <option value="administrador">Administrador</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Estado de Operación</label>
                    <button
                      onClick={() => {
                        handleToggleEstado(selectedUser.id, selectedUser.activo);
                      }}
                      disabled={actionLoading === selectedUser.id || selectedUser.id === currentAdmin?.id}
                      className={`w-full flex items-center justify-center gap-2 font-bold text-xs py-3 px-4 rounded-xl border transition shadow-sm cursor-pointer ${
                        selectedUser.activo
                          ? 'bg-rose-600/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white'
                          : 'bg-emerald-600/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                      } disabled:opacity-50`}
                    >
                      {actionLoading === selectedUser.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : selectedUser.activo ? (
                        <>
                          <UserX size={14} /> Desactivar y Bloquear Cuenta
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} /> Activar y Desbloquear Cuenta
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-white/5 pt-4 flex gap-3 shrink-0">
              <button 
                onClick={() => setSelectedUser(null)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                  isDark 
                    ? 'border-white/10 hover:bg-white/5 text-slate-300' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default AdminDashboardPage;

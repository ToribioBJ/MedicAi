import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Users, UserCheck, ShieldAlert, UserX, Search,
  RotateCw, ShieldCheck, Mail, Calendar, Settings2, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  role: string;
  email_verified: boolean;
  fecha_registro: string;
}

export const AdminDashboardPage = () => {
  const { token, user: currentAdmin } = useAuth();
  const { accentColor, isDark } = useTheme();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Alertas
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  useEffect(() => {
    fetchUsuarios();
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

      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, activo: !currentActivo } : u));
      setSuccessMsg(`Estado del usuario actualizado a ${!currentActivo ? 'Activo' : 'Inactivo'}`);
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

  // Estadísticas
  const stats = {
    total: usuarios.length,
    verificados: usuarios.filter(u => u.email_verified).length,
    administradores: usuarios.filter(u => u.role === 'administrador').length,
    inactivos: usuarios.filter(u => !u.activo).length
  };

  return (
    <div className={`p-6 sm:p-10 max-w-7xl mx-auto space-y-8 font-sans transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>

      {/* Action Header Row */}
      <div className="flex justify-end items-center gap-4">
        <button
          onClick={fetchUsuarios}
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 transition shadow-sm font-bold disabled:opacity-50 ${isDark
            ? 'bg-white/5 border-white/10 text-slate-200 hover:border-[var(--color-accent)] hover:text-white'
            : 'bg-white border-slate-200 text-slate-700 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
            }`}
        >
          <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar Lista
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Usuarios */}
        <div className={`p-6 rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-center gap-5 transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'
          }`}>
          <div className="p-4 rounded-2xl" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}>
            <Users size={28} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Total Usuarios</div>
            <div className={`text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.total}</div>
          </div>
        </div>

        {/* Verificados */}
        <div className={`p-6 rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-center gap-5 transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'
          }`}>
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            <UserCheck size={28} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Correo Verificado</div>
            <div className={`text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.verificados}</div>
          </div>
        </div>

        {/* Administradores */}
        <div className={`p-6 rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-center gap-5 transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'
          }`}>
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Administradores</div>
            <div className={`text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.administradores}</div>
          </div>
        </div>

        {/* Inactivos */}
        <div className={`p-6 rounded-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-center gap-5 transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'
          }`}>
          <div className={`p-4 rounded-2xl ${isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
            <UserX size={28} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Cuentas Inactivas</div>
            <div className={`text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.inactivos}</div>
          </div>
        </div>

      </div>

      {/* Main Card with Table */}
      <div className={`rounded-[2rem] border shadow-[0_15px_40px_rgba(0,0,0,0.015)] overflow-hidden transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'
        }`}>

        {/* Table Search Header */}
        <div className={`p-6 border-b flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-slate-100'
          }`}>
          <h2 className={`text-xl font-bold self-start sm:self-auto ${isDark ? 'text-white' : 'text-slate-900'}`}>Listado Clínico de Usuarios</h2>

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
                  <th className="py-4 px-6 text-center">Estado</th>
                  <th className="py-4 px-6">Fecha Registro</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors duration-300 ${isDark ? 'divide-white/10' : 'divide-slate-100'}`}>
                {usuariosFiltrados.map((u) => {
                  const isCurrentAdmin = u.id === currentAdmin?.id;

                  return (
                    <tr key={u.id} className={`transition-colors font-medium ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/30'}`}>

                      {/* Usuario info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${u.role === 'administrador'
                              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                              : ''
                              }`}
                            style={u.role !== 'administrador' ? {
                              backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                              color: 'var(--color-accent)'
                            } : {}}
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
                        <div className="relative inline-block w-40">
                          <select
                            value={u.role}
                            onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                            disabled={actionLoading === u.id || isCurrentAdmin}
                            className={`w-full px-3 py-2 rounded-xl text-sm outline-none font-bold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border ${isDark
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
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${isDark ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
                            }`}>
                            <ShieldCheck size={14} /> Verificado
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${isDark ? 'bg-amber-950/20 border-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700 border-amber-100/50'
                            }`}>
                            <AlertCircle size={14} /> Pendiente
                          </span>
                        )}
                      </td>

                      {/* Estado Activo */}
                      <td className="py-4 px-6 text-center">
                        {u.activo ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>Activo</span>
                        ) : (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-rose-950/20 border-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600 border-rose-100'
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
                          onClick={() => handleToggleEstado(u.id, u.activo)}
                          disabled={actionLoading === u.id || isCurrentAdmin}
                          className={`flex items-center gap-1.5 mx-auto font-bold text-xs py-2 px-4 rounded-xl border transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${u.activo
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

    </div>
  );
};

export default AdminDashboardPage;

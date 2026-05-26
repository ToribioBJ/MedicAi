import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Panel de Administración</h1>
          <p className="text-slate-500 font-medium mt-1">Gestiona las cuentas de usuarios, activa/desactiva accesos y define privilegios en MedicAI.</p>
        </div>
        <button 
          onClick={fetchUsuarios}
          disabled={loading}
          className="flex items-center gap-2 bg-white text-slate-700 px-5 py-3 rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 transition shadow-sm font-bold disabled:opacity-50"
        >
          <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
          Actualizar Lista
        </button>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-emerald-700 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={20} className="shrink-0" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}
      
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 shadow-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Usuarios */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
            <Users size={28} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Total Usuarios</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">{stats.total}</div>
          </div>
        </div>

        {/* Verificados */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
            <UserCheck size={28} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Correo Verificado</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">{stats.verificados}</div>
          </div>
        </div>

        {/* Administradores */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Administradores</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">{stats.administradores}</div>
          </div>
        </div>

        {/* Inactivos */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-600">
            <UserX size={28} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-400">Cuentas Inactivas</div>
            <div className="text-3xl font-extrabold text-slate-800 mt-1">{stats.inactivos}</div>
          </div>
        </div>

      </div>

      {/* Main Card with Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.015)] overflow-hidden">
        
        {/* Table Search Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900 self-start sm:self-auto">Listado Clínico de Usuarios</h2>
          
          <div className="relative w-full sm:w-[320px] flex items-center group">
            <Search className="absolute left-4 text-slate-400 group-hover:text-blue-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 pl-11 pr-5 py-3 rounded-2xl text-[14px] outline-none border-2 border-slate-100 focus:border-blue-500 focus:bg-white transition shadow-sm font-medium"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <span className="text-slate-400 font-bold">Cargando base de datos de usuarios...</span>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20 space-y-2">
            <ShieldAlert size={48} className="text-slate-300" />
            <span className="text-slate-400 font-bold">No se encontraron usuarios en el sistema.</span>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Usuario</th>
                  <th className="py-4 px-6">Rol</th>
                  <th className="py-4 px-6 text-center">Verificación</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                  <th className="py-4 px-6">Fecha Registro</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map((u) => {
                  const isCurrentAdmin = u.id === currentAdmin?.id;
                  
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/30 transition-colors font-medium">
                      
                      {/* Usuario info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${u.role === 'administrador' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              {u.nombre}
                              {isCurrentAdmin && <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Tú</span>}
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
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm outline-none focus:border-blue-500 font-bold hover:border-slate-300 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <option value="usuario">Usuario normal</option>
                            <option value="administrador">Administrador</option>
                          </select>
                        </div>
                      </td>

                      {/* Verificación de correo */}
                      <td className="py-4 px-6 text-center">
                        {u.email_verified ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                            <ShieldCheck size={14} /> Verificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100/50">
                            <AlertCircle size={14} /> Pendiente
                          </span>
                        )}
                      </td>

                      {/* Estado Activo */}
                      <td className="py-4 px-6 text-center">
                        {u.activo ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Activo</span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">Inactivo</span>
                        )}
                      </td>

                      {/* Fecha de Registro */}
                      <td className="py-4 px-6 text-slate-500 text-sm">
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
                          className={`flex items-center gap-1.5 mx-auto font-bold text-xs py-2 px-4 rounded-xl border transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                            u.activo 
                              ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100/50 hover:border-rose-200' 
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
      <div className="bg-slate-900 text-white rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_15px_30px_rgba(15,23,42,0.1)]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl">
            <Settings2 size={24} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg">Seguridad Avanzada Activada</h3>
            <p className="text-slate-400 text-sm font-medium mt-1">Todos los cambios de roles y estados requieren una cabecera de autenticación JWT cifrada con firma digital.</p>
          </div>
        </div>
        <div className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
          MedicAI Admin CLI v1.0.0
        </div>
      </div>

    </div>
  );
};

export default AdminDashboardPage;

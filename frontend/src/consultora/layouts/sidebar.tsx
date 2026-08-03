import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  MessageSquare, Settings, 
  Plus, History, Trash2, User2, ChevronRight, LogOut, ShieldCheck
} from 'lucide-react';
import logoMedicAI from '../../img/logo-medica.png';
import { useTheme } from '../../context/ThemeContext';
import { 
  listarConversaciones, eliminarConversacion, 
  type Conversacion 
} from '../../api/chatbotApi';
import { useAuth } from '../../context/AuthContext';

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
};

// Lista base de navegación estática

export const Sidebar = ({ isMobileOpen, closeMobile }: { isMobileOpen?: boolean, closeMobile?: () => void }) => {
  const { isDark, accentColor } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id: currentChatId } = useParams();
  const { pathname } = useLocation();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const isChatView = pathname.startsWith('/chatbot');

  useEffect(() => {
    actualizarHistorial();
    
    // Configurar polling de historial de chats cada 5 segundos
    const interval = setInterval(actualizarHistorial, 5000);
    
    return () => clearInterval(interval);
  }, [pathname, user?.id]);

  const actualizarHistorial = () => {
    if (user?.id) {
      listarConversaciones(user.id).then(r => setConversaciones(r.data)).catch(() => {});
    }
  };

  const handleNuevoChat = () => {
    navigate('/chatbot');
    closeMobile?.();
  };

  const handleEliminarChat = async (id: number) => {
    try {
      await eliminarConversacion(id);
      if (Number(currentChatId) === id) navigate('/chatbot');
      actualizarHistorial();
    } catch (err) {
      console.error('Error eliminando chat:', err);
    }
  };

  const safeAccentColor = accentColor || '#2563eb';

  // Componente para botones de navegación
  const NavButton = ({ to, label, icon: Icon, isActive }: { to: string, label: string, icon: any, isActive: boolean }) => (
    <NavLink
      to={to}
      onClick={() => closeMobile?.()}
      className={`relative w-full h-[60px] flex items-center px-4 group/item transition-all duration-300 ${
        isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
      }`}
    >
      {/* Icon Container */}
      <div 
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
          isActive ? 'text-white shadow-lg' : isDark ? 'text-white/40' : 'text-slate-500'
        }`}
        style={isActive ? { 
          background: `linear-gradient(135deg, ${safeAccentColor} 0%, #4f46e5 100%)`, 
          boxShadow: `0 8px 20px -4px ${safeAccentColor}60` 
        } : {}}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      
      {/* Sliding Label */}
      <div className={`flex-1 transition-all duration-500 ml-5 whitespace-nowrap overflow-hidden flex items-center justify-between pr-2 ${
        isMobileOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <span className={`font-black text-[14px] ${
          isActive ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-white/50' : 'text-slate-600')
        }`}>
          {label}
        </span>
        <ChevronRight size={14} className="opacity-0 group-hover:opacity-40" />
      </div>

      {isActive && (
        <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-l-full" />
      )}
    </NavLink>
  );

  return (
    <aside className={`group fixed md:relative top-0 left-0 z-50 md:z-30 h-screen flex flex-col transition-all duration-300 ease-out shrink-0 overflow-hidden glass border-r ${
      isDark ? 'border-white/5 shadow-2xl shadow-black/40 bg-[#0B0F19] md:bg-transparent' : 'border-slate-200/60 shadow-xl bg-white md:bg-transparent'
    } ${
      isMobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0 w-[280px] md:w-20 md:hover:w-72'
    }`}>
      
      {/* Branding */}
      <div className="w-full h-14 flex items-center mt-6 mb-8 shrink-0 px-4">
         <div className="w-12 h-full flex items-center justify-center shrink-0">
            <div className="w-12 h-12 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 active:scale-95">
              <img src={logoMedicAI} alt="MedicAI" className="w-10 h-10 object-contain drop-shadow-xl" />
            </div>
         </div>
         <div className={`transition-all duration-500 ml-5 whitespace-nowrap overflow-hidden ${
            isMobileOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
         }`}>
            <div className={`font-black text-2xl tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>MedicAI</div>
            <div className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Inteligencia Médica</div>
         </div>
      </div>

      {/* Primary Action */}
      <div className="w-full flex items-center mb-6 shrink-0 px-4">
        <button
          onClick={handleNuevoChat}
          className="relative w-full h-[60px] flex items-center group/btn transition-all duration-300"
        >
          <div className="w-12 h-full flex items-center justify-center shrink-0">
             <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover/btn:rotate-90 group-hover:scale-110" 
                  style={{ background: `linear-gradient(135deg, ${safeAccentColor}, #4f46e5)` }}>
                <Plus size={26} className="text-white" strokeWidth={3} />
             </div>
          </div>
          <div className={`transition-all duration-500 ml-5 whitespace-nowrap overflow-hidden flex flex-col items-start leading-none ${
             isMobileOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <span className={`text-[15px] font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Nueva consulta</span>
            <span className={`text-[10px] font-bold mt-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Iniciar nuevo triaje</span>
          </div>
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {/* Main Nav Dinámico */}
        {(() => {
          const menuItems: NavItem[] = [
            { to: '/chatbot',   label: 'Asistente Médico', icon: MessageSquare },
          ];
          if (user?.role === 'administrador') {
            menuItems.push({ to: '/admin', label: 'Administración', icon: ShieldCheck });
          }
          return menuItems.map((item) => (
            <NavButton 
              key={item.to} 
              to={item.to} 
              label={item.label} 
              icon={item.icon} 
              isActive={pathname === item.to || (item.to === '/chatbot' && isChatView)} 
            />
          ));
        })()}

        {/* History Section */}
        <div className={`pt-6 transition-all duration-500 px-4 ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <div className="mb-3 flex items-center gap-3 pl-2">
            <History size={15} className={isDark ? 'text-white/20' : 'text-slate-400'} />
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Historial</span>
          </div>
          <div className="space-y-1">
            {conversaciones.length === 0 && (
              <p className="text-[10px] text-white/20 italic">No hay chats recientes</p>
            )}
            {conversaciones.slice(0, 5).map(c => (
              <div
                key={c.id}
                onClick={() => { navigate(`/chatbot/${c.id}`); closeMobile?.(); }}
                className={`group/item relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                  Number(currentChatId) === c.id 
                    ? (isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-100')
                    : (isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50/50')
                }`}
              >
                <span className={`text-[13px] truncate font-bold flex-1 ${
                  Number(currentChatId) === c.id ? 'text-blue-500' : (isDark ? 'text-white/50' : 'text-slate-600')
                }`}>
                  {c.titulo}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEliminarChat(c.id); }}
                  className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-rose-500/20 hover:text-rose-500 rounded-lg transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className={`mt-auto shrink-0 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
        <NavButton 
          to="/configuracion" 
          label="Ajustes" 
          icon={Settings} 
          isActive={pathname === '/configuracion'} 
        />
        
        <div className="flex items-center px-4 py-6 group/user mt-auto relative overflow-hidden">
           <div className="w-12 h-full flex items-center justify-center shrink-0">
             <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10 border border-black/5 dark:border-white/5">
                <User2 size={22} className={isDark ? 'text-white/70' : 'text-slate-600'} />
             </div>
           </div>
           
           <div className={`flex-1 flex items-center justify-between transition-all duration-500 ml-5 whitespace-nowrap overflow-hidden ${
              isMobileOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
           }`}>
              <div className="flex flex-col overflow-hidden pr-2">
                 <div className={`font-black text-[13px] truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.nombre || 'Usuario'}</div>
                 <div className={`text-[10px] font-bold truncate ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{user?.email || 'Panel Principal'}</div>
              </div>
              
              <button 
                onClick={() => { logout(); navigate('/login'); }}
                title="Cerrar sesión"
                className={`shrink-0 p-2 rounded-xl transition-all duration-300 hover:bg-rose-500/10 hover:text-rose-500 ${isDark ? 'text-white/30' : 'text-slate-400'}`}
              >
                <LogOut size={18} />
              </button>
           </div>
        </div>
      </div>
    </aside>
  );
};

import { useLocation, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const meta: Record<string, { title: string; subtitle: string }> = {
  '/chatbot': { title: 'Asistente Médico', subtitle: 'Consultas inteligentes y triaje con IA' },
  '/calendario': { title: 'Calendario', subtitle: 'Agenda de citas médicas' },
  '/nosotros': { title: 'Sobre MedicAI', subtitle: 'Conoce a tu asistente de salud' },
  '/configuracion': { title: 'Configuración', subtitle: 'Personaliza la apariencia y el rendimiento de MedicAI' },
  '/admin': { title: 'Panel de Administración', subtitle: 'Gestiona cuentas de usuarios, accesos y privilegios' },
};

export const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { pathname } = useLocation();
  const { isDark } = useTheme();
  const info = meta[pathname] || { title: 'MedicAI', subtitle: 'Consultora médica' };

  return (
    <header className={`sticky top-0 w-full px-8 py-4 flex items-center justify-between z-20 glass border-b transition-all duration-500 ${isDark ? 'border-white/5' : 'border-slate-200/50'
      }`}>
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
          <Menu size={20} className={isDark ? 'text-white/70' : 'text-slate-600'} />
        </button>
        <div>
          <h1 className={`text-xl font-bold tracking-tight leading-tight transition-colors ${isDark ? 'text-white' : 'text-slate-900'
            }`}>
            {info.title}
          </h1>
          <p className={`text-[12px] font-medium transition-colors ${isDark ? 'text-white/40' : 'text-slate-400'
            }`}>{info.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <nav className="hidden md:flex items-center gap-8 border-r border-slate-100 dark:border-white/10 pr-8">
          <Link
            to="/nosotros"
            className={`text-[13px] font-bold transition-all relative group ${pathname === '/nosotros' ? 'text-blue-500' : (isDark ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-900')
              }`}
          >
            Nosotros
            <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full ${pathname === '/nosotros' ? 'w-full' : ''}`} />
          </Link>
        </nav>
      </div>
    </header>
  );
};

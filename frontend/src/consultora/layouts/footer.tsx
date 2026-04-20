import { useTheme } from '../../context/ThemeContext';


export const Footer = () => {
  const { isDark } = useTheme();

  return (
    <footer className={`w-full py-6 px-8 mt-auto border-t transition-colors duration-300 ${isDark ? 'border-white/5 bg-[#0B0F19]/50' : 'border-slate-100 bg-[#F8FAFC]'}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-center md:text-center">
          <span className={`text-[13px] font-medium ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            © {new Date().getFullYear()} MedicAI Consultora. Todos los derechos reservados.
          </span>
        </div>
      </div>
    </footer>
  );
};

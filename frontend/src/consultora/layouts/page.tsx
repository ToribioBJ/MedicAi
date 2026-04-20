import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Footer } from './footer';
import { useTheme } from '../../context/ThemeContext';

export const ConsultoraLayout = () => {
  const { isDark, compactMode } = useTheme();

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${
        isDark ? 'bg-[#0B0F19] text-white' : 'bg-[#F8FAFC] text-gray-900'
      } ${compactMode ? 'compact' : ''}`}
    >
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Header />
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default ConsultoraLayout;


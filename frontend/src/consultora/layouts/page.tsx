import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Footer } from './footer';
import { useTheme } from '../../context/ThemeContext';

export const ConsultoraLayout = () => {
  const { isDark, compactMode } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${
        isDark ? 'bg-[#0B0F19] text-white' : 'bg-[#F8FAFC] text-gray-900'
      } ${compactMode ? 'compact' : ''}`}
    >
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <Sidebar isMobileOpen={isSidebarOpen} closeMobile={() => setIsSidebarOpen(false)} />
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
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


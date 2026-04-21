import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ConsultoraLayout from './consultora/layouts/page';
import ChatbotPage from './consultora/chatbot/page';
import CalendarioPage from './consultora/calendario/page';
import ConfiguracionPage from './consultora/configuracion/page';
import NosotrosPage from './consultora/nosotros/page';
import LoginPage from './auth/login/page';
import RegisterPage from './auth/register/page';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<ConsultoraLayout />}>
          <Route index element={<Navigate to="/chatbot" replace />} />
          <Route path="/chatbot/:id?"    element={<ChatbotPage />} />
          <Route path="/calendario"      element={<CalendarioPage />} />
          <Route path="/configuracion"   element={<ConfiguracionPage />} />
          <Route path="/nosotros"        element={<NosotrosPage />} />
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/chatbot" replace />} />
    </Routes>
  );
}

export default App;

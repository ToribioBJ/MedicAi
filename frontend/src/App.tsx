import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ConsultoraLayout from './consultora/layouts/page';
import ChatbotPage from './consultora/chatbot/page';
import ConfiguracionPage from './consultora/configuracion/page';
import NosotrosPage from './consultora/nosotros/page';
import LoginPage from './auth/login/page';
import RegisterPage from './auth/register/page';
import VerifyEmailPage from './auth/verify/page';
import ForgotPasswordPage from './auth/forgot/page';
import ResetPasswordPage from './auth/reset/page';
import AdminDashboardPage from './consultora/admin/page';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

const AdminRoute = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'administrador') {
    return <Navigate to="/chatbot" replace />;
  }
  
  return <Outlet />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<ConsultoraLayout />}>
          <Route index element={<Navigate to="/chatbot" replace />} />
          <Route path="/chatbot/:id?"    element={<ChatbotPage />} />
          <Route path="/configuracion"   element={<ConfiguracionPage />} />
          <Route path="/nosotros"        element={<NosotrosPage />} />
          
          {/* Ruta protegida de administrador */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/chatbot" replace />} />
    </Routes>
  );
}

export default App;

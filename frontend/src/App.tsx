import { Routes, Route, Navigate } from 'react-router-dom';
import ConsultoraLayout from './consultora/layouts/page';
import ChatbotPage from './consultora/chatbot/page';
import CalendarioPage from './consultora/calendario/page';
import ConfiguracionPage from './consultora/configuracion/page';
import NosotrosPage from './consultora/nosotros/page';

function App() {
  return (
    <Routes>
      <Route element={<ConsultoraLayout />}>
        <Route index element={<Navigate to="/chatbot" replace />} />
        <Route path="/chatbot/:id?"    element={<ChatbotPage />} />
        <Route path="/calendario"      element={<CalendarioPage />} />
        <Route path="/configuracion"   element={<ConfiguracionPage />} />
        <Route path="/nosotros"        element={<NosotrosPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/chatbot" replace />} />
    </Routes>
  );
}

export default App;

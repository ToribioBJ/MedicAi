import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Volume2, VolumeX } from 'lucide-react';

import { ChatInput } from '../components/ChatInput';
import { ChatContainer } from '../components/ChatContainer';
import {
  enviarMensajeChat, obtenerDetalleChat,
  type Mensaje
} from '../../api/chatbotApi';

export const ChatbotPage = () => {
  const { accentColor } = useTheme();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);

  // Sincronizar mensajes cuando cambia el ID de la URL
  useEffect(() => {
    if (id) {
      obtenerDetalleChat(Number(id)).then(r => {
        setMensajes(r.data.mensajes);
      }).catch(() => {
        navigate('/chatbot'); // Si el ID no es válido, volver al inicio
      });
    } else {
      setMensajes([]);
    }
  }, [id, navigate]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isTyping) return;

    // UI Optimista: Añadir mensaje del usuario inmediatamente
    const userMsg: Mensaje = { role: 'user', contenido: textToSend };
    setMensajes(prev => [...prev, userMsg]);

    setInput('');
    setIsTyping(true);

    try {
      const convId = id ? Number(id) : undefined;
      const { data } = await enviarMensajeChat(textToSend, convId, user?.id);

      const botMsg: Mensaje = { role: 'assistant', contenido: data.respuesta };
      setMensajes(prev => [...prev, botMsg]);

      if (isTtsEnabled && window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Detener previo
        const utterance = new SpeechSynthesisUtterance(data.respuesta);
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);
      }

      // Si era una conversación nueva, navegamos al nuevo ID
      if (!id) {
        navigate(`/chatbot/${data.conversacion_id}`);
      }
    } catch (error) {
      console.error('Error chat:', error);
      setMensajes(prev => [...prev, {
        role: 'assistant',
        contenido: 'Hubo un error al procesar tu mensaje. Revisa la conexión con el servidor.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative bg-slate-50 dark:bg-transparent h-full">
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-4 md:py-8">
        <div className="max-w-3xl mx-auto flex flex-col h-full pb-20">
          <ChatContainer
            mensajes={mensajes}
            isTyping={isTyping}
            accentColor={accentColor}
            onSelectSuggestion={(s) => handleSend(s)}
          />
        </div>
      </div>

      {/* Input de Chat */}
      <div className="absolute bottom-0 left-0 right-0">
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={(textOverride) => handleSend(textOverride)}
          isTyping={isTyping}
          hasMessages={mensajes.length > 0}
          lastBotMessage={mensajes.filter(m => m.role === 'assistant').pop()?.contenido}
          isTtsEnabled={isTtsEnabled}
          setIsTtsEnabled={setIsTtsEnabled}
        />
      </div>
    </div>
  );
};

export default ChatbotPage;

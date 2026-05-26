import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, X } from 'lucide-react';

import { ChatInput } from '../components/ChatInput';
import { ChatContainer } from '../components/ChatContainer';
import {
  enviarMensajeChat, obtenerDetalleChat,
  type Mensaje
} from '../../api/chatbotApi';

export const ChatbotPage = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);

  // States for subhistory sidebar and active navigation
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [activeMessageIndex, setActiveMessageIndex] = useState<number | null>(null);

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

  const handleScrollToMessage = (index: number) => {
    const element = document.getElementById(`msg-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Filter messages to get only user queries with their original index
  const userQueries = mensajes
    .map((m, idx) => ({ ...m, originalIndex: idx }))
    .filter(m => m.role === 'user');

  return (
    <div className="flex-1 flex h-[calc(100vh-170px)] min-h-[480px] overflow-hidden bg-slate-50 dark:bg-[#0B0F19]/40 relative rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm m-4 md:m-8">
      {/* Área del Chat */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Cabecera del Chat */}
        <div className={`px-6 py-4 border-b flex items-center justify-between transition-colors duration-300 shrink-0 ${isDark ? 'bg-[#0E1320]/60 border-white/10' : 'bg-white border-slate-100'
          }`}>

          <div className="flex items-center gap-2">
            {/* Botón para alternar sub-historial */}
            {userQueries.length > 0 && (
              <button
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className={`p-2 rounded-xl border transition-all shrink-0 ${isRightSidebarOpen
                  ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/20 text-[var(--color-accent)]'
                  : isDark
                    ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                title={isRightSidebarOpen ? "Ocultar navegación" : "Mostrar navegación"}
              >
                <MessageSquare size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Contenedor de Mensajes */}
        <div className="flex-grow overflow-hidden relative">
          <ChatContainer
            mensajes={mensajes}
            isTyping={isTyping}
          />
        </div>

        {/* Input de Chat */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
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

      {/* Sub-historial / Panel de Navegación Derecho (Flotante - Desktop) */}
      {userQueries.length > 0 && isRightSidebarOpen && (
        <div className={`absolute right-6 top-20 w-72 max-h-[calc(100%-8rem)] z-20 flex flex-col rounded-2xl border transition-all duration-300 ease-in-out shadow-2xl backdrop-blur-lg hidden lg:flex animate-in fade-in slide-in-from-right-4 ${isDark
          ? 'bg-[#0E1320]/80 border-white/10 text-white shadow-black/40'
          : 'bg-white/80 border-slate-200/80 text-slate-800 shadow-slate-200/50'
          }`}>
          <div className="p-4 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-white/5 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-slate-400 dark:text-slate-500" />
                <span className="font-bold text-xs tracking-wider uppercase opacity-65 text-slate-500 dark:text-slate-400">Contenido del Chat</span>
              </div>
              <button
                onClick={() => setIsRightSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
                title="Cerrar panel"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
              {userQueries.map((q) => {
                const isSelected = activeMessageIndex === q.originalIndex;
                return (
                  <button
                    key={q.originalIndex}
                    onClick={() => {
                      setActiveMessageIndex(q.originalIndex);
                      handleScrollToMessage(q.originalIndex);
                    }}
                    className={`w-full text-left group flex items-start justify-between p-2.5 rounded-xl transition-all duration-200 border ${isSelected
                      ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20 font-bold shadow-sm'
                      : isDark
                        ? 'bg-transparent border-transparent hover:bg-white/5 text-slate-400 hover:text-white'
                        : 'bg-transparent border-transparent hover:bg-slate-100/50 text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    <span className="text-xs line-clamp-2 leading-relaxed flex-1 pr-2">
                      {q.contenido}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-all duration-200 ${isSelected
                      ? 'bg-[var(--color-accent)] scale-110 shadow-sm'
                      : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400 dark:group-hover:bg-slate-500'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Drawer para mobile */}
      {userQueries.length > 0 && isRightSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-in fade-in duration-300"
            onClick={() => setIsRightSidebarOpen(false)}
          />
          {/* Panel móvil */}
          <div className={`fixed right-0 top-0 bottom-0 z-50 w-72 flex flex-col overflow-hidden transition-all duration-300 ease-in-out lg:hidden animate-in slide-in-from-right duration-300 ${isDark ? 'bg-[#0E1320] border-l border-white/10 text-white' : 'bg-white border-l border-slate-200 text-slate-800'
            }`}>
            <div className="p-4 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-white/5 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-slate-400 dark:text-slate-500" />
                  <span className="font-bold text-xs tracking-wider uppercase opacity-65 text-slate-500 dark:text-slate-400">Contenido del Chat</span>
                </div>
                <button
                  onClick={() => setIsRightSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                {userQueries.map((q) => {
                  const isSelected = activeMessageIndex === q.originalIndex;
                  return (
                    <button
                      key={q.originalIndex}
                      onClick={() => {
                        setActiveMessageIndex(q.originalIndex);
                        handleScrollToMessage(q.originalIndex);
                        setIsRightSidebarOpen(false); // close drawer on click
                      }}
                      className={`w-full text-left group flex items-start justify-between p-2.5 rounded-xl transition-all duration-200 border ${isSelected
                        ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20 font-bold shadow-sm'
                        : isDark
                          ? 'bg-transparent border-transparent hover:bg-white/5 text-slate-400 hover:text-white'
                          : 'bg-transparent border-transparent hover:bg-slate-100/50 text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      <span className="text-xs line-clamp-2 leading-relaxed flex-1 pr-2">
                        {q.contenido}
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-all duration-200 ${isSelected
                        ? 'bg-[var(--color-accent)] scale-110 shadow-sm'
                        : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400 dark:group-hover:bg-slate-500'
                        }`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatbotPage;

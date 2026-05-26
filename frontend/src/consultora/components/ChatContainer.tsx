import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { type Mensaje } from '../../api/chatbotApi';
import logoMedicAI from '../../img/logo-medica.png';

interface Props {
  mensajes: Mensaje[];
  isTyping: boolean;
}

export const ChatContainer = ({ mensajes, isTyping }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, isTyping]);

  if (mensajes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative h-full bg-transparent">
        <div className="flex flex-col items-center max-w-sm w-full animate-in fade-in duration-700">

          <div className="w-16 h-16 mb-6">
            <img src={logoMedicAI} alt="MedicAI" className="w-full h-full object-contain" />
          </div>

          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight mb-2">
            Hola ¡Soy MedicAI!
          </h2>

          <p className="text-slate-500 dark:text-white/40 text-[17px] font-medium">
            ¿En qué puedo ayudarte hoy?
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 md:px-12 pt-8 pb-48 space-y-10 max-w-4xl mx-auto w-full bg-transparent">
      {mensajes.map((m, i) => (
        <div id={`msg-${i}`} key={i} className="w-full">
          <ChatMessage
            role={m.role}
            content={m.contenido}
          />
        </div>
      ))}

      {isTyping && (
        <div className="flex gap-4 md:gap-6 items-start animate-in fade-in duration-500">
          <div className="w-8 h-8 flex items-center justify-center shrink-0 overflow-hidden rounded-lg p-1.5 border border-slate-100 dark:border-white/5 bg-transparent">
            <img src={logoMedicAI} alt="AI" className="w-full h-full object-contain opacity-50" />
          </div>
          <div className="flex gap-1.5 py-3">
            <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full animate-bounce" />
          </div>
        </div>
      )}
      <div ref={scrollRef} />
    </div>
  );
};

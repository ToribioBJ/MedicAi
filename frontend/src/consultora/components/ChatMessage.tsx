import React from 'react';
import { type Mensaje } from '../../api/chatbotApi';
import logoMedicAI from '../../img/logo-medica.png';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isLast?: boolean;
  searchTerm?: string;
}

export const ChatMessage = ({ role, content, searchTerm }: Props) => {
  const isAssistant = role === 'assistant';

  const renderContent = () => {
    if (!searchTerm || !searchTerm.trim()) {
      return content;
    }

    const parts = content.split(new RegExp(`(${searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i} className="bg-yellow-300 dark:bg-yellow-600/40 text-black dark:text-white rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end animate-in fade-in slide-in-from-bottom-2 duration-500'}`}>
      
      <div className={`flex flex-col max-w-[85%] md:max-w-[80%] gap-1 ${isAssistant ? '' : 'items-end'}`}>
        <div 
          className={`px-4 py-3 rounded-2xl text-[16px] leading-[1.6] ${
            isAssistant 
              ? 'text-slate-800 dark:text-white/90 font-medium bg-transparent' 
              : 'text-slate-900 dark:text-white border border-slate-100 dark:border-white/5 bg-transparent'
          }`}
          style={{ fontFamily: 'Calibri, "Segoe UI", Candara, Arial, sans-serif' }}
        >
          {isAssistant && (
            <div className="w-6 h-6 mb-3">
              <img src={logoMedicAI} alt="MedicAI" className="w-full h-full object-contain opacity-80" />
            </div>
          )}
          <div className="whitespace-pre-wrap">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

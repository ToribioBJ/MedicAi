import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Plus, ArrowUp, Volume2, VolumeX } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  input: string;
  setInput: (v: string) => void;
  onSend: (text?: string) => void;
  isTyping: boolean;
  hasMessages: boolean;
  lastBotMessage?: string;
  isTtsEnabled?: boolean;
  setIsTtsEnabled?: (v: boolean) => void;
}

export const ChatInput = ({ input, setInput, onSend, isTyping, hasMessages, isTtsEnabled, setIsTtsEnabled }: Props) => {
  const { isDark } = useTheme();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const latestProps = useRef({ input, onSend });

  useEffect(() => {
    latestProps.current = { input, onSend };
  }, [input, onSend]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const currentInput = latestProps.current.input;
        const finalString = currentInput ? `${currentInput} ${transcript}` : transcript;

        setInput(finalString);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [setInput]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting dictation:', err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`p-6 pb-8 transition-all duration-500 w-full bg-transparent`}>
      <div className="max-w-3xl mx-auto relative bg-transparent">

        <div className={`flex items-center gap-2 p-1.5 border rounded-full transition-all duration-300 bg-transparent ${isDark
          ? 'border-white/10 focus-within:border-white/20'
          : 'border-slate-200 focus-within:border-slate-300'
          }`}>

          {/* Action: Add */}
          <button className={`p-2 rounded-full transition-all ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
            <Plus size={20} strokeWidth={2.5} />
          </button>

          {/* Voice Toggle (Text-to-Speech) */}
          {setIsTtsEnabled && (
            <button
              onClick={() => {
                if (setIsTtsEnabled) setIsTtsEnabled(!isTtsEnabled);
                if (isTtsEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
              }}
              className={`p-2 rounded-full transition-all ${isTtsEnabled ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-600')}`}
              title={isTtsEnabled ? "Desactivar lectura en voz alta" : "Activar lectura en voz alta"}
            >
              {/* @ts-ignore */}
              {isTtsEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          )}

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Escuchando..." : "Mensaje a MedicAI"}
            className="flex-1 bg-transparent border-none focus:ring-0 py-2.5 px-1 text-[16px] dark:text-white dark:placeholder-white/20 text-slate-800 placeholder-slate-400 outline-none w-full min-w-0"
            readOnly={isListening}
          />

          {/* Voice (Dictation) */}
          <button
            onClick={toggleListening}
            className={`p-2 rounded-full transition-all flex-shrink-0 ${isListening ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse' : isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-600'
              }`}
            title="Dictar mensaje"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Send */}
          <button
            onClick={() => onSend(input)}
            disabled={!input.trim() || isTyping}
            className={`p-2 rounded-full transition-all flex-shrink-0 flex items-center justify-center transform active:scale-95 disabled:opacity-30 ${input.trim() ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-transparent text-slate-300 dark:text-white/10'
              }`}
          >
            <ArrowUp size={20} strokeWidth={3} />
          </button>

        </div>
      </div>
    </div>
  );
};

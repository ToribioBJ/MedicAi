import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, ArrowUp, Volume2, VolumeX, Image, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  input: string;
  setInput: (v: string) => void;
  onSend: (text?: string, imagen?: string) => void;
  isTyping: boolean;
  hasMessages: boolean;
  lastBotMessage?: string;
  isTtsEnabled?: boolean;
  setIsTtsEnabled?: (v: boolean) => void;
}

export const ChatInput = ({ input, setInput, onSend, isTyping, isTtsEnabled, setIsTtsEnabled }: Props) => {
  const { isDark, accentColor } = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const latestProps = useRef({ input, onSend, selectedImage });

  useEffect(() => {
    latestProps.current = { input, onSend, selectedImage };
  }, [input, onSend, selectedImage]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendClick = () => {
    if (!input.trim() && !selectedImage) return;
    onSend(input, selectedImage || undefined);
    setInput('');
    setSelectedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  return (
    <div className={`p-4 md:p-6 pb-4 md:pb-8 transition-all duration-500 w-full bg-slate-50/80 dark:bg-[#0B0F19]/80 backdrop-blur-md`}>
      <div className="max-w-3xl mx-auto relative bg-transparent">
        
        {/* Vista previa de imagen seleccionada */}
        {selectedImage && (
          <div className="flex items-center gap-2 mb-3 bg-white/10 dark:bg-black/20 p-2 rounded-xl border border-dashed border-slate-300 dark:border-white/10 w-fit animate-in fade-in slide-in-from-bottom-2 duration-300">
            <img src={selectedImage} alt="Preview" className="w-12 h-12 object-cover rounded-lg shadow-sm" />
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1.5 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-red-500 hover:text-white transition-all text-slate-500 dark:text-slate-400"
              title="Eliminar imagen"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className={`flex items-center gap-2 p-1.5 border rounded-full transition-all duration-300 bg-transparent ${isDark
          ? 'border-white/10 focus-within:border-white/20'
          : 'border-slate-200 focus-within:border-slate-300'
          }`}>

          {/* Cargar imagen */}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`p-2 rounded-full cursor-pointer transition-all flex items-center justify-center ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
            title="Agregar imagen"
          >
            <Image size={20} />
          </label>

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
            placeholder={isListening ? "Escuchando..." : "Describe tus síntomas o sube una foto..."}
            className="flex-1 bg-transparent border-none focus:ring-0 py-2.5 px-1 text-[15px] md:text-[16px] dark:text-white dark:placeholder-white/20 text-slate-800 placeholder-slate-400 outline-none w-full min-w-0"
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
            onClick={handleSendClick}
            disabled={(!input.trim() && !selectedImage) || isTyping}
            className={`p-2 rounded-full transition-all flex-shrink-0 flex items-center justify-center transform active:scale-95 disabled:opacity-30 ${(input.trim() || selectedImage) ? 'text-white' : 'bg-transparent text-slate-300 dark:text-white/10'
              }`}
            style={(input.trim() || selectedImage) ? { backgroundColor: accentColor } : {}}
          >
            <ArrowUp size={20} strokeWidth={3} />
          </button>

        </div>
      </div>
    </div>
  );
};

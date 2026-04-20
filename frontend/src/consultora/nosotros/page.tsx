import { Info, HeartPulse, ShieldAlert } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const NosotrosPage = () => {
  const { isDark } = useTheme();

  const cards = [
    {
      icon: Info,
      title: '¿Qué es MedicAI?',
      content: 'MedicAI es un agente inteligente diseñado para escuchar tus síntomas y proporcionarte orientación inicial sobre posibles malestares. Utilizamos inteligencia artificial avanzada para analizar la información que nos brindas de manera rápida y segura.',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: HeartPulse,
      title: '¿Cómo funciona?',
      content: (
        <div className="space-y-4">
          <div>
            <span className="font-bold">1. Cuéntanos:</span>
            <p className="opacity-70">Describe tus síntomas con el mayor detalle posible.</p>
          </div>
          <div>
            <span className="font-bold">2. Análisis:</span>
            <p className="opacity-70">Nuestra IA evaluará la información proporcionada.</p>
          </div>
          <div>
            <span className="font-bold">3. Orientación:</span>
            <p className="opacity-70">Recibirás un pre-diagnóstico y recomendaciones sobre a qué especialista acudir.</p>
          </div>
        </div>
      ),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      icon: ShieldAlert,
      title: 'Aviso Legal Importante',
      content: (
        <div className="space-y-4">
          <p><span className="font-bold">MedicAI NO es un médico.</span> La información proporcionada por este asistente tiene fines puramente informativos y de orientación general.</p>
          <p className="opacity-70">Nunca debe reemplazar el consejo, diagnóstico o tratamiento médico profesional. Si crees que tienes una emergencia médica, llama a los servicios de emergencia de inmediato o acude al hospital más cercano.</p>
        </div>
      ),
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    }
  ];

  return (
    <div className={`flex-1 p-8 md:p-12 animate-in fade-in duration-700 ${isDark ? 'text-white' : 'text-slate-800'}`}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-16">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Sobre <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">MedicAI</span>
          </h1>
          <p className={`text-xl font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
            Tu asistente de salud impulsado por IA
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-[2rem] border transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${isDark
                ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05] shadow-xl shadow-black/20'
                : 'bg-white border-slate-100 shadow-xl'
                }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${card.bgColor}`}>
                <card.icon className={card.color} size={28} />
              </div>
              <h2 className="text-2xl font-bold mb-6">{card.title}</h2>
              <div className={`text-[15px] leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                {card.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NosotrosPage;

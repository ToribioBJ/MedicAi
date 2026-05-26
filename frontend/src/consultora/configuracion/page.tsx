import { useTheme } from '../../context/ThemeContext';
import type { ThemeMode, FontSize } from '../../context/ThemeContext';
import { Palette, Monitor, Type, Check, Sun, Moon, Laptop, RotateCcw, LayoutGrid } from 'lucide-react';

// ─── Colores disponibles ──────────────────────────────────────────────────────
const ACCENT_COLORS = [
  { name: 'Azul Médico', value: '#2563eb', bg: 'bg-blue-600' },
  { name: 'Verde Salud', value: '#16a34a', bg: 'bg-green-600' },
  { name: 'Violeta', value: '#7c3aed', bg: 'bg-violet-600' },
  { name: 'Cian', value: '#0891b2', bg: 'bg-cyan-600' },
  { name: 'Rosa', value: '#db2777', bg: 'bg-pink-600' },
  { name: 'Naranja', value: '#ea580c', bg: 'bg-orange-600' },
  { name: 'Índigo', value: '#4f46e5', bg: 'bg-indigo-600' },
  { name: 'Esmeralda', value: '#059669', bg: 'bg-emerald-600' },
];

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${checked ? 'focus:ring-blue-500' : 'bg-gray-200 focus:ring-gray-300'
        }`}
      style={checked ? { backgroundColor: 'var(--color-accent)' } : {}}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'
          }`}
      />
    </button>
  );
}

// ─── Card de sección ──────────────────────────────────────────────────────────
function Card({ title, icon: Icon, children }: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
}) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-2xl shadow-sm border overflow-hidden mb-6 transition-all duration-300 ${isDark ? 'bg-[#0E1320]/60 border-white/5 hover:border-white/10' : 'bg-white border-gray-100 hover:border-gray-200'
      }`}>
      <div className={`flex items-center gap-3 px-6 py-4 border-b transition-colors duration-300 ${isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50/40'
        }`}>
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}>
          <Icon size={16} style={{ color: 'var(--color-accent)' }} />
        </div>
        <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{title}</h3>
      </div>
      <div className="px-6 pb-2">{children}</div>
    </div>
  );
}

// ─── Fila de ajuste ───────────────────────────────────────────────────────────
function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <div className={`flex items-center justify-between py-4 border-b last:border-0 transition-colors duration-300 ${isDark ? 'border-white/5' : 'border-gray-100'
      }`}>
      <div className="flex-1 min-w-0 pr-4">
        <p className={`text-sm font-semibold ${isDark ? 'text-white/90' : 'text-gray-800'}`}>{label}</p>
        {description && <p className={`text-xs mt-0.5 font-medium ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const {
    accentColor, setAccentColor,
    themeMode, setThemeMode,
    fontSize, setFontSize,
    compactMode, setCompactMode,
    animations, setAnimations,
    isDark,
  } = useTheme();

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 animate-in fade-in duration-500">
      {/* Botón de reinicio superior */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            setAccentColor('#2563eb');
            setThemeMode('light');
            setFontSize('base');
            setCompactMode(false);
            setAnimations(true);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-[1.02] shadow-sm ${
            isDark 
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' 
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
          title="Restablecer todos los valores predeterminados"
        >
          <RotateCcw size={14} />
          <span>Restablecer Ajustes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Ajustes */}
        <div className="lg:col-span-2 space-y-2">
          
          {/* ── Color de acento ─────────────────────────────────────────── */}
          <Card title="Color de Acento" icon={Palette}>
            <div className="py-4">
              <p className={`text-xs mb-4 font-medium ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                Define el color principal para botones, enlaces y estados destacados.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ACCENT_COLORS.map(color => (
                  <button
                    key={color.value}
                    id={`color-${color.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setAccentColor(color.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.03] ${
                      accentColor === color.value
                        ? 'bg-[var(--color-accent)]/5 shadow-sm font-semibold'
                        : isDark
                          ? 'border-white/5 bg-white/5 hover:border-white/20'
                          : 'border-gray-100 bg-white hover:border-gray-300'
                    }`}
                    style={accentColor === color.value ? { borderColor: color.value } : {}}
                  >
                    <span className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center shadow-md`}>
                      {accentColor === color.value && <Check size={14} className="text-white" />}
                    </span>
                    <span className={`text-[10px] font-bold text-center leading-tight ${
                      accentColor === color.value 
                        ? isDark ? 'text-white' : 'text-gray-900'
                        : isDark ? 'text-white/60' : 'text-gray-600'
                    }`}>
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* ── Modo de tema ────────────────────────────────────────────── */}
          <Card title="Modo de Tema" icon={Monitor}>
            <div className="py-4">
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: 'light' as ThemeMode, label: 'Claro', Icon: Sun },
                  { id: 'dark' as ThemeMode, label: 'Oscuro', Icon: Moon },
                  { id: 'system' as ThemeMode, label: 'Sistema', Icon: Laptop },
                ]).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    id={`theme-${id}`}
                    onClick={() => setThemeMode(id)}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                      themeMode === id
                        ? 'shadow-md font-semibold'
                        : isDark
                          ? 'border-white/5 bg-white/5 hover:border-white/25'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                    style={themeMode === id ? { borderColor: accentColor, backgroundColor: `color-mix(in srgb, ${accentColor} 8%, transparent)` } : {}}
                  >
                    <Icon size={20} className={themeMode === id ? '' : isDark ? 'text-white/60' : 'text-gray-600'} style={themeMode === id ? { color: accentColor } : {}} />
                    <span className={`text-xs font-bold ${
                      themeMode === id
                        ? isDark ? 'text-white' : 'text-gray-900'
                        : isDark ? 'text-white/70' : 'text-gray-700'
                    }`}>{label}</span>
                    {themeMode === id && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* ── Tipografía y layout ──────────────────────────────────────── */}
          <Card title="Tipografía y Diseño" icon={Type}>
            <Row label="Tamaño de fuente" description="Ajusta el tamaño del texto en toda la interfaz de la aplicación">
              <div className={`flex gap-1 p-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                {([
                  { id: 'sm' as FontSize, label: 'Pequeño', textClass: 'text-xs px-2.5 py-1' },
                  { id: 'base' as FontSize, label: 'Mediano', textClass: 'text-sm px-3 py-1' },
                  { id: 'lg' as FontSize, label: 'Grande', textClass: 'text-base px-3 py-1' },
                ]).map(({ id, label, textClass }) => (
                  <button
                    key={id}
                    id={`fontsize-${id}`}
                    onClick={() => setFontSize(id)}
                    className={`rounded-md font-bold transition-all ${textClass} ${
                      fontSize === id
                        ? isDark
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'bg-white shadow-sm text-gray-900'
                        : isDark
                          ? 'text-white/50 hover:text-white/80'
                          : 'text-gray-500 hover:text-gray-800'
                    }`}
                    style={fontSize === id ? { color: accentColor } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Row>

            <Row label="Modo compacto" description="Reduce el espaciado interno para maximizar el área de visualización">
              <Toggle id="toggle-compact" checked={compactMode} onChange={setCompactMode} />
            </Row>
          </Card>

          {/* ── Rendimiento y Efectos ───────────────────────────────────── */}
          <Card title="Rendimiento y Efectos" icon={LayoutGrid}>
            <Row label="Animaciones del sistema" description="Habilita efectos de desplazamiento y transiciones en la plataforma">
              <Toggle id="toggle-animations" checked={animations} onChange={setAnimations} />
            </Row>
          </Card>

        </div>

        {/* Vista Previa en tiempo real */}
        <div className="lg:col-span-1">
          <div className={`rounded-2xl border p-4 shadow-lg transition-all duration-300 lg:sticky lg:top-28 ${
            isDark ? 'bg-[#0E1320]/60 border-white/5' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${
              isDark ? 'text-white/50' : 'text-slate-500'
            }`}>
              <Monitor size={14} style={{ color: accentColor }} />
              Vista Previa en Vivo
            </h3>
            
            {/* Mock Chat Window */}
            <div className={`rounded-xl border overflow-hidden shadow-sm transition-colors duration-300 ${
              isDark ? 'bg-[#0B0F19] border-white/5' : 'bg-slate-50 border-gray-200'
            }`}>
              {/* Header */}
              <div className={`px-3 py-2 border-b flex items-center justify-between ${
                isDark ? 'bg-[#0E1320]/80 border-white/5' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
                  <span className="w-2 h-2 rounded-full absolute" style={{ backgroundColor: accentColor }} />
                  <span className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>MedicAI Chat</span>
                </div>
                <span className="text-[9px] opacity-50">En línea</span>
              </div>

              {/* Messages */}
              <div className={`p-3 space-y-3 transition-all ${compactMode ? 'space-y-1.5 p-2' : ''}`}>
                {/* User message */}
                <div className="flex justify-end">
                  <div 
                    className={`rounded-2xl px-3 py-1.5 max-w-[85%] text-white text-[12px] shadow-sm transition-all`}
                    style={{ 
                      backgroundColor: accentColor,
                      fontSize: fontSize === 'sm' ? '11px' : fontSize === 'base' ? '12px' : '14px',
                      padding: compactMode ? '4px 8px' : '6px 12px'
                    }}
                  >
                    ¿Qué síntomas produce la deshidratación?
                  </div>
                </div>

                {/* Assistant message */}
                <div className="flex justify-start">
                  <div 
                    className={`rounded-2xl px-3 py-2 max-w-[85%] text-[12px] leading-relaxed transition-all ${
                      isDark ? 'bg-white/5 text-slate-200 border border-white/5' : 'bg-white text-slate-700 border border-gray-100'
                    }`}
                    style={{ 
                      fontSize: fontSize === 'sm' ? '11px' : fontSize === 'base' ? '12px' : '14px',
                      padding: compactMode ? '4px 8px' : '8px 12px'
                    }}
                  >
                    Boca seca, sed intensa, cansancio y orina de color oscuro.
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className={`p-2 border-t flex gap-1.5 ${
                isDark ? 'bg-[#0E1320]/40 border-white/5' : 'bg-white border-gray-200'
              }`}>
                <div className={`flex-1 px-3 py-1.5 rounded-lg text-[10px] border ${
                  isDark ? 'bg-[#0B0F19]/50 border-white/5 text-white/40' : 'bg-slate-50 border-gray-200 text-slate-400'
                }`}>
                  Escribe tu consulta...
                </div>
                <div 
                  className="p-1.5 rounded-lg flex items-center justify-center text-white cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: accentColor }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 rounded-xl border bg-slate-50/50 dark:bg-white/5 border-dashed border-slate-200 dark:border-white/10 text-center">
              <span className={`text-[10px] font-bold ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                Cambia los ajustes para ver cómo se actualiza la interfaz
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

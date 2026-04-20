import { useTheme } from '../../context/ThemeContext';
import type { ThemeMode, FontSize } from '../../context/ThemeContext';
import { Palette, Monitor, Type, Globe, Check, Sun, Moon, Laptop } from 'lucide-react';

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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${checked ? 'bg-[--color-accent] focus:ring-blue-500' : 'bg-gray-200 focus:ring-gray-300'
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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-2xl shadow-sm border overflow-hidden mb-5 transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'
      }`}>
      <div className={`flex items-center gap-3 px-6 py-4 border-b transition-colors duration-300 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50/60'
        }`}>
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}>
          <Icon size={16} style={{ color: 'var(--color-accent)' }} />
        </div>
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{title}</h3>
      </div>
      <div className="px-6">{children}</div>
    </div>
  );
}

// ─── Fila de ajuste ───────────────────────────────────────────────────────────
function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <div className={`flex items-center justify-between py-4 border-b last:border-0 transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-gray-100'
      }`}>
      <div className="flex-1 min-w-0 pr-4">
        <p className={`text-sm font-medium ${isDark ? 'text-white/90' : 'text-gray-800'}`}>{label}</p>
        {description && <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{description}</p>}
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
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0B0F19]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`border-b px-8 py-5 sticky top-0 z-10 shadow-sm transition-colors duration-300 ${isDark ? 'bg-[#0E1320] border-white/10' : 'bg-white border-gray-100'
        }`}>
        <div className="max-w-2xl mx-auto">
          <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Configuración
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
            Personaliza la apariencia de MedicAI
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-8">

        {/* ── Color de acento ─────────────────────────────────────────── */}
        <Card title="Color de Acento" icon={Palette}>
          <div className="py-5">
            <p className={`text-xs mb-4 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              Define el color principal de botones, enlaces y elementos activos.
            </p>
            <div className="grid grid-cols-4 gap-3">
              {ACCENT_COLORS.map(color => (
                <button
                  key={color.value}
                  id={`color-${color.name.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setAccentColor(color.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${accentColor === color.value
                    ? 'border-[var(--color-accent)] shadow-md'
                    : isDark
                      ? 'border-white/10 hover:border-white/30'
                      : 'border-gray-100 hover:border-gray-300'
                    }`}
                  style={accentColor === color.value ? { borderColor: color.value } : {}}
                >
                  <span className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center shadow-sm`}>
                    {accentColor === color.value && <Check size={14} className="text-white" />}
                  </span>
                  <span className={`text-[10px] font-medium text-center leading-tight ${isDark ? 'text-white/60' : 'text-gray-600'
                    }`}>
                    {color.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className={`mt-5 p-4 rounded-xl border transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'
              }`}>
              <p className={`text-xs font-medium mb-3 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                Vista previa
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  id="preview-btn-primary"
                  className="px-4 py-2 text-sm text-white rounded-lg font-medium shadow-sm transition-all hover:opacity-90"
                  style={{ backgroundColor: accentColor }}
                >
                  Botón Principal
                </button>
                <button
                  id="preview-btn-secondary"
                  className={`px-4 py-2 text-sm rounded-lg font-medium border transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                    }`}
                  style={{ color: accentColor, borderColor: accentColor }}
                >
                  Secundario
                </button>
                <span
                  className="text-sm font-medium cursor-pointer hover:underline"
                  style={{ color: accentColor }}
                >
                  Enlace activo
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Modo de tema ────────────────────────────────────────────── */}
        <Card title="Modo de Tema" icon={Monitor}>
          <div className="py-5">
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
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${themeMode === id
                    ? 'shadow-md'
                    : isDark
                      ? 'border-white/10 hover:border-white/20'
                      : 'border-gray-100 hover:border-gray-200'
                    }`}
                  style={themeMode === id ? { borderColor: accentColor, backgroundColor: `color-mix(in srgb, ${accentColor} 8%, transparent)` } : {}}
                >
                  <Icon size={22} className={isDark ? 'text-white/70' : 'text-gray-600'} />
                  <span className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{label}</span>
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
          <Row label="Tamaño de fuente" description="Ajusta el tamaño del texto en toda la app">
            <div className={`flex gap-1 p-1 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
              {([
                { id: 'sm' as FontSize, label: 'A', textClass: 'text-xs' },
                { id: 'base' as FontSize, label: 'A', textClass: 'text-sm' },
                { id: 'lg' as FontSize, label: 'A', textClass: 'text-lg' },
              ]).map(({ id, label, textClass }) => (
                <button
                  key={id}
                  id={`fontsize-${id}`}
                  onClick={() => setFontSize(id)}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${textClass} ${fontSize === id
                    ? isDark
                      ? 'bg-white/15 text-white shadow-sm'
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

          <Row label="Modo compacto" description="Reduce el espaciado para ver más contenido">
            <Toggle id="toggle-compact" checked={compactMode} onChange={setCompactMode} />
          </Row>

          <Row label="Animaciones" description="Activa o desactiva las transiciones de la interfaz">
            <Toggle id="toggle-animaciones" checked={animations} onChange={setAnimations} />
          </Row>
        </Card>

        {/* ── Idioma / región ──────────────────────────────────────────── */}
        <Card title="Idioma y Región" icon={Globe}>
          <Row label="Idioma de la interfaz" description="Selecciona tu idioma preferido">
            <select
              id="select-idioma"
              className={`text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 transition-colors ${isDark
                ? 'bg-white/10 border-white/20 text-white focus:ring-white/20'
                : 'bg-white border-gray-200 text-gray-700 focus:ring-blue-200'
                }`}
            >
              <option value="es">🇵🇪 Español</option>
              <option value="en">🇺🇸 English</option>
              <option value="pt">🇧🇷 Português</option>
            </select>
          </Row>

          <Row label="Formato de fecha">
            <select
              id="select-fecha"
              className={`text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 transition-colors ${isDark
                ? 'bg-white/10 border-white/20 text-white focus:ring-white/20'
                : 'bg-white border-gray-200 text-gray-700 focus:ring-blue-200'
                }`}
            >
              <option value="dmy">DD/MM/YYYY</option>
              <option value="mdy">MM/DD/YYYY</option>
              <option value="ymd">YYYY-MM-DD</option>
            </select>
          </Row>
        </Card>

      </div>
    </div>
  );
}

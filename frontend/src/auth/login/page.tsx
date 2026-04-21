import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

import logoMedicAI from '../../img/logo-medica.png';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error('Credenciales incorrectas');
      }

      const data = await response.json();

      login(data.access_token, {
        id: data.user_id,
        nombre: data.nombre,
        email: email
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden font-sans bg-[#F4F7FB]">

      {/* Premium Background Mesh Gradient */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-blue-100/40 to-cyan-100/40 blur-[120px] mix-blend-multiply opacity-70 animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-indigo-100/40 to-blue-200/40 blur-[130px] mix-blend-multiply opacity-70 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid Sutíl de fondo */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* Contenedor Izquierdo (Presentación y Logo) */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center items-center p-12 lg:p-24 border-r border-white/50">

        <div className="relative flex flex-col items-center max-w-lg text-center backdrop-blur-sm bg-white/30 p-12 rounded-[3rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="relative group">
            {/* Soft glow behind logo */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-700"></div>
            <img
              src={logoMedicAI}
              alt="MedicAI Logo"
              className="relative w-full max-w-[280px] object-contain drop-shadow-2xl transition-transform duration-700 hover:-translate-y-2"
            />
          </div>

          <h2 className="mt-12 text-3xl font-extrabold text-slate-800 tracking-tight">
            Inteligencia Médica Avanzada
          </h2>
          <p className="mt-4 text-slate-500 font-medium leading-relaxed">
            Sistema de triaje automatizado impulsado por IA
          </p>
        </div>
      </div>

      {/* Contenedor Derecho (El Formulario y Login) */}
      <div className="w-full lg:w-1/2 relative z-20 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24">

        <div className="w-full max-w-[440px]">
          {/* Header del móvil si se esconde la izquierda */}
          <div className="flex flex-col items-center lg:hidden mb-12">
            <img src={logoMedicAI} alt="MedicAI Logo" className="w-24 h-24 mb-4 drop-shadow-xl" />
            <h2 className="text-2xl font-extrabold text-slate-800">MedicAI</h2>
          </div>

          <div className="mb-10 text-left">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Bienvenido</h1>
            <p className="mt-2 text-slate-500 font-medium">Inicia sesión para gestionar tus pacientes o consultas</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Correo Electrónico</label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="doctor@medicai.com"
                    className="w-full bg-white text-slate-900 placeholder-slate-400 px-5 py-4 rounded-[1.25rem] text-[15px] outline-none border-2 border-slate-200 focus:border-blue-500 hover:border-slate-300 transition-colors shadow-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 mx-1">
                  <label className="block text-sm font-bold text-slate-700">Contraseña</label>
                  <Link to="#" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative flex items-center group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white text-slate-900 placeholder-slate-400 px-5 py-4 rounded-[1.25rem] text-[15px] outline-none border-2 border-slate-200 focus:border-blue-500 hover:border-slate-300 transition-colors shadow-sm font-medium"
                    style={{ letterSpacing: password && !showPassword ? '0.25em' : 'normal', paddingRight: '3.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 text-slate-400 hover:text-slate-600 transition p-1"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group mt-6 bg-slate-900 text-white py-4 px-6 rounded-[1.25rem] font-bold text-[16px] hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar a MedicAI
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Separador elegante */}
          <div className="mt-10 flex items-center gap-4">
            <div className="h-[2px] flex-1 bg-slate-100"></div>
            <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">O continúa con</span>
            <div className="h-[2px] flex-1 bg-slate-100"></div>
          </div>


          <div className="mt-10 text-center">
            <span className="text-slate-500 font-medium">¿Nuevo en MedicAI? </span>
            <Link to="/register" className="text-blue-600 font-extrabold hover:text-blue-700 transition underline-offset-4 hover:underline">
              Crea tu cuenta aquí
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;

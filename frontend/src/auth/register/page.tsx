import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

import logoMedicAI from '../../img/logo-medica.png';

export const RegisterPage = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/usuarios/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          nombre: nombre,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Email ya registrado o error al crear cuenta');
      }


      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden font-sans bg-[#F4F7FB]">
      

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-blue-100/40 to-cyan-100/40 blur-[120px] mix-blend-multiply opacity-70 animate-float" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-indigo-100/40 to-blue-200/40 blur-[130px] mix-blend-multiply opacity-70 animate-float" style={{animationDelay: '2s'}} />
      </div>


      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>


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
            Únete a la Revolución Médica
          </h2>
          <p className="mt-4 text-slate-500 font-medium leading-relaxed">
            Crea tu perfil y transforma la gestión clínica con nuestro asistente de IA integrado.
          </p>

          <div className="flex gap-4 mt-8">
            <div className="flex items-center gap-2 bg-white/70 px-4 py-2 rounded-full border border-white shadow-sm text-sm font-semibold text-slate-600">
               <ShieldCheck className="text-blue-500" size={18} /> Perfiles Seguros
            </div>
          </div>
        </div>
      </div>

      
      <div className="w-full lg:w-1/2 relative z-20 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24">
        
        <div className="w-full max-w-[440px]">
          {/* Header del móvil si se esconde la izquierda */}
          <div className="flex flex-col items-center lg:hidden mb-12">
            <img src={logoMedicAI} alt="MedicAI Logo" className="w-24 h-24 mb-4 drop-shadow-xl" />
            <h2 className="text-2xl font-extrabold text-slate-800">MedicAI</h2>
          </div>

          <div className="mb-10 text-left">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Crear Cuenta</h1>
            <p className="mt-2 text-slate-500 font-medium">Completa tus datos para registrarte</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Nombre Completo</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    placeholder="Dr. Juan Pérez"
                    className="w-full bg-white text-slate-900 placeholder-slate-400 px-5 py-4 rounded-[1.25rem] text-[15px] outline-none border-2 border-slate-200 focus:border-blue-500 hover:border-slate-300 transition-colors shadow-sm font-medium"
                  />
                </div>
              </div>

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
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Contraseña</label>
                <div className="relative flex items-center group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white text-slate-900 placeholder-slate-400 px-5 py-4 rounded-[1.25rem] text-[15px] outline-none border-2 border-slate-200 focus:border-blue-500 hover:border-slate-300 transition-colors shadow-sm font-medium"
                    style={{ letterSpacing: password && !showPassword ? '0.25em' : 'normal', paddingRight: '2.5rem' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition p-1"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full group mt-6 bg-blue-600 text-white py-4 px-6 rounded-[1.25rem] font-bold text-[16px] hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Crear Cuenta
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
             <span className="text-slate-500 font-medium">¿Ya tienes una cuenta? </span>
            <Link to="/login" className="text-blue-600 font-extrabold hover:text-blue-700 transition underline-offset-4 hover:underline">
               Inicia Sesión aquí
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

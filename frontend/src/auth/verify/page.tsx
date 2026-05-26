import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Shield } from 'lucide-react';
import logoMedicAI from '../../img/logo-medica.png';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const token = searchParams.get('token');

  useEffect(() => {
    const verificarToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Falta el token de verificación en la URL.');
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || '¡Tu cuenta ha sido verificada correctamente!');
        } else {
          setStatus('error');
          setMessage(data.detail || 'Ocurrió un error al verificar tu cuenta.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Error de conexión con el servidor. Inténtalo de nuevo más tarde.');
      }
    };

    verificarToken();
  }, [token]);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center font-sans bg-[#F4F7FB] p-6">
      
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-blue-100/40 to-cyan-100/40 blur-[120px] mix-blend-multiply opacity-70 animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-indigo-100/40 to-blue-200/40 blur-[130px] mix-blend-multiply opacity-70 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="w-full max-w-[500px] relative z-10">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={logoMedicAI} alt="MedicAI Logo" className="w-24 h-24 mb-3 drop-shadow-xl" />
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">MedicAI</h2>
        </div>

        {/* Card */}
        <div className="backdrop-blur-md bg-white/80 p-10 sm:p-12 rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] text-center transition-all">
          
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-6">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Verificando tu Correo</h1>
                <p className="mt-2 text-slate-500 font-medium">Por favor, espera un momento mientras validamos tu token...</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-55 animate-pulse"></div>
                <CheckCircle2 className="relative w-20 h-20 text-emerald-500 drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">¡Verificación Exitosa!</h1>
                <p className="mt-3 text-slate-600 font-medium px-4 leading-relaxed">{message}</p>
              </div>
              
              <Link 
                to="/login"
                className="w-full group mt-8 bg-blue-600 text-white py-4 px-6 rounded-[1.25rem] font-bold text-[16px] hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
              >
                Iniciar Sesión
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-rose-100 rounded-full blur-xl opacity-55"></div>
                <XCircle className="relative w-20 h-20 text-rose-500 drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">Error de Verificación</h1>
                <p className="mt-3 text-rose-600 font-medium px-4 leading-relaxed bg-rose-50/50 py-3 rounded-2xl border border-rose-100/50">{message}</p>
              </div>
              
              <Link 
                to="/register"
                className="w-full group mt-8 bg-slate-900 text-white py-4 px-6 rounded-[1.25rem] font-bold text-[16px] hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
              >
                Crear una Nueva Cuenta
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <div className="pt-4">
                <Link to="/login" className="text-sm font-bold text-blue-600 hover:underline">
                  Volver al Login
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="flex justify-center items-center gap-2 mt-8 text-xs font-semibold text-slate-400">
          <Shield size={14} /> Mediciones y perfiles protegidos con cifrado SSL
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;

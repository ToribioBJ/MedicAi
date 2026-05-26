import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import logoMedicAI from '../../img/logo-medica.png';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage(data.message || 'Se ha enviado un enlace de recuperación a tu correo electrónico.');
      } else {
        throw new Error(data.detail || 'No pudimos procesar tu solicitud.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center font-sans bg-[#F4F7FB] p-6">
      
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-blue-100/40 to-cyan-100/40 blur-[120px] mix-blend-multiply opacity-70 animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-indigo-100/40 to-blue-200/40 blur-[130px] mix-blend-multiply opacity-70 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="w-full max-w-[460px] relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <img src={logoMedicAI} alt="MedicAI Logo" className="w-20 h-20 mb-3 drop-shadow-xl" />
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">MedicAI</h2>
        </div>

        {/* Card */}
        <div className="backdrop-blur-md bg-white/80 p-8 sm:p-10 rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
          
          {!success ? (
            <>
              <div className="mb-8 text-left">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recuperar Contraseña</h1>
                <p className="mt-2 text-slate-500 font-medium text-sm leading-relaxed">
                  Introduce el correo electrónico asociado a tu cuenta. Te enviaremos un enlace de un solo uso para restablecer tu contraseña.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Correo Electrónico</label>
                  <div className="relative flex items-center group">
                    <Mail className="absolute left-4 text-slate-400 group-hover:text-blue-500 transition-colors" size={20} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="doctor@medicai.com"
                      className="w-full bg-white text-slate-900 placeholder-slate-400 pl-12 pr-5 py-4 rounded-[1.25rem] text-[15px] outline-none border-2 border-slate-200 focus:border-blue-500 hover:border-slate-300 transition-colors shadow-sm font-medium"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full group mt-6 bg-slate-900 text-white py-4 px-6 rounded-[1.25rem] font-bold text-[16px] hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <>
                      Enviar Enlace
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <CheckCircle2 className="relative w-20 h-20 text-blue-600 drop-shadow-md" />
              </div>
              
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">¡Enlace Enviado!</h1>
                <p className="mt-3 text-slate-600 font-medium text-[15px] leading-relaxed px-2">
                  {message}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 leading-relaxed max-w-sm">
                Asegúrate de revisar también tu carpeta de <strong>Spam</strong> o <strong>Correos no deseados</strong> si no ves el mensaje en tu bandeja de entrada en los próximos minutos.
              </div>

              <Link 
                to="/login"
                className="w-full group bg-slate-900 text-white py-4 px-6 rounded-[1.25rem] font-bold text-[16px] hover:bg-slate-800 transition-colors flex items-center justify-center gap-3"
              >
                Volver al Inicio de Sesión
              </Link>
            </div>
          )}

          {/* Return link */}
          {!success && (
            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition">
                <ArrowLeft size={16} /> Volver al Inicio de Sesión
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Loader2, Check } from 'lucide-react';
import logoMedicAI from '../../img/logo-medica.png';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');

  // Criterios de contraseña segura
  const criteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordSecure = Object.values(criteria).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Falta el token de recuperación en la URL.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!isPasswordSecure) {
      setError('La contraseña debe cumplir con todos los criterios de seguridad.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        throw new Error(data.detail || 'Ocurrió un error al restablecer la contraseña.');
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
        <div className="flex flex-col items-center mb-6">
          <img src={logoMedicAI} alt="MedicAI Logo" className="w-20 h-20 mb-3 drop-shadow-xl" />
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">MedicAI</h2>
        </div>

        {/* Card */}
        <div className="backdrop-blur-md bg-white/80 p-8 sm:p-10 rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] transition-all">
          
          {!success ? (
            <>
              <div className="mb-6 text-left">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Nueva Contraseña</h1>
                <p className="mt-2 text-slate-500 font-medium text-sm leading-relaxed">
                  Establece una nueva contraseña de seguridad para tu cuenta.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Contraseña */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Contraseña</label>
                  <div className="relative flex items-center group">
                    <KeyRound className="absolute left-4 text-slate-400 group-hover:text-blue-500 transition-colors" size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-white text-slate-900 placeholder-slate-400 pl-12 pr-12 py-4 rounded-[1.25rem] text-[15px] outline-none border-2 border-slate-200 focus:border-blue-500 hover:border-slate-300 transition-colors shadow-sm font-medium"
                      style={{ letterSpacing: password && !showPassword ? '0.25em' : 'normal' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 transition p-1"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Confirmar Contraseña</label>
                  <div className="relative flex items-center group">
                    <KeyRound className="absolute left-4 text-slate-400 group-hover:text-blue-500 transition-colors" size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-white text-slate-900 placeholder-slate-400 pl-12 pr-12 py-4 rounded-[1.25rem] text-[15px] outline-none border-2 border-slate-200 focus:border-blue-500 hover:border-slate-300 transition-colors shadow-sm font-medium"
                      style={{ letterSpacing: confirmPassword && !showPassword ? '0.25em' : 'normal' }}
                    />
                  </div>
                </div>

                {/* Criterios de validación visuales */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 space-y-2 mt-4">
                  <div className="text-[12px] font-bold text-slate-500 tracking-wider uppercase mb-1">Criterios de Contraseña Segura:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
                    <div className={`flex items-center gap-2 text-xs font-semibold ${criteria.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${criteria.length ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                        {criteria.length && <Check size={10} />}
                      </div>
                      Min. 8 caracteres
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-semibold ${criteria.upper ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${criteria.upper ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                        {criteria.upper && <Check size={10} />}
                      </div>
                      1 Letra mayúscula
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-semibold ${criteria.lower ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${criteria.lower ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                        {criteria.lower && <Check size={10} />}
                      </div>
                      1 Letra minúscula
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-semibold ${criteria.number ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${criteria.number ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                        {criteria.number && <Check size={10} />}
                      </div>
                      1 Número
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-semibold ${criteria.special ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${criteria.special ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                        {criteria.special && <Check size={10} />}
                      </div>
                      1 Carácter especial
                    </div>
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
                      Restablecer Contraseña
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <CheckCircle2 className="relative w-20 h-20 text-emerald-500 drop-shadow-md" />
              </div>
              
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">¡Contraseña Cambiada!</h1>
                <p className="mt-3 text-slate-600 font-medium text-[15px] leading-relaxed px-2">
                  Tu contraseña ha sido restablecida con éxito. A partir de ahora puedes iniciar sesión con tus nuevas credenciales.
                </p>
              </div>

              <button 
                onClick={() => navigate('/login')}
                className="w-full group bg-blue-600 text-white py-4 px-6 rounded-[1.25rem] font-bold text-[16px] hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
              >
                Ir a Iniciar Sesión
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

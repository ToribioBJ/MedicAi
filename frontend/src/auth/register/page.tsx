import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Loader2,
  Check, X, KeyRound, Mail, User, Clock, RefreshCw, Sparkles, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoMedicAI from '../../img/logo-medica.png';

export const RegisterPage = () => {
  // Datos del formulario de registro
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibilidad de contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estados de control
  const [loading, setLoading] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState('');
  
  // Errores de validación en tiempo real
  const [errors, setErrors] = useState({
    nombre: '',
    email: '',
    confirmPassword: ''
  });

  // Paso de verificación OTP
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  // Temporizadores para OTP (2 minutos = 120 segundos)
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const timerIntervalRef = useRef<any>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  // --- Criterios de la Contraseña ---
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const strengthPoints = Object.values(rules).filter(Boolean).length;
  
  const getStrengthLabel = () => {
    if (password.length === 0) return { label: 'Sin ingresar', color: 'bg-slate-200 dark:bg-white/10', text: 'text-slate-400' };
    if (strengthPoints <= 2) return { label: 'Débil', color: 'bg-rose-500', text: 'text-rose-500' };
    if (strengthPoints <= 4) return { label: 'Media', color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Fuerte', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const strength = getStrengthLabel();

  // --- Validaciones en Tiempo Real ---
  useEffect(() => {
    // Validar Nombre
    if (nombre && nombre.trim().length < 3) {
      setErrors(prev => ({ ...prev, nombre: 'El nombre debe tener al menos 3 caracteres.' }));
    } else if (nombre && /\d/.test(nombre)) {
      setErrors(prev => ({ ...prev, nombre: 'El nombre no debe contener números.' }));
    } else {
      setErrors(prev => ({ ...prev, nombre: '' }));
    }
  }, [nombre]);

  useEffect(() => {
    // Validar Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Ingresa un formato de correo válido.' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  }, [email]);

  useEffect(() => {
    // Validar Coincidencia de Contraseñas
    if (confirmPassword && password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden.' }));
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  }, [password, confirmPassword]);

  // --- Manejo del Temporizador OTP ---
  useEffect(() => {
    if (step === 'verify') {
      setTimer(120);
      setCanResend(false);
      
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Comprobar si el formulario tiene errores o está incompleto
  const isFormInvalid = 
    !nombre || 
    !email || 
    !password || 
    !confirmPassword || 
    errors.nombre !== '' || 
    errors.email !== '' || 
    errors.confirmPassword !== '' || 
    strengthPoints < 5;

  // --- Registro de Cuenta ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormInvalid || loading) return;

    setLoading(true);
    setErrorGlobal('');

    try {
      const response = await fetch('http://localhost:8000/api/usuarios/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          nombre: nombre.trim(),
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear la cuenta. Revisa los datos.');
      }

      setStep('verify');
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // --- Verificación de Código OTP ---
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || verifying) return;

    setVerifying(true);
    setErrorGlobal('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Código de verificación incorrecto o expirado.');
      }

      const data = await response.json();

      // Guardar sesión e iniciar sesión automáticamente
      login(data.access_token, {
        id: data.user_id,
        nombre: data.nombre,
        email: data.email,
        role: data.role
      });

      if (data.role === 'administrador') {
        navigate('/admin');
      } else {
        navigate('/chatbot');
      }
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al verificar el código.');
    } finally {
      setVerifying(false);
    }
  };

  // --- Reenvío de Código OTP ---
  const handleResendCode = async () => {
    if (!canResend || resendLoading) return;

    setResendLoading(true);
    setErrorGlobal('');
    setResendSuccess(false);

    try {
      const response = await fetch('http://localhost:8000/api/auth/resend-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'No se pudo reenviar el código.');
      }

      // Feedback de éxito y reiniciar timer
      setResendSuccess(true);
      setTimer(120);
      setCanResend(false);
      
      // Reiniciar intervalo de cuenta regresiva
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Desvanecer el mensaje de éxito después de 5 segundos
      setTimeout(() => setResendSuccess(false), 5000);

    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al reenviar el código de verificación.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden font-sans bg-[#F4F7FB] dark:bg-[#0B0F19]">
      
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-blue-100/40 to-cyan-100/40 dark:from-blue-900/10 dark:to-cyan-900/10 blur-[120px] mix-blend-multiply opacity-70 animate-float" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-indigo-100/40 to-blue-200/40 dark:from-indigo-900/10 dark:to-blue-900/10 blur-[130px] mix-blend-multiply opacity-70 animate-float" style={{animationDelay: '2s'}} />
      </div>

      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* Left panel (Estética Premium) */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center items-center p-12 lg:p-24 border-r border-slate-200/50 dark:border-white/5 bg-white/10 dark:bg-black/10 backdrop-blur-sm">
        <div className="relative flex flex-col items-center max-w-lg text-center backdrop-blur-md bg-white/40 dark:bg-white/[0.02] p-12 rounded-[3rem] border border-white/80 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-700"></div>
            <img 
              src={logoMedicAI} 
              alt="MedicAI Logo" 
              className="relative w-full max-w-[240px] object-contain drop-shadow-2xl transition-transform duration-700 hover:-translate-y-2" 
            />
          </div>
          
          <h2 className="mt-10 text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">
            Gestión Inteligente de Salud
          </h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Regístrate para realizar consultas inteligentes, evaluar diagnósticos preliminares visuales y automatizar el triaje mediante inteligencia artificial.
          </p>

          <div className="flex gap-4 mt-8">
            <div className="flex items-center gap-2 bg-white/80 dark:bg-white/5 px-4 py-2 rounded-full border border-white dark:border-white/5 shadow-sm text-xs font-bold text-slate-600 dark:text-slate-300">
               <ShieldCheck className="text-blue-500" size={16} /> Verificado y Cifrado
            </div>
            <div className="flex items-center gap-2 bg-white/80 dark:bg-white/5 px-4 py-2 rounded-full border border-white dark:border-white/5 shadow-sm text-xs font-bold text-slate-600 dark:text-slate-300">
               <Sparkles className="text-amber-500" size={16} /> Powered by Groq AI
            </div>
          </div>
        </div>
      </div>

      {/* Right panel (Formulario de Registro / Verificación) */}
      <div className="w-full lg:w-1/2 relative z-20 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 overflow-y-auto">
        <div className="w-full max-w-[460px] my-auto">
          
          {/* Logo móvil */}
          <div className="flex flex-col items-center lg:hidden mb-8">
            <img src={logoMedicAI} alt="MedicAI Logo" className="w-20 h-20 mb-3 drop-shadow-xl animate-float" />
            <h2 className="text-xl font-black text-slate-800 dark:text-white">MedicAI</h2>
          </div>

          {step === 'register' ? (
            <>
              <div className="mb-8 text-left animate-in fade-in slide-in-from-top-4 duration-500">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Crear Cuenta</h1>
                <p className="mt-2 text-slate-500 dark:text-slate-400 font-semibold text-[15px]">Completa tus datos profesionales para unirte</p>
              </div>

              {errorGlobal && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center gap-3 text-rose-600 dark:text-rose-400 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">{errorGlobal}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Nombre */}
                <div>
                  <label className="block text-[13px] font-black text-slate-700 dark:text-slate-300 mb-1.5 ml-1 uppercase tracking-wider">Nombre Completo</label>
                  <div className="relative flex items-center">
                    <User className="absolute left-4 text-slate-400 pointer-events-none" size={18} />
                    <input 
                      type="text" 
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                      placeholder="Dr. Juan Pérez"
                      className={`w-full bg-white dark:bg-[#0E1320] text-slate-900 dark:text-white placeholder-slate-400/80 px-11 py-4 rounded-[1.25rem] text-[15px] outline-none border-2 transition-all shadow-sm font-bold ${
                        errors.nombre 
                          ? 'border-rose-500 focus:border-rose-500' 
                          : nombre 
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : 'border-slate-200 dark:border-white/5 focus:border-blue-500 hover:border-slate-300 dark:hover:border-white/10'
                      }`}
                    />
                  </div>
                  {errors.nombre && <p className="text-xs text-rose-500 font-bold mt-1.5 ml-2 animate-in fade-in">{errors.nombre}</p>}
                </div>

                {/* Correo */}
                <div>
                  <label className="block text-[13px] font-black text-slate-700 dark:text-slate-300 mb-1.5 ml-1 uppercase tracking-wider">Correo Electrónico</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 text-slate-400 pointer-events-none" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="doctor@medicai.com"
                      className={`w-full bg-white dark:bg-[#0E1320] text-slate-900 dark:text-white placeholder-slate-400/80 px-11 py-4 rounded-[1.25rem] text-[15px] outline-none border-2 transition-all shadow-sm font-bold ${
                        errors.email 
                          ? 'border-rose-500 focus:border-rose-500' 
                          : email 
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : 'border-slate-200 dark:border-white/5 focus:border-blue-500 hover:border-slate-300 dark:hover:border-white/10'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-rose-500 font-bold mt-1.5 ml-2 animate-in fade-in">{errors.email}</p>}
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-[13px] font-black text-slate-700 dark:text-slate-300 mb-1.5 ml-1 uppercase tracking-wider">Contraseña</label>
                  <div className="relative flex items-center group">
                    <KeyRound className="absolute left-4 text-slate-400 pointer-events-none" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className={`w-full bg-white dark:bg-[#0E1320] text-slate-900 dark:text-white placeholder-slate-400/80 pl-11 pr-12 py-4 rounded-[1.25rem] text-[15px] outline-none border-2 transition-all shadow-sm font-bold ${
                        password 
                          ? (strengthPoints < 5 ? 'border-rose-400 focus:border-rose-400' : 'border-emerald-500 focus:border-emerald-500')
                          : 'border-slate-200 dark:border-white/5 focus:border-blue-500 hover:border-slate-300 dark:hover:border-white/10'
                      }`}
                      style={{ letterSpacing: password && !showPassword ? '0.25em' : 'normal' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition p-1"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>

                  {/* Indicador de Fuerza de Contraseña */}
                  {password.length > 0 && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Seguridad de la contraseña:</span>
                        <span className={`text-xs font-black ${strength.text}`}>{strength.label}</span>
                      </div>
                      
                      {/* Barra de progreso */}
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden flex gap-0.5">
                        <div className={`h-full rounded-full transition-all duration-500 ${strength.color}`} style={{ width: `${(strengthPoints / 5) * 100}%` }} />
                      </div>

                      {/* Lista de reglas */}
                      <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1">
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold ${rules.length ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {rules.length ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />} Mín. 8 caracteres
                        </span>
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold ${rules.uppercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {rules.uppercase ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />} Mayúsculas (A-Z)
                        </span>
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold ${rules.lowercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {rules.lowercase ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />} Minúsculas (a-z)
                        </span>
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold ${rules.number ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {rules.number ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />} Un número (0-9)
                        </span>
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold ${rules.special ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {rules.special ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />} Símbolo (!@#$%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label className="block text-[13px] font-black text-slate-700 dark:text-slate-300 mb-1.5 ml-1 uppercase tracking-wider">Confirmar Contraseña</label>
                  <div className="relative flex items-center group">
                    <KeyRound className="absolute left-4 text-slate-400 pointer-events-none" size={18} />
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className={`w-full bg-white dark:bg-[#0E1320] text-slate-900 dark:text-white placeholder-slate-400/80 pl-11 pr-12 py-4 rounded-[1.25rem] text-[15px] outline-none border-2 transition-all shadow-sm font-bold ${
                        errors.confirmPassword 
                          ? 'border-rose-500 focus:border-rose-500' 
                          : confirmPassword 
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : 'border-slate-200 dark:border-white/5 focus:border-blue-500 hover:border-slate-300 dark:hover:border-white/10'
                      }`}
                      style={{ letterSpacing: confirmPassword && !showConfirmPassword ? '0.25em' : 'normal' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition p-1"
                    >
                      {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-rose-500 font-bold mt-1.5 ml-2 animate-in fade-in">{errors.confirmPassword}</p>}
                </div>

                <button 
                  type="submit" 
                  disabled={loading || isFormInvalid}
                  className={`w-full group mt-6 py-4 px-6 rounded-[1.25rem] font-bold text-[16px] transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden shadow-lg ${
                    isFormInvalid || loading
                      ? 'bg-slate-300 dark:bg-white/5 text-slate-500 dark:text-white/20 cursor-not-allowed shadow-none border border-transparent'
                      : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <>
                      Crear Cuenta Profesional
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center border-t border-slate-200/50 dark:border-white/5 pt-6">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">¿Ya tienes una cuenta? </span>
                <Link to="/login" className="text-blue-600 dark:text-blue-400 font-extrabold hover:text-blue-700 dark:hover:text-blue-300 transition underline-offset-4 hover:underline text-sm ml-1">
                  Inicia Sesión
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Pantalla OTP Premium */}
              <div className="mb-8 text-left animate-in fade-in slide-in-from-top-4 duration-500">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Verificación</h1>
                <p className="mt-3 text-slate-500 dark:text-slate-400 font-semibold leading-relaxed text-[15px]">
                  Enviamos un código OTP a tu correo <strong className="text-slate-800 dark:text-slate-200">{email}</strong>. Por favor, ingrésalo a continuación.
                </p>
              </div>

              {errorGlobal && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center gap-3 text-rose-600 dark:text-rose-400 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">{errorGlobal}</p>
                </div>
              )}

              {resendSuccess && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">¡El código de verificación ha sido reenviado correctamente!</p>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <label className="text-[13px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Código OTP</label>
                    <span className="flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-full">
                      <Clock size={12} className="animate-pulse" /> Expira en: {formatTime(timer)}
                    </span>
                  </div>
                  
                  <input 
                    type="text" 
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="123456"
                    className="w-full bg-white dark:bg-[#0E1320] text-slate-900 dark:text-white text-center placeholder-slate-300 dark:placeholder-white/10 py-4 rounded-[1.5rem] text-[32px] font-black tracking-[10px] outline-none border-2 border-slate-200 dark:border-white/5 focus:border-blue-500 hover:border-slate-300 dark:hover:border-white/10 transition-colors shadow-sm"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={code.length < 6 || verifying}
                  className={`w-full group py-4 px-6 rounded-[1.25rem] font-bold text-[16px] transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden shadow-lg ${
                    code.length < 6 || verifying
                      ? 'bg-slate-300 dark:bg-white/5 text-slate-500 dark:text-white/20 cursor-not-allowed shadow-none'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white/95 hover:shadow-xl active:scale-[0.98]'
                  }`}
                >
                  {verifying ? (
                    <Loader2 className="w-5 h-5 text-white dark:text-slate-900 animate-spin" />
                  ) : (
                    <>
                      Verificar y Acceder
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Botón Reenviar Código */}
              <div className="mt-8 text-center border-t border-slate-200/50 dark:border-white/5 pt-6 flex flex-col items-center gap-3 animate-in fade-in duration-700">
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  ¿No recibiste el código?
                  {canResend ? (
                    <button 
                      onClick={handleResendCode}
                      disabled={resendLoading}
                      className="text-blue-600 dark:text-blue-400 font-extrabold hover:text-blue-700 dark:hover:text-blue-300 transition hover:underline ml-1.5 inline-flex items-center gap-1"
                    >
                      {resendLoading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <RefreshCw size={12} />
                      )}
                      Reenviar código
                    </button>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 font-bold ml-1.5">
                      Reenviar en <strong className="font-extrabold">{timer}s</strong>
                    </span>
                  )}
                </div>

                <button 
                  onClick={() => setStep('register')}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition mt-2"
                >
                  ← Volver al formulario de registro
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

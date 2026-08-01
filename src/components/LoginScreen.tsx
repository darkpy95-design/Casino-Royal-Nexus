import React, { useState } from 'react';
import { Lock, User, KeyRound, AlertCircle } from 'lucide-react';
import logoImg from '../assets/logo.png';

interface LoginScreenProps {
  onLoginSuccess: (user: { id: string; role: 'admin' | 'client'; balance: number }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, overrideId?: string, overridePass?: string) => {
    if (e) e.preventDefault();
    const finalId = overrideId || userId;
    const finalPass = overridePass || password;

    if (!finalId.trim() || !finalPass.trim()) {
      setErrorMsg('Por favor ingresa tu ID y Contraseña');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: finalId.trim(), password: finalPass.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Credenciales incorrectas');
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data.user);
    } catch {
      setErrorMsg('Error de conexión con el servidor del casino');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100 relative overflow-hidden">
      {/* Full-screen Casino Background Wallpaper */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img 
          src={logoImg} 
          alt="Royal Nexus Casino Background" 
          className="w-full h-full object-cover opacity-15 filter blur-[3px] scale-105" 
        />
        <div className="absolute inset-0 bg-slate-950/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-slate-950/95" />
      </div>

      {/* Container Box */}
      <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Casino Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <img 
            src={logoImg} 
            alt="Royal Nexus Casino Logo" 
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain mx-auto mb-2 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)] rounded-2xl" 
          />
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 uppercase font-mono tracking-wider">
            ROYAL NEXUS CASINO
          </h1>
          <p className="text-xs text-slate-400 uppercase font-mono tracking-widest">
            Acceso a Plataforma VIP
          </p>
        </div>

        {/* Form */}
        <form onSubmit={e => handleLogin(e)} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl flex items-center gap-2.5 text-xs text-red-300 animate-fade-in font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> ID de Usuario
            </label>
            <div className="relative">
              <input
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="Ingresa tu ID"
                className="w-full bg-slate-950/80 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-base sm:text-sm font-mono focus:outline-none transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full bg-slate-950/80 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-base sm:text-sm font-mono focus:outline-none transition-colors"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 uppercase font-mono tracking-wider text-sm transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="animate-spin text-lg">⏳</span>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Ingresar al Casino
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <p className="text-[11px] font-mono text-slate-400 text-center mt-6">
        ROYAL NEXUS CASINO &copy; {new Date().getFullYear()} — Plataforma VIP de Puntos Virtuales
      </p>
    </div>
  );
};

import React from 'react';
import { Volume2, VolumeX, ArrowLeft, Shield, LogOut, HelpCircle } from 'lucide-react';
import { soundEngine } from '../audio';

interface HeaderBarProps {
  user?: { id: string; role: 'admin' | 'client'; balance: number };
  balance: number;
  jackpotPool: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenRules?: () => void;
  onReturnToLobby: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  user,
  balance,
  jackpotPool,
  isMuted,
  onToggleMute,
  onOpenRules,
  onReturnToLobby,
  onOpenAdmin,
  onLogout,
}) => {
  return (
    <header className="w-full bg-slate-900/95 border-b border-amber-500/30 px-2 py-1.5 shrink-0 z-30 shadow-md font-sans">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-1.5">
        
        {/* Lobby Navigation & Game Title */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onReturnToLobby();
            }}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg border border-amber-500/30 text-[10px] font-mono uppercase transition-colors"
            title="Volver a la Sala de Juegos"
          >
            <ArrowLeft className="w-3 h-3" /> Lobby
          </button>

          <div className="leading-tight">
            <h1 className="text-xs font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 font-mono">
              FRUIT KING 3
            </h1>
            <span className="text-[9px] text-amber-400/80 font-mono block">
              POZO: {jackpotPool.toLocaleString()}
            </span>
          </div>
        </div>

        {/* User Balance */}
        <div className="flex items-center gap-1">
          <div className="bg-slate-950 border border-emerald-500/40 rounded-lg px-2.5 py-1 flex items-center gap-1">
            <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono">PTS:</span>
            <span className="text-xs font-black font-mono text-emerald-300 tracking-wider">
              {balance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenRules && (
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onOpenRules();
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-lg border border-cyan-500/30 text-[10px] font-mono uppercase transition-colors flex items-center gap-1 active:scale-95"
              title="Información y Reglas de Juego"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> INFO
            </button>
          )}

          {user?.role === 'admin' && onOpenAdmin && (
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onOpenAdmin();
              }}
              className="p-1.5 bg-purple-950 text-purple-300 rounded-lg border border-purple-500/40 active:scale-95"
              title="Panel Admin"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              onToggleMute();
              soundEngine.playButtonClick();
            }}
            className="p-1.5 bg-slate-800 text-slate-200 rounded-lg border border-slate-700 active:scale-95"
            title="Sonido On/Off"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          <button
            onClick={onLogout}
            className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 rounded-lg border border-slate-700 hover:border-red-500/40 active:scale-95 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};

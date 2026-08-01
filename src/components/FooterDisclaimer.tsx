import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const FooterDisclaimer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-amber-500/20 py-1 px-2 text-center shrink-0">
      <div className="max-w-md mx-auto flex items-center justify-center gap-1.5 text-[9px] sm:text-[10px] text-slate-400 font-mono">
        <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
        <span className="truncate">
          Juego Arcade Virtual • Puntos 100% Sin Dinero Real
        </span>
      </div>
    </footer>
  );
};

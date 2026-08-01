import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, HelpCircle, Zap, ShieldAlert, Award, Flame, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../audio';
import { GameInfoModal } from './GameInfoModal';

export interface BalloonGameProps {
  user: { id: string; role: 'admin' | 'client'; balance: number };
  onReturnToLobby: () => void;
  onBalanceUpdated: () => void;
}

const BALLOON_BET_PRESETS = [200, 400, 600, 800, 1000, 1200];

export const BalloonGame: React.FC<BalloonGameProps> = ({
  user,
  onReturnToLobby,
  onBalanceUpdated,
}) => {
  const [selectedBet, setSelectedBet] = useState<number>(200);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [crashMultiplier, setCrashMultiplier] = useState<number>(1.50);
  const [isPopped, setIsPopped] = useState<boolean>(false);
  const [isCashedOut, setIsCashedOut] = useState<boolean>(false);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Selecciona tu apuesta (200 - 1.200 PTS) e inicia el Globo.');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const multRef = useRef<number>(1.00);
  const crashRef = useRef<number>(1.50);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start Balloon Round
  const handleStartRound = async () => {
    if (selectedBet < 200 || selectedBet > 1200) {
      setMessage('La apuesta debe ser entre 200 y 1.200 PTS');
      return;
    }
    if (user.balance < selectedBet) {
      setMessage('Saldo de puntos insuficiente');
      return;
    }

    try {
      const res = await fetch('/api/balloon/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, bet: selectedBet }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || 'Error al iniciar el globo');
        return;
      }

      setIsPlaying(true);
      setIsPopped(false);
      setIsCashedOut(false);
      setWinAmount(0);
      setCurrentMultiplier(1.00);
      multRef.current = 1.00;
      setCrashMultiplier(data.crashMultiplier);
      crashRef.current = data.crashMultiplier;

      setMessage('🎈 ¡Globo inflando! Retira antes de que explote.');
      onBalanceUpdated();
      soundEngine.playPumpAir(0.9);

      // Start tick timer
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        multRef.current += 0.02;
        const formatted = Number(multRef.current.toFixed(2));
        setCurrentMultiplier(formatted);

        // Check crash point
        if (formatted >= crashRef.current) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleBalloonPop(crashRef.current);
        } else {
          // Play subtle pitch ascending pump sound
          soundEngine.playPumpAir(Math.min(2.0, 0.9 + (formatted - 1) * 0.3));
        }
      }, 70);

    } catch {
      setMessage('Error de conexión con el servidor');
    }
  };

  // Handle Balloon Explosion (Crash)
  const handleBalloonPop = async (finalMult: number) => {
    setIsPlaying(false);
    setIsPopped(true);
    setCurrentMultiplier(finalMult);
    soundEngine.playBalloonPop();
    setMessage(`💥 ¡EL GLOBO EXPLOTÓ EN ${finalMult.toFixed(2)}x! Perdiste ${selectedBet.toLocaleString('es-ES')} PTS.`);

    try {
      await fetch('/api/balloon/pop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      onBalanceUpdated();
    } catch {
      // Fallback
    }
  };

  // Handle Player Cashout / Retiro
  const handleCashout = async () => {
    if (!isPlaying || isPopped || isCashedOut) return;

    if (timerRef.current) clearInterval(timerRef.current);
    const claimMult = Number(multRef.current.toFixed(2));
    const calculatedWin = Math.floor(selectedBet * claimMult);

    // Instant local cashout feedback
    setIsPlaying(false);
    setIsCashedOut(true);
    setWinAmount(calculatedWin);

    soundEngine.playWin();
    soundEngine.playCoinCollect();
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    setMessage(`🎉 ¡RETIRO EXITOSO DE ${calculatedWin.toLocaleString('es-ES')} PTS (${claimMult.toFixed(2)}x)!`);

    try {
      const res = await fetch('/api/balloon/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, multiplier: claimMult }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.winAmount !== undefined) {
          setWinAmount(data.winAmount);
        }
        onBalanceUpdated();
      } else {
        setMessage(data.error || 'Error al procesar el retiro');
      }
    } catch {
      onBalanceUpdated();
    }
  };

  // Calculate Balloon Visual Scale (grows smooth from 1.00x)
  const balloonScale = Math.min(2.2, 0.85 + (currentMultiplier - 1.0) * 0.45);
  const potentialPayout = Math.floor(selectedBet * currentMultiplier);

  return (
    <div className="min-h-dvh max-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col justify-between font-sans overflow-hidden select-none relative">
      
      {/* Background Cyber Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e1b4b_0%,#020617_100%)] opacity-85 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-600/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-5xl mx-auto px-3 py-2.5 flex items-center justify-between z-20 shrink-0">
        <button
          onClick={onReturnToLobby}
          disabled={isPlaying}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-rose-400 rounded-xl transition-all border border-rose-500/30 shadow-lg disabled:opacity-40 flex items-center gap-1 font-mono text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> LOBBY
        </button>

        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-400 flex items-center justify-center text-lg font-black shadow-lg shadow-rose-500/30">
            🎈
          </div>
          <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-red-500 font-mono text-sm sm:text-base tracking-wider uppercase drop-shadow">
            GLOBO MULTIPLICADOR
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowRules(true)}
            className="p-2 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 rounded-xl transition-all border border-cyan-500/30 font-mono text-xs font-bold flex items-center gap-1"
            title="Información del Juego"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> <span>INFO</span>
          </button>

          <div className="px-2.5 py-1.5 bg-slate-900/90 border border-emerald-500/40 rounded-xl font-mono text-xs sm:text-sm font-black text-emerald-300 shadow-inner">
            {user.balance.toLocaleString('es-ES')} PTS
          </div>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 py-2 flex flex-col items-center justify-evenly relative z-10 overflow-hidden">
        
        {/* Multiplier Display & Potential Payout Header */}
        <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/30 rounded-2xl p-2.5 text-center shadow-xl font-mono shrink-0 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-amber-400" /> MULTIPLICADOR</span>
            <span className="text-amber-300 font-bold">GANANCIA POTENCIAL</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-2xl sm:text-3xl font-black ${isPopped ? 'text-red-500' : isCashedOut ? 'text-emerald-400' : 'text-amber-300'}`}>
              {currentMultiplier.toFixed(2)}x
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-300">
              {potentialPayout.toLocaleString('es-ES')} PTS
            </span>
          </div>
        </div>

        {/* Central Balloon Inflation Canvas */}
        <div className="relative w-full max-w-xs sm:max-w-md h-[210px] sm:h-[270px] flex items-center justify-center my-2 shrink-0">
          
          {/* Pulsing Danger Aura */}
          <div className={`absolute w-52 h-52 sm:w-72 sm:h-72 rounded-full border-2 border-dashed transition-colors duration-300 pointer-events-none flex items-center justify-center ${
            isPlaying && currentMultiplier > 2.0 ? 'border-red-500/80 animate-ping' : 'border-rose-500/20'
          }`} />

          <AnimatePresence mode="wait">
            {isPopped ? (
              /* EXPLOSION RESULT */
              <motion.div
                key="pop"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center z-30 text-center space-y-2"
              >
                <div className="text-8xl filter drop-shadow-[0_0_35px_rgba(239,68,68,1)] animate-bounce">
                  💥
                </div>
                <div className="bg-slate-900/95 border-2 border-red-500/80 p-3.5 rounded-2xl shadow-2xl font-mono">
                  <ShieldAlert className="w-7 h-7 text-red-500 mx-auto mb-1 animate-pulse" />
                  <h3 className="text-base font-black text-red-400 uppercase">¡EXPLOTÓ EN {currentMultiplier.toFixed(2)}x!</h3>
                  <p className="text-xs font-bold text-slate-300 mt-0.5">
                    Perdiste {selectedBet.toLocaleString('es-ES')} PTS
                  </p>
                </div>
              </motion.div>
            ) : isCashedOut ? (
              /* CASHOUT RESULT */
              <motion.div
                key="cashout"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center z-30 text-center space-y-2"
              >
                <div className="text-7xl filter drop-shadow-[0_0_35px_rgba(52,211,153,1)]">
                  🎈 🏆
                </div>
                <div className="bg-slate-900/95 border-2 border-emerald-400 p-3.5 rounded-2xl shadow-2xl font-mono">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1 animate-bounce" />
                  <h3 className="text-base font-black text-emerald-300 uppercase">¡RETIRO EXITOSO!</h3>
                  <p className="text-2xl font-black text-amber-300 mt-0.5">
                    +{winAmount.toLocaleString('es-ES')} PTS
                  </p>
                  <span className="text-[10px] text-emerald-400 font-bold">MULTIPLICADOR {currentMultiplier.toFixed(2)}x</span>
                </div>
              </motion.div>
            ) : (
              /* INFLATING BALLOON */
              <motion.div
                key="balloon"
                animate={{
                  scale: balloonScale,
                  rotate: isPlaying ? [-2, 2, 0] : 0,
                }}
                transition={{
                  duration: isPlaying ? 0.3 : 0.5,
                  repeat: isPlaying ? Infinity : 0,
                  ease: 'easeInOut',
                }}
                className="relative flex flex-col items-center justify-center"
              >
                {/* 3D Glossy Red/Gold Metallic Balloon */}
                <div className="w-28 h-36 sm:w-36 sm:h-44 rounded-[50%_50%_50%_50%/40%_40%_60%_60%] bg-gradient-to-tr from-red-950 via-rose-600 to-amber-300 shadow-[inset_-8px_-8px_16px_rgba(0,0,0,0.8),0_8px_24px_rgba(225,29,72,0.6)] relative flex items-center justify-center">
                  
                  {/* Glossy Top Reflection Highlight */}
                  <div className="absolute top-3 left-4 w-7 h-10 bg-white/40 rounded-full blur-[2px] -rotate-45" />

                  {/* Multiplier Live Label inside Balloon */}
                  <div className="flex flex-col items-center justify-center text-center z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    <span className="font-black font-mono text-yellow-300 text-xl sm:text-2xl tracking-tight">
                      {currentMultiplier.toFixed(2)}x
                    </span>
                    <span className="text-[9px] font-mono text-slate-200 font-bold uppercase mt-0.5">
                      {isPlaying ? '¡INFANDO!' : 'LISTO'}
                    </span>
                  </div>
                </div>

                {/* Balloon Knot & String */}
                <div className="w-4 h-2.5 bg-red-700 rounded-b-md shadow-md -mt-1" />
                <div className="w-0.5 h-10 bg-gradient-to-b from-slate-400 to-transparent shadow" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Message Banner */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-xl p-2 text-center font-mono text-xs font-bold text-amber-300 shadow-inner flex items-center justify-center shrink-0">
          {message}
        </div>

      </main>

      {/* Control Footer */}
      <footer className="w-full bg-slate-900 border-t border-rose-500/40 p-3 sm:p-4 z-20 shrink-0">
        <div className="max-w-xl mx-auto flex flex-col items-center justify-between gap-2.5">
          
          {/* Bet Preset Selector (200 - 1200 PTS) */}
          <div className="flex flex-col items-center gap-1 w-full">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
              Monto de Apuesta (200 - 1.200 PTS):
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full justify-center pb-1">
              {BALLOON_BET_PRESETS.map(val => (
                <button
                  key={val}
                  onClick={() => setSelectedBet(val)}
                  disabled={isPlaying}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black transition-all border shrink-0 ${
                    selectedBet === val
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 border-white shadow-lg'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-rose-500/50'
                  }`}
                >
                  {val.toLocaleString()} PTS
                </button>
              ))}
            </div>
          </div>

          {/* Action Button: Start vs Cashout */}
          <div className="w-full">
            {!isPlaying ? (
              <button
                onClick={handleStartRound}
                disabled={user.balance < selectedBet}
                className="w-full py-4 bg-gradient-to-r from-rose-500 via-red-600 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black font-mono uppercase text-sm sm:text-base rounded-2xl shadow-xl shadow-rose-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>INICIAR GLOBO ({selectedBet.toLocaleString('es-ES')} PTS)</span>
              </button>
            ) : (
              <button
                onClick={handleCashout}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black font-mono uppercase text-base sm:text-lg rounded-2xl shadow-2xl shadow-emerald-500/40 transition-all active:scale-95 border-2 border-yellow-300 animate-pulse flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-6 h-6 fill-current" />
                <span>RETIRAR / COBRAR ({potentialPayout.toLocaleString('es-ES')} PTS)</span>
              </button>
            )}
          </div>

        </div>
      </footer>

      {/* Game Info Modal */}
      <GameInfoModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        gameId="balloon"
      />

    </div>
  );
};

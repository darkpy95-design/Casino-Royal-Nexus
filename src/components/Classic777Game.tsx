import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Volume2, VolumeX, Sparkles, HelpCircle, RefreshCw, Zap, Trophy, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../audio';
import { GameInfoModal } from './GameInfoModal';

export interface Classic777GameProps {
  user: { id: string; role: 'admin' | 'client'; balance: number };
  onReturnToLobby: () => void;
  onBalanceUpdated: () => void;
}

const BET_PRESETS = [200, 500, 1000, 2500, 5000, 10000];

const SYMBOL_LOOKUP: Record<string, { name: string; color: string; bg: string; render: () => React.ReactNode }> = {
  RED7: {
    name: 'RED 7',
    color: '#ef4444',
    bg: 'from-red-600 via-rose-500 to-red-700',
    render: () => (
      <div className="relative flex items-center justify-center font-black text-5xl sm:text-7xl font-sans tracking-tighter text-red-500 drop-shadow-[0_4px_12px_rgba(239,68,68,0.9)] select-none">
        <span className="bg-gradient-to-b from-rose-300 via-red-500 to-red-700 bg-clip-text text-transparent filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] stroke-white stroke-2">
          7
        </span>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div className="w-12 h-12 bg-orange-400 rounded-full blur-md animate-pulse" />
        </div>
      </div>
    ),
  },
  WILD7: {
    name: 'WILD 777',
    color: '#eab308',
    bg: 'from-yellow-400 via-amber-500 to-yellow-600',
    render: () => (
      <div className="flex flex-col items-center justify-center select-none">
        <span className="font-black text-2xl sm:text-3xl tracking-tighter bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 bg-clip-text text-transparent filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.9)]">
          777
        </span>
        <span className="bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded uppercase tracking-widest">
          WILD
        </span>
      </div>
    ),
  },
  BAR3: {
    name: '3x BAR',
    color: '#ffffff',
    bg: 'from-slate-800 to-red-950',
    render: () => (
      <div className="w-24 sm:w-28 py-1.5 bg-gradient-to-r from-red-800 via-red-600 to-red-800 border-2 border-white rounded-md flex flex-col items-center justify-center shadow-lg select-none">
        <span className="font-black text-white text-xs sm:text-sm font-mono tracking-widest drop-shadow">BAR</span>
        <span className="font-black text-white text-xs sm:text-sm font-mono tracking-widest drop-shadow -mt-1">BAR</span>
        <span className="font-black text-white text-xs sm:text-sm font-mono tracking-widest drop-shadow -mt-1">BAR</span>
      </div>
    ),
  },
  BAR2: {
    name: '2x BAR',
    color: '#ffffff',
    bg: 'from-slate-800 to-red-950',
    render: () => (
      <div className="w-24 sm:w-28 py-2 bg-gradient-to-r from-red-800 via-red-600 to-red-800 border-2 border-white rounded-md flex flex-col items-center justify-center shadow-lg select-none">
        <span className="font-black text-white text-sm sm:text-base font-mono tracking-widest drop-shadow">BAR</span>
        <span className="font-black text-white text-sm sm:text-base font-mono tracking-widest drop-shadow -mt-1">BAR</span>
      </div>
    ),
  },
  BAR1: {
    name: 'BAR',
    color: '#ffffff',
    bg: 'from-slate-800 to-red-950',
    render: () => (
      <div className="w-24 sm:w-28 py-2.5 bg-gradient-to-r from-red-900 via-red-600 to-red-900 border-2 border-white rounded-md flex items-center justify-center shadow-lg select-none">
        <span className="font-black text-white text-base sm:text-xl font-mono tracking-widest drop-shadow">BAR</span>
      </div>
    ),
  },
  BELL: {
    name: 'BELL',
    color: '#eab308',
    bg: 'from-yellow-500 to-amber-700',
    render: () => (
      <div className="text-4xl sm:text-5xl filter drop-shadow-[0_4px_10px_rgba(234,179,8,0.8)] select-none">
        🔔
      </div>
    ),
  },
  CHERRY: {
    name: 'CHERRY',
    color: '#f43f5e',
    bg: 'from-rose-500 to-red-700',
    render: () => (
      <div className="text-4xl sm:text-5xl filter drop-shadow-[0_4px_10px_rgba(244,63,94,0.8)] select-none">
        🍒
      </div>
    ),
  },
  DIAMOND: {
    name: 'DIAMOND',
    color: '#06b6d4',
    bg: 'from-cyan-500 to-blue-700',
    render: () => (
      <div className="text-4xl sm:text-5xl filter drop-shadow-[0_4px_10px_rgba(6,182,212,0.8)] select-none">
        💎
      </div>
    ),
  },
};

const STRIP_SEQUENCE = [
  'RED7', 'BAR1', 'BELL', 'BAR2', 'CHERRY', 'BAR3', 'DIAMOND', 'WILD7',
  'RED7', 'BAR1', 'CHERRY', 'BAR2', 'BELL', 'BAR3', 'DIAMOND'
];

// Long extended sequence for smooth continuous rolling strip loop
const EXTENDED_ROLLING_STRIP = [
  ...STRIP_SEQUENCE,
  ...STRIP_SEQUENCE,
  ...STRIP_SEQUENCE,
];

interface MechanicalReelProps {
  isSpinning: boolean;
  symbols: [string, string, string]; // [top, payline, bottom]
  columnIndex: number;
}

const MechanicalReelColumn: React.FC<MechanicalReelProps> = ({ isSpinning, symbols, columnIndex }) => {
  return (
    <div className="relative bg-gradient-to-b from-slate-950 via-[#0a1128] to-slate-950 border-2 border-blue-500/50 rounded-2xl overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] h-[240px] sm:h-[300px] flex flex-col justify-between select-none">
      
      {/* 3D Cylindrical Reel Top & Bottom Shadow Gradients */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black via-black/80 to-transparent z-20 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black via-black/80 to-transparent z-20 pointer-events-none" />
      
      {/* Glossy Reel Cylinder Glass Highlight Streak */}
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-white/15 to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-white/15 to-transparent z-20 pointer-events-none" />

      {/* Reel Spinning State vs Landed State */}
      {isSpinning ? (
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
          {/* Continuous High-Speed Rolling Strip Animation */}
          <motion.div
            animate={{ y: [0, -1200] }}
            transition={{
              repeat: Infinity,
              duration: 0.3,
              ease: 'linear',
            }}
            className="flex flex-col items-center absolute top-0 w-full filter blur-[1px]"
          >
            {EXTENDED_ROLLING_STRIP.map((symKey, idx) => (
              <div
                key={idx}
                className="h-[80px] sm:h-[100px] w-full flex items-center justify-center opacity-80 shrink-0 border-b border-blue-900/10"
              >
                {SYMBOL_LOOKUP[symKey]?.render()}
              </div>
            ))}
          </motion.div>
        </div>
      ) : (
        <motion.div
          key={`${symbols[0]}-${symbols[1]}-${symbols[2]}`}
          initial={{ y: -35 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 22 }}
          className="w-full h-full flex flex-col justify-between py-1 relative z-10"
        >
          {/* Top Row Symbol (-1 Notch Offset) */}
          <div className="h-[72px] sm:h-[90px] flex items-center justify-center opacity-35 scale-85 filter contrast-75 transition-all">
            {SYMBOL_LOOKUP[symbols[0]]?.render()}
          </div>

          {/* Middle Row Symbol (PAYLINE CENTER - HIGH CONTRAST) */}
          <div className="h-[88px] sm:h-[108px] flex items-center justify-center relative scale-105 z-10 drop-shadow-[0_0_15px_rgba(37,99,235,0.6)]">
            {SYMBOL_LOOKUP[symbols[1]]?.render()}
          </div>

          {/* Bottom Row Symbol (+1 Notch Offset) */}
          <div className="h-[72px] sm:h-[90px] flex items-center justify-center opacity-35 scale-85 filter contrast-75 transition-all">
            {SYMBOL_LOOKUP[symbols[2]]?.render()}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export const Classic777Game: React.FC<Classic777GameProps> = ({
  user,
  onReturnToLobby,
  onBalanceUpdated,
}) => {
  const [betInput, setBetInput] = useState<number>(200);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [autoSpin, setAutoSpin] = useState<boolean>(false);
  const [autoCount, setAutoCount] = useState<number>(0);

  // Grid state: 3 rows x 3 columns
  const [grid, setGrid] = useState<string[][]>([
    ['RED7', 'RED7', 'RED7'],
    ['BAR1', 'BAR1', 'BAR1'],
    ['BELL', 'BELL', 'BELL'],
  ]);

  const [reelSpinning, setReelSpinning] = useState<boolean[]>([false, false, false]);
  const [lastWin, setLastWin] = useState<{ amount: number; type: string } | null>(null);
  const [isNearMissTeaser, setIsNearMissTeaser] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('¡Inserta tu apuesta (Mín 200 PTS) y presiona GIRAR!');

  // Handle Spin Request
  const handleSpin = async () => {
    if (isSpinning) return;
    if (betInput < 200) {
      setMessage('La apuesta mínima es de 200 PTS');
      return;
    }
    if (user.balance < betInput) {
      setMessage('Saldo de puntos insuficiente');
      setAutoSpin(false);
      return;
    }

    setIsSpinning(true);
    setLastWin(null);
    setIsNearMissTeaser(false);
    setReelSpinning([true, true, true]);
    soundEngine.playSpinStart();

    try {
      const res = await fetch('/api/classic777/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, bet: betInput }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || 'Error al realizar el giro');
        setIsSpinning(false);
        setReelSpinning([false, false, false]);
        setAutoSpin(false);
        return;
      }

      const targetGrid = data.grid as string[][]; // [top, payline, bottom]
      const winAmount = data.winAmount as number;
      const winType = data.winType as string;
      const nearMiss = data.isNearMiss as boolean;

      // Reel 1 Stops at 700ms
      setTimeout(() => {
        setReelSpinning(prev => [false, true, true]);
        soundEngine.playReelStop();
        setGrid(prev => [
          [targetGrid[0][0], prev[0][1], prev[0][2]],
          [targetGrid[1][0], prev[1][1], prev[1][2]],
          [targetGrid[2][0], prev[2][1], prev[2][2]],
        ]);
      }, 700);

      // Reel 2 Stops at 1300ms
      setTimeout(() => {
        setReelSpinning(prev => [false, false, true]);
        soundEngine.playReelStop();
        setGrid(prev => [
          [targetGrid[0][0], targetGrid[0][1], prev[0][2]],
          [targetGrid[1][0], targetGrid[1][1], prev[1][2]],
          [targetGrid[2][0], targetGrid[2][1], prev[2][2]],
        ]);

        if (nearMiss) {
          setIsNearMissTeaser(true);
          soundEngine.playNearMissTeaser();
        }
      }, 1300);

      // Reel 3 Stops at 2200ms (or 3000ms if near miss teaser)
      const finalStopDelay = nearMiss ? 2800 : 2000;

      setTimeout(() => {
        setReelSpinning([false, false, false]);
        setIsNearMissTeaser(false);
        soundEngine.playReelStop();
        setGrid(targetGrid);

        if (winAmount > 0) {
          setLastWin({ amount: winAmount, type: winType });
          setMessage(`🎉 ¡PREMIO! Ganaste ${winAmount.toLocaleString('es-ES')} PTS (${winType})`);
          soundEngine.playWin();
          if (winAmount >= betInput * 10) {
            confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
          }
        } else if (nearMiss) {
          setMessage('😱 ¡CASI! ¡Por un milímetro no cayó el TRIPLE 7! Vuelve a intentar...');
        } else {
          setMessage('Sigue intentando... ¡El gran Jackpot 777 está cerca!');
        }

        onBalanceUpdated();
        setIsSpinning(false);

        // Auto spin handle
        if (autoSpin) {
          if (autoCount > 1 && user.balance >= betInput) {
            setAutoCount(prev => prev - 1);
            setTimeout(() => handleSpin(), 1000);
          } else {
            setAutoSpin(false);
            setAutoCount(0);
          }
        }
      }, finalStopDelay);

    } catch {
      setMessage('Error de conexión con el servidor');
      setIsSpinning(false);
      setReelSpinning([false, false, false]);
      setAutoSpin(false);
    }
  };

  return (
    <div className="min-h-dvh max-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-blue-500 selection:text-slate-950 overflow-hidden select-none relative">
      
      {/* Dynamic Cyber Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-950/80 to-transparent pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-5xl mx-auto px-2 sm:px-6 py-2 flex items-center justify-between gap-1.5 sm:gap-4 z-20 shrink-0">
        <button
          onClick={onReturnToLobby}
          disabled={isSpinning}
          className="px-2 py-1.5 sm:px-3 sm:py-2 bg-slate-900/90 hover:bg-slate-800 text-blue-400 rounded-xl transition-all border border-blue-500/30 shadow-lg disabled:opacity-40 flex items-center gap-1 font-mono text-[11px] sm:text-xs font-bold shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> <span className="uppercase">Lobby</span>
        </button>

        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-xs sm:text-lg font-black text-slate-950 shadow-md shrink-0">
            🎰
          </div>
          <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 font-mono text-xs sm:text-base tracking-wider uppercase drop-shadow truncate">
            CYBER 777
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setShowInfoModal(true)}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 rounded-xl transition-all border border-cyan-500/30 font-mono text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-md"
            title="Información y Reglas de Juego"
          >
            <HelpCircle className="w-3.5 h-3.5" /> <span className="hidden xs:inline">INFO</span>
          </button>

          <button
            onClick={() => setShowPaytable(true)}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-400 rounded-xl transition-all border border-amber-500/30 font-mono text-[10px] sm:text-xs font-bold flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" /> <span className="hidden xs:inline">TABLA</span>
          </button>

          <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-slate-900/95 border border-blue-500/50 rounded-xl font-mono text-xs sm:text-sm font-black text-cyan-300 shadow-inner whitespace-nowrap shrink-0">
            {user.balance.toLocaleString('es-ES')} <span className="text-[10px] text-cyan-400 font-bold">PTS</span>
          </div>
        </div>
      </header>

      {/* Main Arcade Machine Cabinet */}
      <main className="flex-1 max-w-4xl w-full mx-auto my-1 p-2 sm:p-4 flex flex-col justify-center items-center relative z-10">
        
        {/* Machine Bezel Frame */}
        <div className={`w-full max-w-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-blue-950 border-4 border-blue-600/80 rounded-3xl p-3 sm:p-6 shadow-[0_0_60px_rgba(37,99,235,0.4)] relative overflow-hidden transition-all duration-300 ${
          isNearMissTeaser ? 'ring-4 ring-amber-400 animate-pulse' : ''
        }`}>
          
          {/* Top Marquee Neon Header */}
          <div className="w-full bg-slate-950 border-2 border-blue-500/50 rounded-2xl py-2 px-4 mb-4 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>APUESTA MÍN: 200 PTS</span>
            </div>

            {/* Jackpot Display Marquee */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-black tracking-widest">JACKPOT MAX:</span>
              <span className="text-amber-300 font-mono font-black text-sm sm:text-base animate-pulse">500X</span>
            </div>
          </div>

          {/* Reel Display Glass Container */}
          <div className="relative w-full bg-slate-950 border-4 border-blue-700/60 rounded-2xl p-2 sm:p-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] overflow-hidden">
            
            {/* Payline Badge Indicator (Exact Replica from Image) */}
            <div className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-30 flex items-center">
              <div className="bg-gradient-to-r from-red-600 to-rose-700 border-2 border-white text-white font-mono font-black italic text-[10px] sm:text-xs px-2 py-1 rounded shadow-2xl flex items-center gap-1 animate-pulse">
                <span>Pay Line</span>
                <span className="text-amber-300">►</span>
              </div>
            </div>

            {/* Payline Beam Across Reels */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-red-500/70 shadow-[0_0_12px_rgba(239,68,68,1)] z-20 pointer-events-none" />

            {/* 3 Physical Curved Reels Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pl-16 sm:pl-20 pr-2 relative z-10">
              {[0, 1, 2].map(colIdx => (
                <MechanicalReelColumn
                  key={colIdx}
                  columnIndex={colIdx}
                  isSpinning={reelSpinning[colIdx]}
                  symbols={[grid[0][colIdx], grid[1][colIdx], grid[2][colIdx]]}
                />
              ))}
            </div>
          </div>

          {/* Status Message Display */}
          <div className="mt-4 w-full bg-slate-950/90 border border-blue-500/30 rounded-xl p-2.5 text-center font-mono text-xs sm:text-sm font-bold text-cyan-300 shadow-md min-h-[42px] flex items-center justify-center">
            {lastWin ? (
              <span className="text-amber-300 font-black text-sm sm:text-base animate-bounce">
                🎉 ¡GANASTE {lastWin.amount.toLocaleString()} PTS ({lastWin.type})! 🎉
              </span>
            ) : (
              message
            )}
          </div>

        </div>
      </main>

      {/* Control Panel Console Footer */}
      <footer className="w-full bg-slate-900 border-t border-blue-500/40 p-3 sm:p-4 z-20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Bet Selector & Quick Chips */}
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
              SELECCIONAR APUESTA (MÍN 200 PTS):
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {BET_PRESETS.map(val => (
                <button
                  key={val}
                  onClick={() => setBetInput(val)}
                  disabled={isSpinning}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black transition-all border ${
                    betInput === val
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 border-white shadow-lg'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-blue-500/50'
                  }`}
                >
                  {val >= 1000 ? `${val / 1000}k` : val} PTS
                </button>
              ))}
            </div>
          </div>

          {/* Main GIRAR Spin Button & Auto Spin */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                if (autoSpin) {
                  setAutoSpin(false);
                } else {
                  setAutoSpin(true);
                  setAutoCount(25);
                  handleSpin();
                }
              }}
              disabled={isSpinning && !autoSpin}
              className={`px-4 py-3.5 rounded-2xl font-mono text-xs font-black uppercase transition-all border ${
                autoSpin
                  ? 'bg-red-600 text-white border-red-400 animate-pulse'
                  : 'bg-slate-800 text-cyan-300 border-slate-700 hover:border-cyan-400'
              }`}
            >
              {autoSpin ? `AUTO (${autoCount})` : 'AUTO (25)'}
            </button>

            <button
              onClick={handleSpin}
              disabled={isSpinning || user.balance < betInput}
              className="flex-1 sm:w-48 py-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black font-mono uppercase text-base sm:text-lg rounded-2xl shadow-xl shadow-blue-500/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>{isSpinning ? 'GIRANDO...' : 'GIRAR'}</span>
            </button>
          </div>

        </div>
      </footer>

      {/* Paytable Modal */}
      {showPaytable && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-blue-500/50 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-cyan-300 text-lg flex items-center gap-2">
                🏆 TABLA DE PAGOS (CYBER 777)
              </h3>
              <button
                onClick={() => setShowPaytable(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>3x WILD 777</span>
                <span className="text-amber-400 font-black">500X</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>3x RED 7</span>
                <span className="text-red-400 font-black">150X</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>3x DIAMANTE</span>
                <span className="text-cyan-400 font-black">30X</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>3x TRIPLE BAR</span>
                <span className="text-slate-200 font-black">25X</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>3x DOBLE BAR</span>
                <span className="text-slate-200 font-black">15X</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>3x CAMPANA</span>
                <span className="text-yellow-400 font-black">12X</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>3x CEREZAS</span>
                <span className="text-rose-400 font-black">10X</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <span>3x BAR MIXTOS</span>
                <span className="text-slate-300 font-black">4X</span>
              </div>
            </div>

            <button
              onClick={() => setShowPaytable(false)}
              className="w-full py-3 bg-blue-500 text-slate-950 font-black rounded-xl uppercase text-xs hover:bg-blue-400 transition-colors"
            >
              CERRAR
            </button>
          </div>
        </div>
      )}

      {/* Game Info Modal */}
      <GameInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        gameId="classic777"
      />

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Zap, RefreshCw, Volume2, VolumeX, Sparkles, ChevronLeft, ChevronRight, Info, HelpCircle, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../audio';
import { OlympusSymbolSVG, ZeusMultiplierOrb, ZeusCharacter } from './OlympusSymbols';
import { GameInfoModal } from './GameInfoModal';

interface OlympusSlotGameProps {
  user: { id: string; balance: number };
  onReturnToLobby: () => void;
  onBalanceUpdated: () => void;
}

export type OlympusSymbol =
  | 'crown'
  | 'hourglass'
  | 'ring'
  | 'goblet'
  | 'red_gem'
  | 'purple_gem'
  | 'yellow_gem'
  | 'green_gem'
  | 'blue_gem'
  | 'scatter_zeus';

const BET_OPTIONS = [200, 500, 1000, 2000, 5000, 10000, 25000];

export const OlympusSlotGame: React.FC<OlympusSlotGameProps> = ({
  user,
  onReturnToLobby,
  onBalanceUpdated,
}) => {
  const [baseBet, setBaseBet] = useState<number>(200);
  const [isAnteBet, setIsAnteBet] = useState<boolean>(false);
  const [grid, setGrid] = useState<OlympusSymbol[]>(Array(30).fill('blue_gem'));
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winningSymbols, setWinningSymbols] = useState<string[]>([]);
  const [zeusOrbs, setZeusOrbs] = useState<Array<{ pos: number; val: number }>>([]);
  const [lastWin, setLastWin] = useState<number>(0);
  const [message, setMessage] = useState<string>('8+ SÍMBOLOS IGUALES PAGAN EN CUALQUIER POSICIÓN');
  const [isZeusStriking, setIsZeusStriking] = useState<boolean>(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState<number>(0);
  const [accumulatedMultiplier, setAccumulatedMultiplier] = useState<number>(1);
  const [showScatterPopup, setShowScatterPopup] = useState<boolean>(false);
  const [showBigWinPopup, setShowBigWinPopup] = useState<boolean>(false);
  const [bigWinAmount, setBigWinAmount] = useState<number>(0);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const totalCost = isAnteBet ? Math.round(baseBet * 1.25) : baseBet;

  // Keypress shortcut (Spacebar to spin)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpinning && !showScatterPopup && !showBigWinPopup && !showInfoModal) {
        e.preventDefault();
        handleSpin(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning, showScatterPopup, showBigWinPopup, showInfoModal, baseBet, isAnteBet, freeSpinsLeft, user.balance]);

  const handleSpin = async (isBuyBonus: boolean = false) => {
    if (isSpinning) return;
    const cost = isBuyBonus ? baseBet * 100 : (freeSpinsLeft > 0 ? 0 : totalCost);

    if (user.balance < cost && freeSpinsLeft === 0) {
      setMessage(`¡PUNTOS INSUFICIENTES! REQUIERE ${cost.toLocaleString()} PTS`);
      return;
    }

    setIsSpinning(true);
    setWinningSymbols([]);
    setZeusOrbs([]);
    setIsZeusStriking(false);
    setMessage('⚡ ¡INVOCANDO LOS RAYOS DE ZEUS! ⚡');

    soundEngine.playButtonClick();

    try {
      const res = await fetch('/api/olympus/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          baseBet,
          isAnteBet,
          isBuyBonus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || 'Error al conectar con el Olimpo');
        setIsSpinning(false);
        return;
      }

      // Symbol Grid Update
      const newGrid: OlympusSymbol[] = data.grid || Array(30).fill('blue_gem');
      setGrid(newGrid);

      // Check Scatter triggers
      const scatterCount = newGrid.filter(s => s === 'scatter_zeus').length;
      if (scatterCount >= 4 || isBuyBonus) {
        setShowScatterPopup(true);
        setFreeSpinsLeft(prev => prev + 15);
        soundEngine.playJackpot();
        confetti({ particleCount: 140, spread: 100, origin: { y: 0.5 } });
      }

      // Check Multipliers / Zeus strike
      if (data.zeusMultipliers && data.zeusMultipliers.length > 0) {
        setIsZeusStriking(true);
        setZeusOrbs(data.zeusMultipliers);
        soundEngine.playBonusShoot();

        const roundMultSum = data.zeusMultipliers.reduce((acc: number, item: { val: number }) => acc + item.val, 0);
        if (freeSpinsLeft > 0) {
          setAccumulatedMultiplier(prev => prev + roundMultSum);
        }
      }

      setTimeout(() => {
        setWinningSymbols(data.winningSymbols || []);
        setLastWin(data.totalWin);
        onBalanceUpdated();

        if (data.totalWin > 0) {
          soundEngine.playWin();

          if (data.totalWin >= baseBet * 10) {
            setBigWinAmount(data.totalWin);
            setShowBigWinPopup(true);
            confetti({ particleCount: 180, spread: 120, origin: { y: 0.5 } });
          }

          setMessage(`🎉 ¡VICTORIA EN EL OLIMPO! +${data.totalWin.toLocaleString()} PTS 🎉`);
        } else {
          setMessage('Siga intentando para invocar los multiplicadores de Zeus');
        }

        if (freeSpinsLeft > 0) {
          setFreeSpinsLeft(prev => Math.max(0, prev - 1));
        }

        setIsSpinning(false);
      }, 700);
    } catch {
      setMessage('Error de conexión');
      setIsSpinning(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-[#070a14] text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Background Divine Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950 via-slate-950 to-[#070a14] opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_rgba(56,189,248,0.18),transparent_70%)]" />
        
        {/* Floating Divine Sparkles */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-amber-300 rounded-full animate-ping opacity-75" />
        <div className="absolute top-20 right-20 w-3 h-3 bg-cyan-300 rounded-full animate-pulse opacity-80" />
        <div className="absolute bottom-30 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-60" />
      </div>

      {/* Lightning Flash Overlay when Zeus Strikes */}
      {isZeusStriking && (
        <div className="fixed inset-0 z-30 bg-cyan-400/20 pointer-events-none animate-ping" />
      )}

      {/* Free Spins Trigger Modal Popup */}
      {showScatterPopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-amber-600 via-amber-500 to-yellow-600 border-4 border-amber-200 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-[0_0_50px_rgba(245,158,11,0.8)]">
            <h2 className="text-3xl sm:text-4xl font-black font-mono text-slate-950 tracking-wider uppercase drop-shadow">
              ⚡ ¡15 TIRADAS GRATIS! ⚡
            </h2>
            <p className="text-slate-950 font-black font-mono text-xs sm:text-sm uppercase">
              ¡LOS MULTIPLICADORES DE ZEUS SE ACUMULAN DURANTE TODA LA BONIFICACIÓN!
            </p>
            <div className="text-6xl my-3 animate-bounce">🏛️ ⚡ 👑</div>
            <button
              onClick={() => setShowScatterPopup(false)}
              className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black font-mono rounded-2xl border-2 border-amber-300 uppercase text-sm tracking-widest shadow-2xl transition-transform active:scale-95"
            >
              ¡COMENZAR TIRADAS GRATIS!
            </button>
          </div>
        </div>
      )}

      {/* Big Win Celebration Modal Popup */}
      {showBigWinPopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-gradient-to-b from-yellow-500 via-amber-600 to-amber-900 border-4 border-yellow-300 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-[0_0_60px_rgba(250,204,21,0.9)]">
            <div className="text-2xl font-black font-mono text-yellow-200 tracking-widest uppercase animate-pulse">
              🏆 ¡GRAN VICTORIA DEL OLIMPO! 🏆
            </div>
            <div className="text-4xl sm:text-5xl font-black font-mono text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              +{bigWinAmount.toLocaleString()} PTS
            </div>
            <div className="text-5xl animate-bounce">⚡ 💰 ⚡</div>
            <button
              onClick={() => setShowBigWinPopup(false)}
              className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 text-yellow-300 font-black font-mono rounded-2xl border-2 border-yellow-300 uppercase text-sm tracking-widest shadow-xl transition-transform active:scale-95"
            >
              ¡CONTINUAR JUGANDO!
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-slate-900/90 border-b border-amber-500/40 px-3 py-2.5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md shadow-xl">
        <button
          onClick={onReturnToLobby}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 border border-amber-500/30 uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Lobby
        </button>

        <div className="text-center">
          <h1 className="font-black text-amber-300 font-mono tracking-widest text-xs sm:text-base flex items-center gap-2 justify-center drop-shadow-[0_0_10px_rgba(245,158,11,0.7)]">
            ⚡ PUERTAS DEL OLIMPO ⚡
          </h1>
          <span className="text-[10px] text-amber-400/90 font-mono uppercase block tracking-wider">
            SCATTER PAYS 6x5 • MULTIPLICADORES HASTA 500x
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-bold rounded-xl flex items-center gap-1 border border-cyan-500/30 uppercase"
            title="Información del Juego"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" /> INFO
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="px-3 py-1.5 bg-slate-950 border border-emerald-500/50 rounded-xl font-mono text-xs shadow-inner">
            <span className="text-emerald-400 font-bold">PTS: </span>
            <span className="text-emerald-300 font-black text-xs sm:text-sm">{user.balance.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-2 sm:p-4 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 z-10">
        
        {/* Left Side Controls (Buy Bonus & Ante Bet) */}
        <div className="w-full lg:w-56 flex flex-row lg:flex-col gap-2 shrink-0">
          {/* Buy Free Spins Button */}
          <button
            onClick={() => handleSpin(true)}
            disabled={isSpinning}
            className="flex-1 p-3 bg-gradient-to-b from-amber-500 via-amber-400 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 rounded-2xl border-2 border-amber-200 shadow-xl text-center group transition-all active:scale-95 disabled:opacity-50 relative overflow-hidden"
          >
            <span className="text-[10px] uppercase font-mono font-black tracking-wider block text-slate-950">
              ⚡ COMPRAR BONUS
            </span>
            <span className="text-sm font-black font-mono block text-slate-950 drop-shadow">
              {(baseBet * 100).toLocaleString()} PTS
            </span>
          </button>

          {/* Ante Bet Switch */}
          <div className="flex-1 p-3 bg-slate-900/90 border-2 border-amber-500/40 rounded-2xl flex items-center justify-between gap-2 shadow-xl backdrop-blur-md">
            <div>
              <span className="text-xs font-mono font-black text-amber-300 block">ANTE BET</span>
              <span className="text-[9px] text-slate-300 font-mono block uppercase">DOBLE PROBABILIDAD</span>
            </div>
            <button
              onClick={() => setIsAnteBet(!isAnteBet)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border ${
                isAnteBet ? 'bg-emerald-500 border-emerald-300' : 'bg-slate-800 border-slate-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                  isAnteBet ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Free Spins Tracker Box */}
          {freeSpinsLeft > 0 && (
            <div className="w-full p-3 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 rounded-2xl border-2 border-amber-300 font-mono text-center shadow-2xl">
              <span className="text-[10px] uppercase font-black block tracking-widest">TIRADAS GRATIS</span>
              <span className="text-2xl font-black block leading-none my-1">{freeSpinsLeft}</span>
              <span className="text-[10px] font-bold block bg-slate-950 text-amber-300 py-1 px-2 rounded-lg mt-1 border border-amber-400">
                MULTIPLICADOR: {accumulatedMultiplier}x
              </span>
            </div>
          )}
        </div>

        {/* Center Grid Stage (Temple Frame) */}
        <div className="flex-1 w-full max-w-2xl bg-slate-950/90 border-2 sm:border-4 border-amber-500/60 rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-[0_0_40px_rgba(245,158,11,0.25)] space-y-2 backdrop-blur-md relative">
          
          {/* Top Banner Message */}
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border border-amber-500/40 rounded-xl p-2 text-center shadow-inner">
            <span className="text-xs sm:text-sm font-mono font-black text-amber-300 tracking-wider uppercase block truncate drop-shadow">
              {message}
            </span>
          </div>

          {/* 6 Columns x 5 Rows Grid Area */}
          <div className="grid grid-cols-6 gap-1 sm:gap-2 relative min-h-[280px] sm:min-h-[420px]">
            {grid.map((symbol, idx) => {
              const isWinMatch = winningSymbols.includes(symbol);
              const orb = zeusOrbs.find(o => o.pos === idx);

              return (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl sm:rounded-2xl border flex items-center justify-center relative p-1 transition-all duration-300 transform ${
                    isWinMatch
                      ? 'bg-gradient-to-tr from-amber-500/90 via-yellow-300 to-amber-400 border-white ring-2 ring-yellow-300 scale-105 z-20 animate-bounce shadow-[0_0_20px_rgba(250,204,21,0.9)]'
                      : 'bg-slate-900/90 border-amber-500/30 hover:border-amber-400/60'
                  }`}
                >
                  {/* Multiplier Orb Overlay */}
                  {orb ? (
                    <ZeusMultiplierOrb value={orb.val} />
                  ) : (
                    <OlympusSymbolSVG symbol={symbol} className="w-full h-full transform transition-transform" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Last Win Status Strip */}
          <div className="w-full bg-slate-900/90 border border-amber-500/40 rounded-xl p-2 flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>GATES OF OLYMPUS</span>
            </div>

            {lastWin > 0 && (
              <div className="bg-emerald-950 border border-emerald-500/60 rounded-xl px-3 py-1 text-emerald-300 font-mono text-xs font-black animate-pulse">
                ÚLTIMA GANANCIA: +{lastWin.toLocaleString()} PTS
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Zeus Divine Character (Visible on Desktop/Tablet, Responsive Mobile Badge) */}
        <div className="w-full lg:w-64 flex flex-col items-center justify-center shrink-0">
          <div className="hidden lg:block w-full h-[400px]">
            <ZeusCharacter isStriking={isZeusStriking} />
          </div>

          {/* Mobile Badge View */}
          <div className="lg:hidden w-full bg-slate-900/90 border border-amber-500/40 rounded-2xl p-2.5 flex items-center justify-between text-center gap-2 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-3xl animate-pulse">⚡</span>
              <div className="text-left">
                <span className="font-black text-amber-300 font-mono text-xs tracking-wider uppercase block">
                  ZEUS DEL OLIMPO
                </span>
                <span className="text-[9px] text-amber-400/80 font-mono uppercase block">
                  ORBES MULTIPLICADORES 2x A 500x
                </span>
              </div>
            </div>

            {lastWin > 0 && (
              <div className="bg-emerald-950 border border-emerald-500/60 rounded-xl px-2.5 py-1 text-emerald-300 font-mono text-xs font-black shadow-md">
                +{lastWin.toLocaleString()} PTS
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Bottom Pragmatic Control Bar */}
      <footer className="bg-slate-900 border-t-2 border-amber-500/40 p-3 sticky bottom-0 z-40 backdrop-blur-md shadow-2xl">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Bet Selector Controls */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-xs font-mono text-slate-400 uppercase mr-1 hidden sm:inline">APUESTA BASE:</span>
            {BET_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setBaseBet(opt)}
                disabled={isSpinning || freeSpinsLeft > 0}
                className={`px-3 py-2 rounded-xl font-mono text-xs font-black transition-all ${
                  baseBet === opt
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 scale-105 border-2 border-amber-200'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {opt >= 1000 ? `${(opt / 1000).toFixed(0)}k` : `${opt}`}
              </button>
            ))}
          </div>

          {/* Spin Action */}
          <button
            onClick={() => handleSpin(false)}
            disabled={isSpinning}
            className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl shadow-2xl shadow-emerald-500/30 font-mono uppercase text-sm sm:text-base tracking-widest flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 border-2 border-emerald-200"
          >
            <Zap className="w-5 h-5 fill-current text-slate-950" />
            {isSpinning
              ? 'GIRANDO...'
              : freeSpinsLeft > 0
              ? `TIRADA GRATIS (${freeSpinsLeft})`
              : `GIRAR (${totalCost.toLocaleString()} PTS)`}
          </button>
        </div>
      </footer>

      {/* Game Info Modal */}
      <GameInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        gameId="olympus"
      />
    </div>
  );
};

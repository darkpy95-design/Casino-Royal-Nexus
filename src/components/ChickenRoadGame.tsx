import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, HelpCircle, Flame, Sparkles, Volume2, VolumeX, Footprints, ShieldAlert, Zap } from 'lucide-react';
import { soundEngine } from '../audio';
import { GameInfoModal } from './GameInfoModal';

export interface ChickenRoadGameProps {
  user: { id: string; role: 'admin' | 'client'; balance: number };
  onReturnToLobby: () => void;
  onBalanceUpdated: () => void;
}

export type ChickenDifficulty = 'easy' | 'medium' | 'hard' | 'hardcore';

const DIFFICULTY_CONFIG: Record<
  ChickenDifficulty,
  { label: string; maxSteps: number; multipliers: number[]; color: string; collisionProb: string }
> = {
  easy: {
    label: 'Fácil',
    maxSteps: 25,
    collisionProb: '4%',
    multipliers: [
      1.03, 1.07, 1.12, 1.18, 1.25, 1.33, 1.42, 1.53, 1.66, 1.81,
      1.98, 2.18, 2.42, 2.70, 3.03, 3.42, 3.90, 4.48, 5.20, 6.10,
      7.25, 8.80, 10.90, 13.80, 18.00,
    ],
    color: '#22c55e',
  },
  medium: {
    label: 'Medio',
    maxSteps: 20,
    collisionProb: '10%',
    multipliers: [
      1.12, 1.28, 1.47, 1.70, 1.98, 2.33, 2.77, 3.32, 4.02, 4.92,
      6.10, 7.66, 9.75, 12.60, 16.50, 22.00, 30.00, 42.00, 60.00, 100.00,
    ],
    color: '#eab308',
  },
  hard: {
    label: 'Duro',
    maxSteps: 15,
    collisionProb: '20%',
    multipliers: [
      1.25, 1.60, 2.10, 2.80, 3.80, 5.20, 7.20, 10.20, 14.80, 22.00,
      34.00, 55.00, 95.00, 180.00, 350.00,
    ],
    color: '#f97316',
  },
  hardcore: {
    label: 'Hardcore',
    maxSteps: 10,
    collisionProb: '35%',
    multipliers: [
      1.60, 2.70, 4.80, 9.00, 18.00, 38.00, 85.00, 200.00, 500.00, 1500.00,
    ],
    color: '#ef4444',
  },
};

const BET_PRESETS = [200, 500, 1000, 2500, 5000, 10000];

const RoastedChickenAvatar: React.FC = () => (
  <motion.div
    key="roasted"
    initial={{ scale: 0.2, opacity: 0 }}
    animate={{ scale: [0.5, 1.4, 1], opacity: 1, rotate: [-10, 10, -5, 5, 0] }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
    className="flex flex-col items-center relative"
  >
    {/* Explosive Fiery Glow Radial Background */}
    <motion.div
      initial={{ scale: 0.2, opacity: 0.8 }}
      animate={{ scale: [1, 2.2, 1.8], opacity: [0.9, 0.4, 0.7] }}
      transition={{ repeat: Infinity, duration: 0.8, repeatType: 'reverse' }}
      className="absolute -inset-6 rounded-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 blur-lg -z-10"
    />

    {/* Floating Fire & Spark Particles */}
    <div className="absolute -top-12 inset-x-0 flex justify-center pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.span
          key={i}
          initial={{ y: 10, x: (i - 2.5) * 8, opacity: 1, scale: 0.6 }}
          animate={{ y: -35 - i * 5, x: (i - 2.5) * 14 + (i % 2 === 0 ? 6 : -6), opacity: 0, scale: 1.2 }}
          transition={{ repeat: Infinity, duration: 0.7 + i * 0.1, delay: i * 0.08 }}
          className="absolute text-2xl"
        >
          🔥
        </motion.span>
      ))}
    </div>

    {/* Roasted Turkey/Chicken Drumstick Icon */}
    <div className="text-5xl sm:text-6xl filter drop-shadow-[0_0_25px_rgba(239,68,68,1)] animate-bounce">
      🍗
    </div>

    <span className="bg-gradient-to-r from-red-600 to-orange-600 text-white font-mono text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase mt-1 border border-yellow-400/50 shadow-lg shadow-red-500/50 animate-pulse tracking-wider">
      🔥 ROSTIZADO 🔥
    </span>
  </motion.div>
);

export const ChickenRoadGame: React.FC<ChickenRoadGameProps> = ({
  user,
  onReturnToLobby,
  onBalanceUpdated,
}) => {
  const [difficulty, setDifficulty] = useState<ChickenDifficulty>('medium');
  const [betInput, setBetInput] = useState<number>(1000);

  // Active Session State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRoasted, setIsRoasted] = useState<boolean>(false);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  const laneContainerRef = useRef<HTMLDivElement | null>(null);

  const activeConfig = DIFFICULTY_CONFIG[difficulty];

  // Auto-scroll lane container to keep active step centered
  useEffect(() => {
    if (laneContainerRef.current) {
      const activeElement = laneContainerRef.current.children[currentStep] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentStep]);

  // Start Game
  const handleStartGame = async () => {
    if (isPlaying || isProcessing) return;
    if (betInput <= 0 || user.balance < betInput) {
      soundEngine.playButtonClick();
      return;
    }

    setIsProcessing(true);
    soundEngine.playButtonClick();

    try {
      const res = await fetch('/api/chicken-road/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, bet: betInput, difficulty }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsProcessing(false);
        return;
      }

      setIsPlaying(true);
      setCurrentStep(0);
      setIsRoasted(false);
      setCurrentMultiplier(1.0);
      onBalanceUpdated();
    } catch {
      // Error handling
    } finally {
      setIsProcessing(false);
    }
  };

  // Step / Go Button
  const handleStep = async () => {
    if (!isPlaying && currentStep === 0) {
      await handleStartGame();
      return;
    }

    if (!isPlaying || isProcessing || isRoasted) return;

    setIsProcessing(true);
    soundEngine.playBonusShoot();

    try {
      const res = await fetch('/api/chicken-road/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsProcessing(false);
        return;
      }

      if (data.roasted) {
        if (data.trapStep) {
          setCurrentStep(data.trapStep);
        }
        setIsRoasted(true);
        setIsPlaying(false);
        soundEngine.playButtonClick();
        onBalanceUpdated();
      } else {
        setCurrentStep(data.step);
        setCurrentMultiplier(data.currentMultiplier);

        if (data.completed) {
          setIsPlaying(false);
          soundEngine.playWin();
          confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 } });
          onBalanceUpdated();
          setTimeout(() => {
            setCurrentStep(0);
            setCurrentMultiplier(1.0);
            setIsRoasted(false);
          }, 1500);
        }
      }
    } catch {
      // Handle error
    } finally {
      setIsProcessing(false);
    }
  };

  // Cash Out
  const handleCashOut = async () => {
    if (!isPlaying || isProcessing || currentStep === 0) return;

    setIsProcessing(true);
    soundEngine.playWin();

    try {
      const res = await fetch('/api/chicken-road/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsProcessing(false);
        return;
      }

      setIsPlaying(false);
      setCurrentStep(0);
      setCurrentMultiplier(1.0);
      setIsRoasted(false);
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      onBalanceUpdated();
    } catch {
      // Handle error
    } finally {
      setIsProcessing(false);
    }
  };

  const cashOutValue = Math.round(betInput * currentMultiplier);
  const nextMultiplier = activeConfig.multipliers[currentStep] || currentMultiplier;

  return (
    <div className="min-h-dvh max-h-dvh w-full bg-[#131726] text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-slate-950 overflow-hidden select-none">
      {/* 1. Header Bar */}
      <header className="w-full bg-[#1b2133] border-b border-slate-800/80 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToLobby}
            disabled={isPlaying}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 disabled:opacity-40"
            title="Volver al lobby"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <h1 className="font-black text-amber-400 font-mono text-base sm:text-lg tracking-wider uppercase drop-shadow">
              CHICKEN ROAD
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHowToPlay(true)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-lg text-xs font-mono flex items-center gap-1 border border-cyan-500/30 transition-all"
            title="Información del Juego"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>INFO</span>
          </button>

          <div className="bg-[#141824] border border-amber-500/30 rounded-xl px-3 py-1 font-mono text-xs sm:text-sm font-black text-amber-300 shadow-inner flex items-center gap-1.5">
            <span>{user.balance.toLocaleString('es-ES')} PTS</span>
          </div>
        </div>
      </header>

      {/* 2. Main Game Highway Canvas */}
      <main className="flex-1 relative bg-[#232a3f] overflow-hidden flex flex-col justify-end">
        {/* Fire Explosion Flash Overlay */}
        <AnimatePresence>
          {isRoasted && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: [0.8, 0.2, 0.5, 0] }}
              transition={{ duration: 1 }}
              className="absolute inset-0 bg-gradient-to-t from-red-600/60 via-orange-500/30 to-transparent pointer-events-none z-20"
            />
          )}
        </AnimatePresence>

        {/* Stone Archways Background Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#2d3652_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
        
        {/* Top Stone Wall Decor */}
        <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-[#171c2b] to-transparent pointer-events-none z-10" />

        {/* Scrollable Road Columns */}
        <div className="w-full h-full overflow-x-auto overflow-y-hidden scrollbar-none flex items-end justify-start px-8 sm:px-16 pb-2 relative z-10">
          <div ref={laneContainerRef} className="flex items-end min-w-max mx-auto h-full pt-8 pb-1 gap-0">
            
            {/* Column 0: Start Gate */}
            <div className="w-28 sm:w-32 h-full flex flex-col justify-end items-center border-r-2 border-dashed border-slate-600/30 relative px-2">
              <div className="mb-auto mt-6 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 border-2 border-amber-200 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/20">
                  🍗
                </div>
              </div>

              {/* Start Sewer Tunnel Opening */}
              <div className="w-20 h-28 bg-[#121622] border-t-4 border-slate-700 rounded-t-full flex items-end justify-center pb-2 relative overflow-hidden shadow-inner">
                <div className="w-full h-full bg-gradient-to-b from-black/80 to-transparent absolute inset-0" />
                <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest relative z-10">INICIO</span>
              </div>

              {/* Start Chicken Character position */}
              {currentStep === 0 && (
                <motion.div
                  layoutId="chicken"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="absolute bottom-6 z-30 flex flex-col items-center pointer-events-none"
                >
                  <AnimatePresence mode="wait">
                    {isRoasted ? (
                      <RoastedChickenAvatar />
                    ) : (
                      <motion.div
                        key="alive"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                        className="flex flex-col items-center"
                      >
                        <div className="text-5xl sm:text-6xl filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.6)]">
                          🐔
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* Steps Columns */}
            {activeConfig.multipliers.map((mult, idx) => {
              const stepNum = idx + 1;
              const isPast = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              const isNext = isPlaying && stepNum === currentStep + 1;

              return (
                <div
                  key={stepNum}
                  className={`w-28 sm:w-32 h-full flex flex-col justify-end items-center border-r-2 border-dashed border-slate-600/30 relative px-2 transition-colors ${
                    isCurrent ? 'bg-slate-800/30' : ''
                  }`}
                >
                  {/* Multiplier Badge Bubble */}
                  <div className="mb-auto mt-6 flex flex-col items-center">
                    {isCurrent ? (
                      <motion.div
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 via-green-400 to-emerald-300 border-4 border-emerald-200 flex items-center justify-center text-slate-950 font-black font-mono text-base shadow-lg shadow-emerald-500/50 ring-4 ring-emerald-500/30"
                      >
                        {mult.toFixed(2)}x
                      </motion.div>
                    ) : isPast ? (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 border-2 border-amber-200 flex items-center justify-center text-slate-950 font-black font-mono text-xs shadow-md opacity-80">
                        🍗
                      </div>
                    ) : (
                      <div
                        className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-black font-mono text-xs shadow-inner transition-all ${
                          isNext
                            ? 'bg-[#2a344f] border-emerald-400 text-emerald-300 animate-pulse scale-105'
                            : 'bg-[#1b2235] border-slate-700 text-slate-400'
                        }`}
                      >
                        {mult.toFixed(2)}x
                      </div>
                    )}
                  </div>

                  {/* Sewer Arch Window at Lane Bottom */}
                  <div className="w-20 h-28 bg-[#121622] border-t-4 border-slate-700 rounded-t-full flex items-end justify-center pb-2 relative overflow-hidden shadow-inner">
                    <div className="w-full h-full bg-gradient-to-b from-black/80 via-transparent to-black/60 absolute inset-0" />
                    
                    {/* Sewer Grate Slats */}
                    <div className="absolute inset-x-2 top-3 bottom-0 flex justify-between px-2 opacity-30 pointer-events-none">
                      <div className="w-1 h-full bg-slate-500 rounded-full" />
                      <div className="w-1 h-full bg-slate-500 rounded-full" />
                      <div className="w-1 h-full bg-slate-500 rounded-full" />
                    </div>

                    <span className="text-[9px] font-mono font-bold text-slate-600 relative z-10">
                      #{stepNum}
                    </span>
                  </div>

                  {/* Character Position on Lane */}
                  {isCurrent && (
                    <motion.div
                      layoutId="chicken"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="absolute bottom-6 z-30 flex flex-col items-center pointer-events-none"
                    >
                      <AnimatePresence mode="wait">
                        {isRoasted ? (
                          <RoastedChickenAvatar />
                        ) : (
                          <motion.div
                            key="alive"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                            className="flex flex-col items-center"
                          >
                            <div className="text-5xl sm:text-6xl filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.7)]">
                              🐔
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Floor Asphalt Base */}
        <div className="w-full h-4 bg-[#141824] border-t-2 border-slate-700 z-10" />
      </main>

      {/* 3. Bottom Control Console (Exact Replica of Chicken Road UI) */}
      <footer className="w-full bg-[#1b2133] border-t border-slate-800/80 p-3 sm:p-4 z-20">
        <div className="max-w-6xl mx-auto bg-[#141824] border border-slate-700/60 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Left: Bet Amount & Quick Presets */}
          <div className="w-full lg:w-auto flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center bg-[#1c2336] border border-slate-700 rounded-xl overflow-hidden p-1">
                <button
                  onClick={() => setBetInput(10)}
                  disabled={isPlaying}
                  className="px-2.5 py-1 text-[11px] font-mono font-black text-slate-400 hover:text-white transition-colors"
                >
                  MÍN
                </button>
                <input
                  type="number"
                  value={betInput}
                  onChange={e => setBetInput(Math.max(1, Number(e.target.value)))}
                  disabled={isPlaying}
                  className="w-20 bg-transparent text-center font-mono font-black text-amber-300 text-sm focus:outline-none"
                />
                <button
                  onClick={() => setBetInput(Math.min(user.balance, 50000))}
                  disabled={isPlaying}
                  className="px-2.5 py-1 text-[11px] font-mono font-black text-slate-400 hover:text-white transition-colors"
                >
                  MÁX
                </button>
              </div>

              {/* Quick Chip Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {BET_PRESETS.map(val => (
                  <button
                    key={val}
                    onClick={() => setBetInput(val)}
                    disabled={isPlaying}
                    className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all border ${
                      betInput === val
                        ? 'bg-amber-400 text-slate-950 border-white shadow'
                        : 'bg-[#1c2336] text-slate-300 border-slate-700 hover:border-amber-400/60'
                    }`}
                  >
                    {val >= 1000 ? `${val / 1000}k` : val} PTS
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Difficulty Selector & Collision Prob */}
          <div className="w-full lg:w-auto flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-between w-full text-[11px] font-mono font-bold text-slate-400 px-1">
              <span>Dificultad</span>
              <span className="text-slate-500">
                Probabilidad de colisión: <strong className="text-amber-400">{activeConfig.collisionProb}</strong>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 bg-[#1a2032] p-1 rounded-xl border border-slate-700/80 w-full sm:w-80">
              {(['easy', 'medium', 'hard', 'hardcore'] as ChickenDifficulty[]).map(dKey => (
                <button
                  key={dKey}
                  onClick={() => setDifficulty(dKey)}
                  disabled={isPlaying}
                  className={`py-1.5 rounded-lg font-mono text-[11px] font-black uppercase transition-all ${
                    difficulty === dKey
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {DIFFICULTY_CONFIG[dKey].label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Cashout & Go (IR) Action Buttons */}
          <div className="w-full lg:w-auto flex items-center gap-3">
            {/* CASH OUT BUTTON */}
            <button
              onClick={handleCashOut}
              disabled={!isPlaying || isProcessing || currentStep === 0}
              className={`flex-1 lg:w-44 py-3.5 px-4 rounded-2xl font-mono font-black uppercase tracking-wider text-xs sm:text-sm flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 ${
                isPlaying && currentStep > 0
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>RETIRO</span>
              <span className="text-sm font-black">{cashOutValue.toLocaleString('es-ES')} PTS</span>
            </button>

            {/* GO / STEP BUTTON (IR) */}
            <button
              onClick={handleStep}
              disabled={isProcessing || user.balance < betInput}
              className="flex-1 lg:w-36 py-3.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black font-mono uppercase text-lg rounded-2xl shadow-xl shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isPlaying ? 'IR' : 'APOSTAR'}</span>
            </button>
          </div>

        </div>
      </footer>

      {/* Game Info Modal */}
      <GameInfoModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        gameId="chicken"
      />
    </div>
  );
};

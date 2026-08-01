import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Volume2, VolumeX, ArrowLeft, Zap, Sparkles, Coins, Target, Dices, HelpCircle } from 'lucide-react';
import { soundEngine } from '../audio';
import { GameInfoModal } from './GameInfoModal';

export interface CrazyWheelGameProps {
  user: { id: string; role: 'admin' | 'client'; balance: number };
  onReturnToLobby: () => void;
  onBalanceUpdated: () => void;
}

export type CrazyBetKey = '1' | '2' | '5' | '10' | 'coin_flip' | 'cash_hunt' | 'pachinko' | 'crazy_time';

export interface CrazySegment {
  id: number;
  type: CrazyBetKey;
  label: string;
  baseMultiplier: number;
  color: string;
}

// 54 ordered segments
const CRAZY_SEGMENTS: CrazySegment[] = [
  { id: 0, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 1, type: 'coin_flip', label: 'COIN FLIP', baseMultiplier: 10, color: '#2563eb' },
  { id: 2, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 3, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 4, type: '5', label: '5', baseMultiplier: 5, color: '#9333ea' },
  { id: 5, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 6, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 7, type: 'pachinko', label: 'PACHINKO', baseMultiplier: 15, color: '#db2777' },
  { id: 8, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 9, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 10, type: '5', label: '5', baseMultiplier: 5, color: '#9333ea' },
  { id: 11, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 12, type: '10', label: '10', baseMultiplier: 10, color: '#4f46e5' },
  { id: 13, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 14, type: 'cash_hunt', label: 'CASH HUNT', baseMultiplier: 20, color: '#059669' },
  { id: 15, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 16, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 17, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 18, type: 'coin_flip', label: 'COIN FLIP', baseMultiplier: 10, color: '#2563eb' },
  { id: 19, type: '5', label: '5', baseMultiplier: 5, color: '#9333ea' },
  { id: 20, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 21, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 22, type: '10', label: '10', baseMultiplier: 10, color: '#4f46e5' },
  { id: 23, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 24, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 25, type: '5', label: '5', baseMultiplier: 5, color: '#9333ea' },
  { id: 26, type: 'coin_flip', label: 'COIN FLIP', baseMultiplier: 10, color: '#2563eb' },
  { id: 27, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 28, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 29, type: 'pachinko', label: 'PACHINKO', baseMultiplier: 15, color: '#db2777' },
  { id: 30, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 31, type: '5', label: '5', baseMultiplier: 5, color: '#9333ea' },
  { id: 32, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 33, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 34, type: '10', label: '10', baseMultiplier: 10, color: '#4f46e5' },
  { id: 35, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 36, type: 'cash_hunt', label: 'CASH HUNT', baseMultiplier: 20, color: '#059669' },
  { id: 37, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 38, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 39, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 40, type: '5', label: '5', baseMultiplier: 5, color: '#9333ea' },
  { id: 41, type: 'coin_flip', label: 'COIN FLIP', baseMultiplier: 10, color: '#2563eb' },
  { id: 42, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 43, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 44, type: '10', label: '10', baseMultiplier: 10, color: '#4f46e5' },
  { id: 45, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 46, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 47, type: '5', label: '5', baseMultiplier: 5, color: '#9333ea' },
  { id: 48, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 49, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
  { id: 50, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 51, type: 'crazy_time', label: 'CRAZY TIME', baseMultiplier: 50, color: '#dc2626' },
  { id: 52, type: '1', label: '1', baseMultiplier: 1, color: '#0284c7' },
  { id: 53, type: '2', label: '2', baseMultiplier: 2, color: '#d97706' },
];

const CHIP_VALUES = [200, 500, 1000, 2500, 5000, 10000];

export const CrazyWheelGame: React.FC<CrazyWheelGameProps> = ({
  user,
  onReturnToLobby,
  onBalanceUpdated,
}) => {
  const [bets, setBets] = useState<Record<CrazyBetKey, number>>({
    '1': 0,
    '2': 0,
    '5': 0,
    '10': 0,
    coin_flip: 0,
    cash_hunt: 0,
    pachinko: 0,
    crazy_time: 0,
  });
  const [lastBets, setLastBets] = useState<Record<CrazyBetKey, number>>({
    '1': 0,
    '2': 0,
    '5': 0,
    '10': 0,
    coin_flip: 0,
    cash_hunt: 0,
    pachinko: 0,
    crazy_time: 0,
  });

  const [selectedChip, setSelectedChip] = useState<number>(1000);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [currentWin, setCurrentWin] = useState<number>(0);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('¡REALICE SUS APUESTAS Y GIRE LA RUEDA CRAZY!');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Top Slot Reel State
  const [topSlot, setTopSlot] = useState<{ type: string; multiplier: number; applied: boolean } | null>(null);
  const [isTopSlotSpinning, setIsTopSlotSpinning] = useState<boolean>(false);

  // Active Bonus Overlay State
  const [bonusOverlay, setBonusOverlay] = useState<any | null>(null);

  // Wheel Rotation State (Canvas)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const totalBet = (Object.values(bets) as number[]).reduce((a, b) => a + b, 0);

  // Draw 54-Segment Wheel on Canvas
  const drawWheel = (rotationAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 8;

    ctx.clearRect(0, 0, width, height);

    const segmentAngle = (2 * Math.PI) / CRAZY_SEGMENTS.length;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);

    // Render 54 Segments
    CRAZY_SEGMENTS.forEach((seg, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#fef08a'; // Gold separating spokes
      ctx.stroke();

      // Render Label Text
      ctx.save();
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;

      const labelText = seg.label.length > 7 ? seg.label.substring(0, 6) : seg.label;
      ctx.fillText(labelText, radius - 10, 3);
      ctx.restore();
    });

    // Outer Gold Rim
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#eab308';
    ctx.stroke();

    // Inner Center Badge "CRAZY TIME"
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, 2 * Math.PI);
    ctx.fillStyle = '#7f1d1d';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fef08a';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fef08a';
    ctx.font = 'black 11px monospace';
    ctx.fillText('CRAZY', 0, -6);
    ctx.fillText('TIME', 0, 6);

    ctx.restore();

    // Top Pointer Flapper (Rattles during spin)
    ctx.save();
    ctx.translate(centerX, 8);
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(-10, -4);
    ctx.lineTo(10, -4);
    ctx.closePath();
    ctx.fillStyle = '#facc15';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#78350f';
    ctx.stroke();
    ctx.restore();
  };

  useEffect(() => {
    drawWheel(currentRotationRef.current);
  }, []);

  const handlePlaceBet = (key: CrazyBetKey) => {
    if (isSpinning) return;
    soundEngine.playButtonClick();
    setBets(prev => ({
      ...prev,
      [key]: prev[key] + selectedChip,
    }));
  };

  const handleClearBets = () => {
    if (isSpinning) return;
    soundEngine.playButtonClick();
    setBets({
      '1': 0,
      '2': 0,
      '5': 0,
      '10': 0,
      coin_flip: 0,
      cash_hunt: 0,
      pachinko: 0,
      crazy_time: 0,
    });
  };

  const handleDoubleBets = () => {
    if (isSpinning) return;
    soundEngine.playButtonClick();
    setBets(prev => {
      const next: Record<CrazyBetKey, number> = { ...prev };
      for (const k in next) {
        next[k as CrazyBetKey] *= 2;
      }
      return next;
    });
  };

  const handleRepeatBets = () => {
    if (isSpinning) return;
    soundEngine.playButtonClick();
    setBets(lastBets);
  };

  // Spin Action Handler
  const handleSpin = async () => {
    if (isSpinning || totalBet <= 0) return;
    if (user.balance < totalBet) {
      setMessage('¡Saldo de puntos insuficiente!');
      return;
    }

    setIsSpinning(true);
    setCurrentWin(0);
    setTopSlot(null);
    setBonusOverlay(null);
    setIsTopSlotSpinning(true);
    setMessage('🎰 Girando Top Slot y la gran Rueda Crazy...');
    soundEngine.playBonusShoot();

    setLastBets(bets);

    try {
      const res = await fetch('/api/crazy-wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, bets }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || 'Error al procesar el tiro');
        setIsSpinning(false);
        setIsTopSlotSpinning(false);
        return;
      }

      onBalanceUpdated();

      // Set Top Slot Reel Result after 1.5s
      setTimeout(() => {
        setIsTopSlotSpinning(false);
        setTopSlot(data.topSlot);
      }, 1500);

      // Animate Wheel Rotation to winning segment
      const winningIndex = data.winningSegmentIndex;
      const segmentAngle = (2 * Math.PI) / CRAZY_SEGMENTS.length;

      // Top flapper points at angle -Math.PI / 2 (12 o'clock)
      const targetSegmentAngle = winningIndex * segmentAngle;
      const targetRotationAngle = (3 * Math.PI) / 2 - targetSegmentAngle;

      const fullSpins = 6 + Math.floor(Math.random() * 3);
      const startRotation = currentRotationRef.current;
      const endRotation = startRotation + fullSpins * 2 * Math.PI + (targetRotationAngle - (startRotation % (2 * Math.PI)));

      const startTime = performance.now();
      const duration = 5000; // 5 seconds spin

      const animateWheel = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Cubic Ease Out for natural wheel slowing down
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentRot = startRotation + (endRotation - startRotation) * easeOut;

        currentRotationRef.current = currentRot;
        drawWheel(currentRot);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateWheel);
        } else {
          // Spin Finished!
          setIsSpinning(false);

          if (data.totalWin > 0) {
            setCurrentWin(data.totalWin);
            setMessage(`🎉 ¡GANASTE ${data.totalWin.toLocaleString()} PTS EN ${data.winningSegment.label}!`);
            soundEngine.playWin();

            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } else {
            setMessage(`🎯 Salió ${data.winningSegment.label}. ¡Suerte en el próximo tiro!`);
          }

          if (data.bonusDetails) {
            setBonusOverlay(data.bonusDetails);
          }

          onBalanceUpdated();
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateWheel);
    } catch {
      setMessage('Error de conexión con el servidor');
      setIsSpinning(false);
      setIsTopSlotSpinning(false);
    }
  };

  return (
    <div className="min-h-dvh max-h-dvh w-full overflow-y-auto bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-slate-950 p-2 sm:p-4">
      {/* Top Header Navigation */}
      <header className="w-full max-w-xl mx-auto bg-slate-900 border border-amber-500/30 rounded-2xl p-2 sm:p-3 flex items-center justify-between shadow-xl">
        <button
          onClick={onReturnToLobby}
          disabled={isSpinning}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> LOBBY
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
            🎡
          </div>
          <span className="font-black text-amber-300 font-mono tracking-wider text-xs sm:text-sm">
            CRAZY TIME
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfoModal(true)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl font-mono text-xs font-bold flex items-center gap-1 transition-all border border-cyan-500/30"
            title="Información del Juego"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> INFO
          </button>

          <div className="px-3 py-1 bg-amber-950/80 border border-amber-500/40 rounded-xl font-mono text-xs text-amber-300 font-black">
            {user.balance.toLocaleString()} PTS
          </div>
        </div>
      </header>

      {/* Main Game Arena Stage */}
      <main className="flex-1 max-w-xl w-full mx-auto my-2 space-y-2 flex flex-col items-center justify-between">
        
        {/* Top Slot Reel Banner */}
        <div className="w-full bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-2 shadow-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 uppercase">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            TOP SLOT
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-slate-950 border border-amber-500/40 rounded-lg text-xs font-mono font-black text-amber-300 uppercase min-w-[80px] text-center shadow-inner">
              {isTopSlotSpinning ? '🎰...' : topSlot ? topSlot.type.toUpperCase() : '----'}
            </div>
            <span className="text-amber-400 font-bold font-mono text-xs">x</span>
            <div className="px-3 py-1 bg-slate-950 border border-amber-500/40 rounded-lg text-xs font-mono font-black text-emerald-400 min-w-[50px] text-center shadow-inner">
              {isTopSlotSpinning ? '...' : topSlot ? `${topSlot.multiplier}X` : '--'}
            </div>
          </div>
        </div>

        {/* Center Wheel Canvas Display */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center bg-slate-900 border-4 border-amber-500/50 rounded-full shadow-2xl p-1">
          <canvas ref={canvasRef} width={280} height={280} className="w-full h-full rounded-full" />
        </div>

        {/* Message Banner */}
        <div className="w-full bg-slate-900 border border-amber-500/30 rounded-2xl p-2 text-center font-mono text-xs text-amber-300 font-bold shadow-md">
          {message}
        </div>

        {/* Betting Board Tickets (Matching Uploaded Screenshot Layout) */}
        <div className="w-full grid grid-cols-4 gap-1.5 font-mono text-xs">
          {/* Ticket 1: 1 (Pays 1x) */}
          <button
            onClick={() => handlePlaceBet('1')}
            disabled={isSpinning}
            className={`p-2 rounded-xl border-2 flex flex-col items-center justify-between transition-all relative overflow-hidden h-20 ${
              bets['1'] > 0
                ? 'bg-sky-950/90 border-sky-400 shadow-md ring-2 ring-sky-400/50'
                : 'bg-slate-900/90 border-sky-600/40 hover:border-sky-400'
            }`}
          >
            <span className="text-[9px] text-sky-300 font-black tracking-wider uppercase">PAGA 1X</span>
            <span className="text-2xl font-black text-sky-400 drop-shadow">1</span>
            {bets['1'] > 0 && (
              <span className="bg-sky-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-black shadow">
                {bets['1'] >= 1000 ? `${(bets['1'] / 1000).toFixed(0)}k` : bets['1']}
              </span>
            )}
          </button>

          {/* Ticket 2: 2 (Pays 2x) */}
          <button
            onClick={() => handlePlaceBet('2')}
            disabled={isSpinning}
            className={`p-2 rounded-xl border-2 flex flex-col items-center justify-between transition-all relative overflow-hidden h-20 ${
              bets['2'] > 0
                ? 'bg-amber-950/90 border-amber-400 shadow-md ring-2 ring-amber-400/50'
                : 'bg-slate-900/90 border-amber-600/40 hover:border-amber-400'
            }`}
          >
            <span className="text-[9px] text-amber-300 font-black tracking-wider uppercase">PAGA 2X</span>
            <span className="text-2xl font-black text-amber-400 drop-shadow">2</span>
            {bets['2'] > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-black shadow">
                {bets['2'] >= 1000 ? `${(bets['2'] / 1000).toFixed(0)}k` : bets['2']}
              </span>
            )}
          </button>

          {/* Ticket 3: 5 (Pays 5x) */}
          <button
            onClick={() => handlePlaceBet('5')}
            disabled={isSpinning}
            className={`p-2 rounded-xl border-2 flex flex-col items-center justify-between transition-all relative overflow-hidden h-20 ${
              bets['5'] > 0
                ? 'bg-purple-950/90 border-purple-400 shadow-md ring-2 ring-purple-400/50'
                : 'bg-slate-900/90 border-purple-600/40 hover:border-purple-400'
            }`}
          >
            <span className="text-[9px] text-purple-300 font-black tracking-wider uppercase">PAGA 5X</span>
            <span className="text-2xl font-black text-purple-400 drop-shadow">5</span>
            {bets['5'] > 0 && (
              <span className="bg-purple-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-black shadow">
                {bets['5'] >= 1000 ? `${(bets['5'] / 1000).toFixed(0)}k` : bets['5']}
              </span>
            )}
          </button>

          {/* Ticket 4: 10 (Pays 10x) */}
          <button
            onClick={() => handlePlaceBet('10')}
            disabled={isSpinning}
            className={`p-2 rounded-xl border-2 flex flex-col items-center justify-between transition-all relative overflow-hidden h-20 ${
              bets['10'] > 0
                ? 'bg-indigo-950/90 border-indigo-400 shadow-md ring-2 ring-indigo-400/50'
                : 'bg-slate-900/90 border-indigo-600/40 hover:border-indigo-400'
            }`}
          >
            <span className="text-[9px] text-indigo-300 font-black tracking-wider uppercase">PAGA 10X</span>
            <span className="text-2xl font-black text-indigo-400 drop-shadow">10</span>
            {bets['10'] > 0 && (
              <span className="bg-indigo-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-black shadow">
                {bets['10'] >= 1000 ? `${(bets['10'] / 1000).toFixed(0)}k` : bets['10']}
              </span>
            )}
          </button>

          {/* Ticket 5: COIN FLIP (Bonus) */}
          <button
            onClick={() => handlePlaceBet('coin_flip')}
            disabled={isSpinning}
            className={`p-1.5 rounded-xl border-2 flex flex-col items-center justify-between transition-all relative overflow-hidden h-20 ${
              bets['coin_flip'] > 0
                ? 'bg-blue-950/90 border-blue-400 shadow-md ring-2 ring-blue-400/50'
                : 'bg-slate-900/90 border-blue-600/40 hover:border-blue-400'
            }`}
          >
            <span className="text-[8px] text-blue-300 font-black uppercase">BONUS GAME</span>
            <span className="text-[10px] font-black text-blue-300 uppercase leading-none text-center">COIN FLIP</span>
            <Coins className="w-5 h-5 text-blue-400 animate-pulse" />
            {bets['coin_flip'] > 0 && (
              <span className="bg-blue-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-black shadow">
                {bets['coin_flip'] >= 1000 ? `${(bets['coin_flip'] / 1000).toFixed(0)}k` : bets['coin_flip']}
              </span>
            )}
          </button>

          {/* Ticket 6: CASH HUNT (Bonus) */}
          <button
            onClick={() => handlePlaceBet('cash_hunt')}
            disabled={isSpinning}
            className={`p-1.5 rounded-xl border-2 flex flex-col items-center justify-between transition-all relative overflow-hidden h-20 ${
              bets['cash_hunt'] > 0
                ? 'bg-emerald-950/90 border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                : 'bg-slate-900/90 border-emerald-600/40 hover:border-emerald-400'
            }`}
          >
            <span className="text-[8px] text-emerald-300 font-black uppercase">BONUS GAME</span>
            <span className="text-[10px] font-black text-emerald-300 uppercase leading-none text-center">CASH HUNT</span>
            <Target className="w-5 h-5 text-emerald-400 animate-bounce" />
            {bets['cash_hunt'] > 0 && (
              <span className="bg-emerald-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-black shadow">
                {bets['cash_hunt'] >= 1000 ? `${(bets['cash_hunt'] / 1000).toFixed(0)}k` : bets['cash_hunt']}
              </span>
            )}
          </button>

          {/* Ticket 7: PACHINKO (Bonus) */}
          <button
            onClick={() => handlePlaceBet('pachinko')}
            disabled={isSpinning}
            className={`p-1.5 rounded-xl border-2 flex flex-col items-center justify-between transition-all relative overflow-hidden h-20 ${
              bets['pachinko'] > 0
                ? 'bg-pink-950/90 border-pink-400 shadow-md ring-2 ring-pink-400/50'
                : 'bg-slate-900/90 border-pink-600/40 hover:border-pink-400'
            }`}
          >
            <span className="text-[8px] text-pink-300 font-black uppercase">BONUS GAME</span>
            <span className="text-[10px] font-black text-pink-300 uppercase leading-none text-center">PACHINKO</span>
            <Dices className="w-5 h-5 text-pink-400 animate-pulse" />
            {bets['pachinko'] > 0 && (
              <span className="bg-pink-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-black shadow">
                {bets['pachinko'] >= 1000 ? `${(bets['pachinko'] / 1000).toFixed(0)}k` : bets['pachinko']}
              </span>
            )}
          </button>

          {/* Ticket 8: CRAZY TIME (Bonus) */}
          <button
            onClick={() => handlePlaceBet('crazy_time')}
            disabled={isSpinning}
            className={`p-1.5 rounded-xl border-2 flex flex-col items-center justify-between transition-all relative overflow-hidden h-20 ${
              bets['crazy_time'] > 0
                ? 'bg-red-950/90 border-red-400 shadow-md ring-2 ring-red-400/50'
                : 'bg-slate-900/90 border-red-600/40 hover:border-red-400'
            }`}
          >
            <span className="text-[8px] text-red-300 font-black uppercase">MEGA BONUS</span>
            <span className="text-[10px] font-black text-red-300 uppercase leading-none text-center">CRAZY TIME</span>
            <Sparkles className="w-5 h-5 text-red-400 animate-spin" />
            {bets['crazy_time'] > 0 && (
              <span className="bg-red-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded-full font-black shadow">
                {bets['crazy_time'] >= 1000 ? `${(bets['crazy_time'] / 1000).toFixed(0)}k` : bets['crazy_time']}
              </span>
            )}
          </button>
        </div>

        {/* Chip Controls & Action Buttons */}
        <div className="w-full space-y-2 pt-1">
          {/* Chip Selector */}
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1">
            {CHIP_VALUES.map(val => (
              <button
                key={val}
                onClick={() => setSelectedChip(val)}
                disabled={isSpinning}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full font-mono font-black text-[10px] sm:text-xs flex items-center justify-center border-2 transition-all shrink-0 ${
                  selectedChip === val
                    ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-300 scale-110 z-10 shadow-lg'
                    : 'bg-slate-800 text-slate-200 border-slate-600 hover:border-amber-400'
                }`}
              >
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </button>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={handleRepeatBets}
              disabled={isSpinning}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[10px] font-bold rounded-xl border border-slate-700 uppercase"
            >
              REPETIR
            </button>
            <button
              onClick={handleDoubleBets}
              disabled={isSpinning}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[10px] font-bold rounded-xl border border-slate-700 uppercase"
            >
              2X DOBLAR
            </button>
            <button
              onClick={handleClearBets}
              disabled={isSpinning}
              className="py-2 bg-red-950/80 hover:bg-red-900 text-red-300 font-mono text-[10px] font-bold rounded-xl border border-red-800/50 uppercase"
            >
              LIMPIAR
            </button>

            <button
              onClick={handleSpin}
              disabled={isSpinning || totalBet <= 0}
              className="py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-lg font-mono uppercase text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {isSpinning ? 'GIRANDO...' : 'GIRAR RUEDA'}
            </button>
          </div>
        </div>
      </main>

      {/* Bonus Minigame Modal Overlay */}
      {bonusOverlay && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500 rounded-3xl p-5 text-center space-y-4 shadow-2xl">
            <div className="text-4xl animate-bounce">
              {bonusOverlay.type === 'coin_flip' && '🪙'}
              {bonusOverlay.type === 'cash_hunt' && '🎯'}
              {bonusOverlay.type === 'pachinko' && '🎰'}
              {bonusOverlay.type === 'crazy_time' && '👑'}
            </div>

            <h3 className="text-xl font-black text-amber-300 font-mono uppercase tracking-wider">
              ¡MINIJUEGO BONUS {bonusOverlay.type.replace('_', ' ').toUpperCase()}!
            </h3>

            <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-2xl font-mono space-y-2">
              <span className="text-xs text-slate-300 block uppercase">MULTIPLICADOR GANADO:</span>
              <span className="text-4xl font-black text-emerald-400 block drop-shadow">
                {bonusOverlay.finalMult}X
              </span>
            </div>

            <button
              onClick={() => setBonusOverlay(null)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl font-mono uppercase text-sm shadow-lg hover:scale-105 transition-transform"
            >
              CONTINUAR
            </button>
          </div>
        </div>
      )}

      {/* Game Info Modal */}
      <GameInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        gameId="crazy"
      />
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Zap, Trash2, RotateCcw, Trophy, Sparkles, X, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../audio';
import { GameInfoModal } from './GameInfoModal';

interface RouletteGameProps {
  user: { id: string; balance: number };
  onReturnToLobby: () => void;
  onBalanceUpdated: () => void;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const CHIP_VALUES = [200, 500, 1000, 2500, 5000, 10000, 25000];

export const RouletteGame: React.FC<RouletteGameProps> = ({
  user,
  onReturnToLobby,
  onBalanceUpdated,
}) => {
  const [selectedChip, setSelectedChip] = useState<number>(200);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [lastBets, setLastBets] = useState<Record<string, number>>({});
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [lightningTargets, setLightningTargets] = useState<Array<{ number: number; multiplier: number }>>([]);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [lastWinAlert, setLastWinAlert] = useState<{ win: number; isLightning?: boolean } | null>(null);
  const [history, setHistory] = useState<Array<{ num: number; color: 'red' | 'black' | 'green' }>>([]);
  const [message, setMessage] = useState<string>('¡HAGA SUS APUESTAS EN LA MESA!');
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [ballAngle, setBallAngle] = useState<number | null>(null);
  const [ballRadius, setBallRadius] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Roulette Wheel Canvas with Ball & Pockets
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;

    ctx.clearRect(0, 0, size, size);

    // Outer Mahogany Wood / Gold Rim
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#d97706'; // Gold border
    ctx.stroke();

    // Outer Ball Track Ring
    ctx.beginPath();
    ctx.arc(center, center, radius - 8, 0, Math.PI * 2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // Wheel Sectors
    const slice = (Math.PI * 2) / 37;
    WHEEL_NUMBERS.forEach((num, i) => {
      const angle = wheelAngle + i * slice;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius - 18, angle, angle + slice);
      ctx.closePath();

      if (num === 0) ctx.fillStyle = '#10b981'; // Emerald Green 0
      else if (RED_NUMBERS.includes(num)) ctx.fillStyle = '#dc2626'; // Red
      else ctx.fillStyle = '#020617'; // Dark Black

      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#fef08a22'; // Subtle gold line
      ctx.stroke();

      // Number Label
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + slice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'black 10px monospace';
      ctx.fillText(num.toString(), radius - 22, 3);
      ctx.restore();
    });

    // Inner Metallic Ring & Turret Hub
    ctx.beginPath();
    ctx.arc(center, center, 42, 0, Math.PI * 2);
    ctx.fillStyle = '#020617';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 28, 0, Math.PI * 2);
    const goldGrad = ctx.createRadialGradient(center - 5, center - 5, 2, center, center, 28);
    goldGrad.addColorStop(0, '#fef08a');
    goldGrad.addColorStop(0.5, '#f59e0b');
    goldGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = goldGrad;
    ctx.fill();

    // Render Ball if active or landed
    let currentBallAngle = ballAngle;
    let currentBallRadius = ballRadius;

    // If static and winningNumber exists, keep ball in the winning pocket!
    if (winningNumber !== null && (currentBallAngle === null || currentBallRadius === null)) {
      const winIdx = WHEEL_NUMBERS.indexOf(winningNumber);
      if (winIdx !== -1) {
        currentBallAngle = wheelAngle + (winIdx + 0.5) * slice;
        currentBallRadius = radius - 30;
      }
    }

    if (currentBallAngle !== null && currentBallRadius !== null) {
      const ballX = center + currentBallRadius * Math.cos(currentBallAngle);
      const ballY = center + currentBallRadius * Math.sin(currentBallAngle);

      // Shadow under ball
      ctx.beginPath();
      ctx.arc(ballX + 2, ballY + 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();

      // Glowing Aura if landed
      if (winningNumber !== null && !isSpinning) {
        ctx.beginPath();
        ctx.arc(ballX, ballY, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
        ctx.fill();
      }

      // 3D Shiny White Ivory Ball
      ctx.beginPath();
      ctx.arc(ballX, ballY, 7, 0, Math.PI * 2);
      const ballGrad = ctx.createRadialGradient(ballX - 2, ballY - 2, 1, ballX, ballY, 7);
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.6, '#e2e8f0');
      ballGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = ballGrad;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  }, [wheelAngle, ballAngle, ballRadius, winningNumber, isSpinning]);

  const totalBet: number = (Object.values(bets) as number[]).reduce((sum, v) => sum + (v || 0), 0);

  const handlePlaceBet = (spotKey: string) => {
    if (isSpinning) return;
    if (user.balance < totalBet + selectedChip) {
      setMessage('¡Puntos insuficientes para esta apuesta!');
      return;
    }
    soundEngine.playButtonClick();
    setBets(prev => ({
      ...prev,
      [spotKey]: (prev[spotKey] || 0) + selectedChip,
    }));
  };

  const handleClearBets = () => {
    if (isSpinning) return;
    soundEngine.playButtonClick();
    setBets({});
  };

  const handleRepeatBets = () => {
    if (isSpinning) return;
    const repeatTotal: number = (Object.values(lastBets) as number[]).reduce((s, v) => s + (v || 0), 0);
    if (user.balance < repeatTotal) {
      setMessage('¡Puntos insuficientes para repetir apuesta!');
      return;
    }
    soundEngine.playButtonClick();
    setBets(lastBets);
  };

  const handleSpin = async () => {
    if (isSpinning || totalBet <= 0) {
      setMessage('¡Coloque sus fichas antes de girar!');
      return;
    }

    setIsSpinning(true);
    setLightningTargets([]);
    setWinningNumber(null);
    setLastWinAlert(null);
    setLastBets(bets);
    setMessage('⚡ CAEN LOS RAYOS MULTIPLICADORES RELÁMPAGO ⚡');

    soundEngine.playButtonClick();

    try {
      const res = await fetch('/api/roulette/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, bets }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || 'Error al procesar el giro de ruleta');
        setIsSpinning(false);
        return;
      }

      // Show Lightning strike targets
      setLightningTargets(data.lightningNumbers || []);
      soundEngine.playBonusShoot();

      // Animate wheel rotation and ball physics
      const winIdx = WHEEL_NUMBERS.indexOf(data.winningNumber);
      const slice = (Math.PI * 2) / 37;
      
      const canvas = canvasRef.current;
      const size = canvas ? canvas.width : 250;
      const center = size / 2;
      const outerTrackRadius = center - 18;
      const pocketTrackRadius = center - 38;

      const fullWheelRotations = 5;
      const targetWheelAngle = Math.PI * 2 * fullWheelRotations;
      const finalPocketAngle = targetWheelAngle + (winIdx + 0.5) * slice;

      // Ball starts spinning opposite direction on outer track
      const fullBallRotations = 10;
      const startBallAngle = finalPocketAngle - (Math.PI * 2 * fullBallRotations);

      let start: number | null = null;
      const duration = 4500; // 4.5 seconds realistic spin

      const animateWheel = (time: number) => {
        if (!start) start = time;
        const progress = Math.min((time - start) / duration, 1);

        // Cubic Ease Out for natural deceleration
        const easeOutWheel = 1 - Math.pow(1 - progress, 3);
        const easeOutBall = 1 - Math.pow(1 - progress, 4);

        const currentWheelAngle = targetWheelAngle * easeOutWheel;
        const currentBallAngle = startBallAngle + (finalPocketAngle - startBallAngle) * easeOutBall;

        // Ball drops from outer track to pocket track near the end with bouncing
        let currentRadius = outerTrackRadius;
        if (progress > 0.65) {
          const dropProgress = (progress - 0.65) / 0.35;
          const bounce = Math.sin(dropProgress * Math.PI * 5) * (1 - dropProgress) * 5;
          currentRadius = outerTrackRadius - (outerTrackRadius - pocketTrackRadius) * dropProgress + bounce;
        }

        setWheelAngle(currentWheelAngle);
        setBallAngle(currentBallAngle);
        setBallRadius(currentRadius);

        if (progress < 1) {
          requestAnimationFrame(animateWheel);
        } else {
          setWinningNumber(data.winningNumber);
          setBallAngle(finalPocketAngle);
          setBallRadius(pocketTrackRadius);
          setIsSpinning(false);
          onBalanceUpdated();

          setHistory(prev => [{ num: data.winningNumber, color: data.color }, ...prev.slice(0, 7)]);

          if (data.totalWin > 0) {
            soundEngine.playWin();
            confetti({ particleCount: 140, spread: 100, origin: { y: 0.5 } });
            
            const isLightningHit = (data.lightningNumbers || []).some((l: { number: number }) => l.number === data.winningNumber);
            setLastWinAlert({ win: data.totalWin, isLightning: isLightningHit });
            setMessage(`🎉 ¡GANASTE +${data.totalWin.toLocaleString()} PTS EN LA RULETA! 🎉`);
          } else {
            setMessage(`Salió el N° ${data.winningNumber} (${data.color.toUpperCase()})`);
          }
        }
      };

      requestAnimationFrame(animateWheel);
    } catch {
      setMessage('Error de conexión');
      setIsSpinning(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between sticky top-0 z-50">
        <button
          onClick={onReturnToLobby}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> LOBBY
        </button>

        <div className="text-center">
          <h1 className="font-black text-amber-300 font-mono tracking-widest text-sm sm:text-base flex items-center gap-2 justify-center">
            ⚡ RULETA RELÁMPAGO VIP ⚡
          </h1>
          <span className="text-[10px] text-amber-400/80 font-mono uppercase block">HASTA 500x EN NÚMEROS DIRECTOS</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfoModal(true)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-bold rounded-xl flex items-center gap-1 border border-cyan-500/30"
            title="Información del Juego"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" /> INFO
          </button>

          <div className="px-3.5 py-1.5 bg-slate-950 border border-amber-500/40 rounded-xl font-mono text-xs">
            <span className="text-slate-400">PTS: </span>
            <span className="text-amber-300 font-black text-sm">{user.balance.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* Main Wheel & Betting Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-2 sm:p-4 space-y-4 relative">
        
        {/* Prominent Win Alert Banner */}
        {lastWinAlert && (
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 rounded-2xl p-4 shadow-2xl border-2 border-white animate-bounce flex items-center justify-between gap-3 font-mono">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-950 text-amber-400 rounded-xl">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider block text-slate-900">
                  {lastWinAlert.isLightning ? '⚡ ¡IMPACTO RELÁMPAGO VIP! ⚡' : '¡¡FELICIDADES! ¡GANASTE!!'}
                </span>
                <span className="text-2xl font-black text-slate-950">
                  +{lastWinAlert.win.toLocaleString()} PTS
                </span>
              </div>
            </div>
            <button
              onClick={() => setLastWinAlert(null)}
              className="p-1.5 bg-slate-950 text-amber-300 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Top Status & Wheel Section */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-6 bg-slate-900 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl">
          {/* Wheel Canvas */}
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center shrink-0">
            <canvas ref={canvasRef} width={250} height={250} className="w-full h-full" />
            {winningNumber !== null && (
              <div className="absolute inset-0 m-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-950 border-2 border-amber-400 text-amber-300 font-mono font-black text-xl sm:text-2xl flex items-center justify-center shadow-xl animate-bounce">
                {winningNumber}
              </div>
            )}
          </div>

          {/* Lightning Multipliers Display */}
          <div className="space-y-2 sm:space-y-3 text-center md:text-left flex-1 w-full">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">
              ⚡ MULTIPLICADORES RELÁMPAGO DE LA RONDA:
            </span>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2">
              {lightningTargets.length === 0 ? (
                <span className="text-xs text-slate-500 font-mono italic">Gire para generar números relámpago</span>
              ) : (
                lightningTargets.map((lt, i) => (
                  <div
                    key={i}
                    className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-black font-mono text-[10px] sm:text-xs shadow-md flex items-center gap-1 ${
                      winningNumber === lt.number
                        ? 'bg-emerald-400 text-slate-950 ring-2 sm:ring-4 ring-emerald-300 animate-pulse'
                        : 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 animate-pulse'
                    }`}
                  >
                    <span>N° {lt.number}</span>
                    <span className="text-white bg-slate-950 px-1 py-0.5 rounded font-black text-[9px]">
                      {lt.multiplier}x
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Recent History */}
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-center md:justify-start gap-1.5">
              <span className="text-[9px] font-mono text-slate-400 uppercase">HISTORIAL:</span>
              <div className="flex items-center gap-1 overflow-x-auto">
                {history.map((h, idx) => (
                  <span
                    key={idx}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white shrink-0 ${
                      h.color === 'red' ? 'bg-red-600' : h.color === 'black' ? 'bg-slate-950 border border-slate-700' : 'bg-emerald-600'
                    }`}
                  >
                    {h.num}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        <div className="bg-amber-950/80 border border-amber-500/30 rounded-2xl p-2 sm:p-2.5 text-center font-mono text-xs text-amber-300 font-bold">
          {message}
        </div>

        {/* Interactive Betting Table (3x12 Grid) */}
        <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl p-2 sm:p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[9px] font-mono text-amber-400/80 px-1">
            <span>MESA DE APUESTAS</span>
            <span className="animate-pulse">Desliza la mesa ↔</span>
          </div>
          <div className="overflow-x-auto pb-1 touch-pan-x">
            <div className="min-w-[580px] space-y-1.5 select-none">
              {/* Numbers Grid */}
              <div className="grid grid-cols-13 gap-1 text-center font-mono font-bold text-xs">
                {/* Zero */}
                <button
                  onClick={() => handlePlaceBet('n_0')}
                  className={`row-span-3 rounded-xl flex flex-col items-center justify-center p-2 border relative transition-all ${
                    winningNumber === 0
                      ? 'bg-amber-400 text-slate-950 border-white ring-4 ring-amber-300 scale-105 z-10 font-black'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                  }`}
                >
                  <span>0</span>
                  {bets['n_0'] && (
                    <span className="bg-amber-400 text-slate-950 text-[9px] px-1 rounded font-black mt-1">
                      {bets['n_0'] >= 1000 ? `${(bets['n_0'] / 1000).toFixed(0)}k` : `${bets['n_0']}`}
                    </span>
                  )}
                </button>

                {/* 36 Numbers Grid */}
                {Array.from({ length: 36 }, (_, i) => i + 1).map(num => {
                  const isRed = RED_NUMBERS.includes(num);
                  const betVal = bets[`n_${num}`];
                  const isWinner = winningNumber === num;

                  return (
                    <button
                      key={num}
                      onClick={() => handlePlaceBet(`n_${num}`)}
                      className={`h-12 rounded-xl flex flex-col items-center justify-center font-black transition-all border ${
                        isWinner
                          ? 'bg-amber-400 text-slate-950 border-white ring-4 ring-amber-300 scale-105 z-10 shadow-lg'
                          : isRed
                          ? 'bg-red-600/90 hover:bg-red-500 text-white border-red-400/50'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-100 border-slate-700'
                      }`}
                    >
                      <span>{num}</span>
                      {betVal && (
                        <span className="bg-amber-400 text-slate-950 text-[9px] px-1 rounded font-black mt-0.5">
                          {betVal >= 1000 ? `${(betVal / 1000).toFixed(0)}k` : `${betVal}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Outside Dozens & Colors */}
              <div className="grid grid-cols-3 gap-1 font-mono text-xs font-bold text-slate-200">
                <button
                  onClick={() => handlePlaceBet('doc_1')}
                  className="py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 relative"
                >
                  1ª 12 (1-12)
                  {bets['doc_1'] && (
                    <span className="ml-1 bg-amber-400 text-slate-950 text-[9px] px-1 rounded">
                      {bets['doc_1'] >= 1000 ? `${(bets['doc_1'] / 1000).toFixed(0)}k` : `${bets['doc_1']}`}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handlePlaceBet('doc_2')}
                  className="py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 relative"
                >
                  2ª 12 (13-24)
                  {bets['doc_2'] && (
                    <span className="ml-1 bg-amber-400 text-slate-950 text-[9px] px-1 rounded">
                      {bets['doc_2'] >= 1000 ? `${(bets['doc_2'] / 1000).toFixed(0)}k` : `${bets['doc_2']}`}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handlePlaceBet('doc_3')}
                  className="py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 relative"
                >
                  3ª 12 (25-36)
                  {bets['doc_3'] && (
                    <span className="ml-1 bg-amber-400 text-slate-950 text-[9px] px-1 rounded">
                      {bets['doc_3'] >= 1000 ? `${(bets['doc_3'] / 1000).toFixed(0)}k` : `${bets['doc_3']}`}
                    </span>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-6 gap-1 font-mono text-xs font-bold">
                <button onClick={() => handlePlaceBet('low')} className="py-2 bg-slate-800 rounded-xl border border-slate-700">1-18</button>
                <button onClick={() => handlePlaceBet('even')} className="py-2 bg-slate-800 rounded-xl border border-slate-700">PAR</button>
                <button onClick={() => handlePlaceBet('red')} className="py-2 bg-red-600/80 hover:bg-red-500 rounded-xl text-white">ROJO</button>
                <button onClick={() => handlePlaceBet('black')} className="py-2 bg-slate-950 hover:bg-slate-800 rounded-xl text-white border border-slate-700">NEGRO</button>
                <button onClick={() => handlePlaceBet('odd')} className="py-2 bg-slate-800 rounded-xl border border-slate-700">IMPAR</button>
                <button onClick={() => handlePlaceBet('high')} className="py-2 bg-slate-800 rounded-xl border border-slate-700">19-36</button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Chips Selector & Spin Controls */}
      <footer className="bg-slate-900 border-t border-amber-500/30 p-3 sticky bottom-0 z-50">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Chip Selection */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-xs font-mono text-slate-400 uppercase mr-1">FICHA:</span>
            {CHIP_VALUES.map(chip => (
              <button
                key={chip}
                onClick={() => setSelectedChip(chip)}
                className={`w-10 h-10 rounded-full font-mono text-xs font-black border-2 flex items-center justify-center transition-transform ${
                  selectedChip === chip
                    ? 'bg-amber-400 text-slate-950 border-white scale-110 shadow-lg'
                    : 'bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-700'
                }`}
              >
                {chip >= 1000 ? `${(chip / 1000).toFixed(0)}k` : `${chip}`}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearBets}
              disabled={isSpinning}
              className="p-2.5 bg-slate-800 hover:bg-red-900/50 text-slate-300 rounded-xl border border-slate-700"
              title="Borrar Apuestas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRepeatBets}
              disabled={isSpinning}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
              title="Repetir Apuesta"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleSpin}
              disabled={isSpinning || totalBet <= 0}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 font-mono uppercase text-xs sm:text-sm tracking-wider flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              {isSpinning ? 'GIRANDO...' : `GIRAR RULETA (${totalBet.toLocaleString()} PTS)`}
            </button>
          </div>
        </div>
      </footer>

      {/* Game Info Modal */}
      <GameInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        gameId="roulette"
      />
    </div>
  );
};

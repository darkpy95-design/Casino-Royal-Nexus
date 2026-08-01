import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, HelpCircle, AlertCircle, ShoppingBag, CheckCircle2, Award } from 'lucide-react';
import { soundEngine } from '../audio';
import { GameInfoModal } from './GameInfoModal';

interface ScratchTicketData {
  ticketId: string;
  winAmount: number;
  grid: number[];
}

interface ScratchBankrollStatus {
  ticketPrice: number;
  totalTicketsSold: number;
  totalRevenue: number;
  totalPaidOut: number;
  houseProfit: number;
  availablePrizeCapital: number;
  maxUnlockedPrize: number;
}

interface ScratchCardGameProps {
  user: { id: string; role: 'admin' | 'client'; balance: number };
  onReturnToLobby: () => void;
  onBalanceUpdated: () => void;
}

export const ScratchCardGame: React.FC<ScratchCardGameProps> = ({
  user,
  onReturnToLobby,
  onBalanceUpdated,
}) => {
  // Bankroll & Status State
  const [bankrollStatus, setBankrollStatus] = useState<ScratchBankrollStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Active Game State
  const [currentTicket, setCurrentTicket] = useState<ScratchTicketData | null>(null);
  const [scratchedCells, setScratchedCells] = useState<boolean[]>(Array(9).fill(false));
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [isBuying, setIsBuying] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [winMessage, setWinMessage] = useState<{ amount: number; text: string } | null>(null);

  // Canvas Scratching Refs
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const scratchedCellsRef = useRef<boolean[]>(Array(9).fill(false));
  const isScratchingRef = useRef<boolean>(false);

  // Fetch Bankroll Status
  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/scratch/status');
      const data = await res.json();
      if (data) {
        setBankrollStatus(data);
      }
    } catch {
      // Offline fallback
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Canvas Foil for cell
  const initCanvasCell = (index: number) => {
    const canvas = canvasRefs.current[index];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw Metallic Gold Foil
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.3, '#fbbf24');
    grad.addColorStop(0.5, '#d97706');
    grad.addColorStop(0.8, '#fef08a');
    grad.addColorStop(1, '#b45309');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Add Foil Text Label
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RASPAR', width / 2, height / 2);
  };

  useEffect(() => {
    if (currentTicket) {
      scratchedCellsRef.current = Array(9).fill(false);
      setScratchedCells(Array(9).fill(false));
      for (let i = 0; i < 9; i++) {
        initCanvasCell(i);
      }
    }
  }, [currentTicket?.ticketId]);

  // Scratch Action Handler
  const scratchAtPoint = (index: number, e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isRevealed || !currentTicket || scratchedCellsRef.current[index]) return;

    const canvas = canvasRefs.current[index];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    } else {
      return;
    }

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Check transparency ratio
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentPixels = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparentPixels++;
    }

    const percentScratched = transparentPixels / (canvas.width * canvas.height);

    // Require at least 45% scratched before cell is fully cleared
    if (percentScratched >= 0.45) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!scratchedCellsRef.current[index]) {
        scratchedCellsRef.current[index] = true;
        setScratchedCells([...scratchedCellsRef.current]);
        soundEngine.playButtonClick();
        checkWinState();
      }
    }
  };

  const startScratch = (index: number, e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isScratchingRef.current = true;
    scratchAtPoint(index, e);
  };

  const moveScratch = (index: number, e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isScratchingRef.current) {
      scratchAtPoint(index, e);
    }
  };

  const stopScratch = () => {
    isScratchingRef.current = false;
  };

  // Check win state: if 3 matching cells are scratched OR all 9 cells are scratched, verify automatically
  const checkWinState = () => {
    if (!currentTicket || isRevealed) return;

    const scratchedIndices = scratchedCellsRef.current
      .map((scratched, idx) => (scratched ? idx : -1))
      .filter(idx => idx !== -1);

    const scratchedValues = scratchedIndices.map(idx => currentTicket.grid[idx]);
    const valCounts: Record<number, number> = {};
    let hasThreeMatches = false;

    scratchedValues.forEach(val => {
      if (val > 0) {
        valCounts[val] = (valCounts[val] || 0) + 1;
        if (valCounts[val] >= 3) {
          hasThreeMatches = true;
        }
      }
    });

    if (hasThreeMatches || scratchedIndices.length >= 9) {
      handleVerifyAndClaim();
    }
  };

  // Process Win / Claim
  const processTicketWin = async (ticket: ScratchTicketData) => {
    // Re-verify grid 3-match
    const gridCounts: Record<number, number> = {};
    ticket.grid.forEach(v => { gridCounts[v] = (gridCounts[v] || 0) + 1; });
    let gridWin = 0;
    Object.entries(gridCounts).forEach(([valStr, count]) => {
      if (count >= 3 && Number(valStr) > 0) {
        gridWin = Number(valStr);
      }
    });

    const claimAmount = gridWin > 0 ? gridWin : ticket.winAmount;

    if (claimAmount > 0) {
      soundEngine.playJackpot();
      setWinMessage({
        amount: claimAmount,
        text: `¡FELICIDADES! ¡3 COINCIDENCIAS VERIFICADAS! +${claimAmount.toLocaleString('es-ES')} PTS ACREDITADOS`,
      });

      try {
        await fetch('/api/scratch/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, winAmount: claimAmount }),
        });
        onBalanceUpdated();
        fetchStatus();
      } catch {
        // Fallback
      }
    } else {
      soundEngine.playButtonClick();
      setWinMessage({
        amount: 0,
        text: '¡Verificación completada! No hubo 3 coincidencias en este boleto. ¡Sigue intentando!',
      });
    }
  };

  // Verify and Claim Prize Button Handler
  const handleVerifyAndClaim = () => {
    if (!currentTicket || isRevealed) return;

    soundEngine.playButtonClick();
    scratchedCellsRef.current = Array(9).fill(true);
    setScratchedCells(Array(9).fill(true));

    // Clear foil canvas for all 9 cells so all numbers are clearly visible
    canvasRefs.current.forEach(canvas => {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    setIsRevealed(true);
    processTicketWin(currentTicket);
  };

  // Buy New Ticket
  const handleBuyTicket = async () => {
    if (isBuying) return;

    const ticketPrice = bankrollStatus?.ticketPrice || 5000;

    if (user.balance < ticketPrice) {
      setErrorMsg(`Puntos insuficientes. Necesitas ${ticketPrice.toLocaleString()} pts.`);
      soundEngine.playButtonClick();
      return;
    }

    setIsBuying(true);
    setErrorMsg(null);
    setWinMessage(null);
    setIsRevealed(false);
    setScratchedCells(Array(9).fill(false));

    try {
      const res = await fetch('/api/scratch/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Error al comprar el boleto');
        setIsBuying(false);
        return;
      }

      setCurrentTicket(data.ticket);
      onBalanceUpdated();
      fetchStatus();
      soundEngine.playCoinCollect();
    } catch {
      setErrorMsg('Error de conexión con el servidor');
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Bar */}
      <header className="w-full bg-slate-900 border-b border-amber-500/20 px-3 py-2.5 sticky top-0 z-40 shadow-xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <button
            onClick={onReturnToLobby}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl border border-amber-500/30 text-xs font-mono uppercase transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Lobby
          </button>

          <div className="text-center">
            <h1 className="font-black text-amber-300 font-mono tracking-wider text-sm leading-none flex items-center gap-1 justify-center">
              🎟️ RASPA Y GANA ROYALE
            </h1>
            <span className="text-[10px] text-amber-400/80 font-mono block mt-0.5 uppercase">
              Boleto Inteligente
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl border border-cyan-500/30 text-xs font-mono uppercase transition-colors flex items-center gap-1"
              title="Información del Juego"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> INFO
            </button>

            <div className="px-2.5 py-1 bg-slate-950 border border-emerald-500/40 rounded-xl flex items-center gap-1 font-mono text-xs">
              <span className="text-emerald-400 font-bold">PTS:</span>
              <span className="font-black text-emerald-300">{user.balance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Container */}
      <main className="flex-1 max-w-md w-full mx-auto p-3 sm:p-4 flex flex-col justify-between space-y-4">
        {/* Real-time Financial Capital Protection Banner (ADMIN ONLY) */}
        {user.role === 'admin' && (
          <div className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-3 shadow-lg font-mono text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <div>
                  <span className="text-purple-300 block text-[9px] uppercase font-bold">MONITOR ADMIN: CAPITAL Y BANCA</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {bankrollStatus?.availablePrizeCapital.toLocaleString() ?? '0'} PTS
                  </span>
                </div>
              </div>

              <button
                onClick={fetchStatus}
                disabled={isRefreshing}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-colors"
                title="Actualizar Estado de Banca"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block">Boletas Vendidas:</span>
                <span className="text-amber-300 font-bold">{bankrollStatus?.totalTicketsSold ?? 0}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Máximo Premio Desbloqueado:</span>
                <span className="text-yellow-400 font-bold">{(bankrollStatus?.maxUnlockedPrize ?? 10000).toLocaleString()} PTS</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl flex items-center gap-2 text-xs text-red-300 font-mono animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scratch Card Ticket Canvas Area */}
        <div className="bg-gradient-to-b from-amber-950 via-slate-900 to-amber-950 border-2 border-amber-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
          {/* Ticket Header & Golden Crown */}
          <div className="text-center space-y-1 mb-4 border-b border-amber-500/30 pb-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 font-bold text-xl shadow-md">
              👑
            </div>
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 font-mono uppercase tracking-wider">
              GRAN RASPA Y GANA
            </h2>
            <p className="text-[11px] text-amber-200/90 font-mono font-bold">
              ¡RASPA CON EL DEDO Y ACIERTA 3 VALORES IGUALES!
            </p>
          </div>

          {currentTicket ? (
            /* Ticket Active Scratch Grid */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 px-1">
                <span className="font-bold text-amber-400">BOLETO #{currentTicket.ticketId}</span>
                <span>¡RASPA LOS 9 CUADROS!</span>
              </div>

              {/* 3x3 Grid Cells */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {currentTicket.grid.map((val, idx) => {
                  const valCount = currentTicket.grid.filter(v => v === val).length;
                  const isMatch = (currentTicket.winAmount > 0 && val === currentTicket.winAmount) || valCount >= 3;
                  const isHighlighted = isMatch && isRevealed;

                  return (
                    <div
                      key={idx}
                      className={`aspect-square relative rounded-2xl border-2 flex flex-col items-center justify-center p-1 shadow-inner overflow-hidden select-none transition-all duration-300 ${
                        isHighlighted
                          ? 'bg-gradient-to-b from-emerald-900 via-slate-900 to-emerald-950 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.8)] ring-2 ring-yellow-400 scale-[1.03] z-10'
                          : 'bg-slate-950 border-amber-500/40'
                      }`}
                    >
                      {/* Winner Badge on Cell */}
                      {isHighlighted && (
                        <div className="absolute top-1 right-1 bg-yellow-400 text-slate-950 text-[8px] font-black font-mono px-1 py-0.2 rounded-full uppercase shadow-md animate-pulse">
                          ¡GANÓ!
                        </div>
                      )}

                      {/* Value Revealed Underneath */}
                      <div className="text-center space-y-0.5">
                        <span className={`text-lg block transition-transform ${isHighlighted ? 'scale-125 animate-bounce' : ''}`}>
                          {isHighlighted ? '🏆' : '💎'}
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-black font-mono tracking-tight leading-none block ${
                            isHighlighted ? 'text-yellow-300 text-sm sm:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-amber-300'
                          }`}
                        >
                          {val.toLocaleString()}
                        </span>
                        <span className={`text-[9px] font-mono block ${isHighlighted ? 'text-emerald-300 font-bold' : 'text-amber-400/80'}`}>
                          PTS
                        </span>
                      </div>

                      {/* Canvas Scratch Foil Overlay */}
                      <canvas
                        ref={el => (canvasRefs.current[idx] = el)}
                        width={100}
                        height={100}
                        onMouseDown={e => startScratch(idx, e)}
                        onTouchStart={e => startScratch(idx, e)}
                        onMouseMove={e => moveScratch(idx, e)}
                        onTouchMove={e => moveScratch(idx, e)}
                        onMouseUp={stopScratch}
                        onTouchEnd={stopScratch}
                        onMouseLeave={stopScratch}
                        className={`absolute inset-0 w-full h-full cursor-pointer touch-none transition-opacity duration-300 ${
                          scratchedCells[idx] ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Verify & Claim Button */}
              <button
                onClick={handleVerifyAndClaim}
                disabled={isRevealed}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-white border border-emerald-400/60 rounded-xl text-xs sm:text-sm font-mono font-black uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4 text-yellow-300 fill-emerald-950" /> VERIFICAR Y COBRAR
              </button>
            </div>
          ) : (
            /* No Ticket Purchased Yet State */
            <div className="py-10 text-center space-y-4">
              <div className="text-5xl animate-bounce">🎟️</div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-amber-300 font-mono uppercase">
                  ¡ADQUIERE TU BOLETO DE LA SUERTE!
                </h3>
                <p className="text-xs text-slate-300 font-sans max-w-xs mx-auto">
                  Toca el botón abajo para comprar tu boleto por <strong>5.000 Puntos</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Result Win Message Banner */}
        {winMessage && (
          <div
            className={`p-4 rounded-2xl border text-center font-mono space-y-1 animate-fade-in shadow-xl ${
              winMessage.amount > 0
                ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-900 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="text-2xl">{winMessage.amount > 0 ? '🎉 🏆 🎉' : '👀'}</div>
            <p className="text-xs font-bold leading-relaxed">{winMessage.text}</p>
          </div>
        )}

        {/* Action Button: Buy Ticket */}
        <div className="pt-2">
          <button
            onClick={handleBuyTicket}
            disabled={isBuying}
            className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 uppercase font-mono tracking-wider text-sm sm:text-base transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isBuying ? (
              <span className="animate-spin text-xl">⏳</span>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5 fill-current" /> COMPRAR BOLETO (5.000 PTS)
              </>
            )}
          </button>
        </div>
      </main>

      {/* Game Info Modal */}
      <GameInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        gameId="scratch"
      />
    </div>
  );
};

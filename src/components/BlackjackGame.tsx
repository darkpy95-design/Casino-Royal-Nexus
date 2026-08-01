import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, Zap, Award, Layers, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../audio';
import { GameInfoModal } from './GameInfoModal';

interface BlackjackGameProps {
  user: { id: string; balance: number };
  onReturnToLobby: () => void;
  onBalanceUpdated: () => void;
}

export interface BlackjackCard {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  weight: number;
}

const CHIP_VALUES = [200, 500, 1000, 2500, 5000, 10000];

export const BlackjackGame: React.FC<BlackjackGameProps> = ({
  user,
  onReturnToLobby,
  onBalanceUpdated,
}) => {
  const [selectedBet, setSelectedBet] = useState<number>(200);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [playerHand, setPlayerHand] = useState<BlackjackCard[]>([]);
  const [dealerHand, setDealerHand] = useState<BlackjackCard[]>([]);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [dealerScore, setDealerScore] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<
    'idle' | 'playing' | 'player_won' | 'dealer_won' | 'push' | 'blackjack'
  >('idle');
  const [isDealerHidden, setIsDealerHidden] = useState<boolean>(true);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('¡ELIGA SU APUESTA Y REPARTA CARAS!');

  const handleDeal = async () => {
    if (user.balance < selectedBet) {
      setMessage('¡Puntos insuficientes para realizar esta apuesta!');
      return;
    }

    soundEngine.playButtonClick();
    setGameStatus('playing');
    setMessage('Repartiendo cartas...');
    setIsDealerHidden(true);

    try {
      const res = await fetch('/api/blackjack/deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, bet: selectedBet }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || 'Error al iniciar la mano de Blackjack');
        setGameStatus('idle');
        return;
      }

      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setPlayerScore(data.playerScore);
      setDealerScore(data.dealerScore);
      setCurrentBet(data.bet);
      setGameStatus(data.status);
      setIsDealerHidden(data.isDealerHidden);
      onBalanceUpdated();

      if (data.status === 'blackjack') {
        soundEngine.playJackpot();
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        setMessage(`🎉 ¡BLACKJACK 21 NATURAL! GANASTE +${data.winAmount.toLocaleString()} PTS 🎉`);
      } else if (data.status === 'push') {
        setMessage('¡Empate! Se devuelve la apuesta');
      } else {
        setMessage('Elija su acción: Pedir, Plantarse o Doblar');
      }
    } catch {
      setMessage('Error de conexión');
      setGameStatus('idle');
    }
  };

  const handleAction = async (action: 'hit' | 'stand' | 'double') => {
    if (gameStatus !== 'playing') return;

    soundEngine.playButtonClick();

    try {
      const res = await fetch('/api/blackjack/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data.error || 'Acción no válida');
        return;
      }

      setPlayerHand(data.playerHand);
      setDealerHand(data.dealerHand);
      setPlayerScore(data.playerScore);
      setDealerScore(data.dealerScore);
      setGameStatus(data.status);
      setCurrentBet(data.bet);
      setIsDealerHidden(false);
      onBalanceUpdated();

      if (data.status === 'player_won') {
        soundEngine.playWin();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        setMessage(`✨ ¡GANASTE LA MANO! +${data.winAmount.toLocaleString()} PTS ✨`);
      } else if (data.status === 'dealer_won') {
        setMessage('Gana la banca esta mano');
      } else if (data.status === 'push') {
        setMessage('Empate - Apuesta reembolsada');
      } else {
        setMessage(`Pediste carta. Total: ${data.playerScore}`);
      }
    } catch {
      setMessage('Error de conexión');
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
            🃏 BLACKJACK ROYALE 21 🃏
          </h1>
          <span className="text-[10px] text-amber-400/80 font-mono uppercase block">LA BANCA SE PLANTA EN 17</span>
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

      {/* Main Felt Table Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col justify-between items-center space-y-6">
        {/* Felt Table Board */}
        <div className="w-full bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 border-4 border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-8 relative overflow-hidden">
          {/* Dealer Area */}
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-950/80 border border-amber-500/30 font-mono text-xs font-bold text-amber-300">
              <span>BANCA (CASA)</span>
              {!isDealerHidden && <span>[{dealerScore}]</span>}
            </div>

            {/* Dealer Cards Container */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 min-h-24 sm:min-h-28 overflow-x-auto py-1">
              {dealerHand.length === 0 ? (
                <div className="w-14 sm:w-20 h-20 sm:h-28 border-2 border-dashed border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-500/40 font-mono text-[10px] sm:text-xs">
                  BANCA
                </div>
              ) : (
                dealerHand.map((card, idx) => {
                  if (idx === 1 && isDealerHidden) {
                    return (
                      <div
                        key={idx}
                        className="w-14 sm:w-20 h-20 sm:h-28 bg-gradient-to-br from-amber-700 via-yellow-600 to-amber-900 border-2 border-amber-300 rounded-xl shadow-lg flex items-center justify-center font-mono font-black text-xl sm:text-2xl text-slate-950 select-none animate-pulse shrink-0"
                      >
                        🎴
                      </div>
                    );
                  }

                  const isRed = ['♥', '♦'].includes(card.suit);
                  return (
                    <div
                      key={idx}
                      className="w-14 sm:w-20 h-20 sm:h-28 bg-white text-slate-950 border-2 border-slate-300 rounded-xl shadow-xl flex flex-col justify-between p-1.5 font-mono select-none shrink-0"
                    >
                      <div className={`text-[10px] sm:text-xs font-black ${isRed ? 'text-red-600' : 'text-slate-950'}`}>
                        {card.value}
                      </div>
                      <div className={`text-xl sm:text-3xl text-center ${isRed ? 'text-red-600' : 'text-slate-950'}`}>
                        {card.suit}
                      </div>
                      <div className={`text-[10px] sm:text-xs font-black text-right ${isRed ? 'text-red-600' : 'text-slate-950'}`}>
                        {card.value}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Status Message Banner */}
          <div className="bg-slate-950/90 border border-amber-400/40 rounded-2xl p-2.5 text-center font-mono text-xs sm:text-sm text-amber-300 font-bold shadow-lg">
            {message}
          </div>

          {/* Player Area */}
          <div className="space-y-2 text-center">
            {/* Player Cards Container */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 min-h-24 sm:min-h-28 overflow-x-auto py-1">
              {playerHand.length === 0 ? (
                <div className="w-14 sm:w-20 h-20 sm:h-28 border-2 border-dashed border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-500/40 font-mono text-[10px] sm:text-xs">
                  JUGADOR
                </div>
              ) : (
                playerHand.map((card, idx) => {
                  const isRed = ['♥', '♦'].includes(card.suit);
                  return (
                    <div
                      key={idx}
                      className="w-14 sm:w-20 h-20 sm:h-28 bg-white text-slate-950 border-2 border-slate-300 rounded-xl shadow-xl flex flex-col justify-between p-1.5 font-mono select-none transform hover:-translate-y-1 transition-transform shrink-0"
                    >
                      <div className={`text-[10px] sm:text-xs font-black ${isRed ? 'text-red-600' : 'text-slate-950'}`}>
                        {card.value}
                      </div>
                      <div className={`text-xl sm:text-3xl text-center ${isRed ? 'text-red-600' : 'text-slate-950'}`}>
                        {card.suit}
                      </div>
                      <div className={`text-[10px] sm:text-xs font-black text-right ${isRed ? 'text-red-600' : 'text-slate-950'}`}>
                        {card.value}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-950/80 border border-amber-500/30 font-mono text-xs font-bold text-amber-300">
              <span>SUS CARTAS</span>
              {playerHand.length > 0 && <span>[{playerScore}]</span>}
            </div>
          </div>
        </div>
      </main>

      {/* Game Action Controls & Chips Bar */}
      <footer className="bg-slate-900 border-t border-amber-500/30 p-3 sticky bottom-0 z-50">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Chip Selection */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-xs font-mono text-slate-400 uppercase mr-1">APUESTA:</span>
            {CHIP_VALUES.map(chip => (
              <button
                key={chip}
                onClick={() => setSelectedBet(chip)}
                disabled={gameStatus === 'playing'}
                className={`w-10 h-10 rounded-full font-mono text-xs font-black border-2 flex items-center justify-center transition-transform ${
                  selectedBet === chip
                    ? 'bg-amber-400 text-slate-950 border-white scale-110 shadow-lg'
                    : 'bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-700'
                }`}
              >
                {(chip / 1000).toFixed(0)}k
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {gameStatus !== 'playing' ? (
              <button
                onClick={handleDeal}
                className="px-8 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 font-mono uppercase text-xs sm:text-sm tracking-wider flex items-center gap-2 transition-transform active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current" /> REPARTIR ({selectedBet.toLocaleString()} PTS)
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleAction('hit')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl font-mono text-xs uppercase shadow-md"
                >
                  PEDIR
                </button>
                <button
                  onClick={() => handleAction('stand')}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl font-mono text-xs uppercase shadow-md"
                >
                  PLANTARSE
                </button>
                <button
                  onClick={() => handleAction('double')}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl font-mono text-xs uppercase shadow-md"
                >
                  DOBLAR
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Game Info Modal */}
      <GameInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        gameId="blackjack"
      />
    </div>
  );
};

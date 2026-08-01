import React from 'react';
import { BET_CATEGORIES_INFO } from '../data/slotsData';
import { BetState, BetKey } from '../types';
import { soundEngine } from '../audio';
import { Play } from 'lucide-react';
import { FruitIcon } from './FruitIcon';

interface BettingBoardProps {
  bets: BetState;
  onSetBet: (key: BetKey, amount: number) => void;
  onMaxBet?: () => void;
  onSpin: () => void;
  isSpinning: boolean;
  totalBet: number;
  lastWinAmount: number;
}

export const BettingBoard: React.FC<BettingBoardProps> = ({
  bets,
  onSetBet,
  onSpin,
  isSpinning,
  totalBet,
  lastWinAmount,
}) => {
  // Includes all 8 betting categories
  const bettingCategories = BET_CATEGORIES_INFO;

  // Increment by 1000 per tap
  const handleTileClick = (key: BetKey) => {
    if (isSpinning) return;
    const current = bets[key] || 0;
    onSetBet(key, current + 1000);
    soundEngine.playButtonClick();
  };

  const handleTileRightClick = (e: React.MouseEvent, key: BetKey) => {
    e.preventDefault();
    if (isSpinning) return;
    const current = bets[key] || 0;
    onSetBet(key, Math.max(0, current - 1000));
    soundEngine.playButtonClick();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gradient-to-b from-slate-900 via-zinc-900 to-black border-2 border-amber-500/50 rounded-2xl p-1.5 sm:p-2 shadow-xl shrink-0 my-0.5">
      
      {/* Grid of Illuminated 8 Betting Symbol Buttons (2x4 Grid) */}
      <div className="grid grid-cols-4 gap-1 mb-1.5">
        {bettingCategories.map(cat => {
          const currentBet = bets[cat.key] || 0;
          const hasBet = currentBet > 0;

          return (
            <div
              key={cat.key}
              onClick={() => handleTileClick(cat.key)}
              onContextMenu={e => handleTileRightClick(e, cat.key)}
              className={`relative flex items-center justify-between px-1.5 py-1 rounded-xl border cursor-pointer select-none transition-all active:scale-95 group ${
                hasBet
                  ? 'bg-gradient-to-b from-amber-900/90 to-amber-950 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  : 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 hover:border-slate-600'
              } ${isSpinning ? 'pointer-events-none opacity-80' : ''}`}
            >
              <div className="flex items-center gap-1.5">
                <FruitIcon symbol={cat.key} size="sm" />
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] font-black font-mono text-amber-300">
                    {cat.maxMultiplier === 100 ? 'x100' : cat.maxMultiplier === 40 ? 'x40' : `x${cat.maxMultiplier}`}
                  </span>
                  <span className="text-[9px] font-bold text-slate-200 truncate font-mono">
                    {cat.name}
                  </span>
                </div>
              </div>

              {/* Illuminated Bet LED display */}
              <div
                className={`py-0.5 px-1.5 rounded text-center font-mono text-[10px] font-black leading-none transition-colors ${
                  hasBet
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-600 border border-slate-800'
                }`}
              >
                {currentBet}
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Panel Action Deck */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-amber-500/30">
        
        {/* Total Bet & Last Win Info */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-amber-400/90 font-bold px-1">
          <span>APUESTA: <strong className="text-white font-mono">{totalBet.toLocaleString()}</strong></span>
          {lastWinAmount > 0 && (
            <span className="text-emerald-400">GANASTE: +{lastWinAmount.toLocaleString()}</span>
          )}
        </div>

        {/* Big Physical Arcade GIRAR Push Button */}
        <button
          onClick={() => {
            onSpin();
            soundEngine.playButtonClick();
          }}
          disabled={isSpinning || totalBet <= 0}
          className={`flex items-center justify-center gap-1.5 px-6 py-2 rounded-xl font-black font-mono text-sm sm:text-base uppercase tracking-wider transition-all duration-100 shadow-lg border-2 active:scale-95 ${
            isSpinning || totalBet <= 0
              ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 text-slate-950 border-yellow-100 shadow-[0_0_15px_rgba(245,158,11,0.6)] cursor-pointer'
          }`}
        >
          <Play className={`w-4 h-4 fill-current ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? 'GIRANDO' : 'GIRAR'}</span>
        </button>

      </div>
    </div>
  );
};

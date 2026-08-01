import React, { useEffect, useRef, useState } from 'react';
import { RING_SLOTS, BET_CATEGORIES_INFO } from '../data/slotsData';
import { SpinResult, BetState } from '../types';
import { soundEngine } from '../audio';
import { SevenSegmentDisplay } from './SevenSegmentDisplay';
import { FruitIcon } from './FruitIcon';

interface FruitRingProps {
  isSpinning: boolean;
  spinResult: SpinResult | null;
  onSpinComplete: () => void;
  currentWin: number;
  totalBet: number;
  messageText: string;
  bets: BetState;
  balance: number;
  jackpotPool: number;
}

export const FruitRing: React.FC<FruitRingProps> = ({
  isSpinning,
  spinResult,
  onSpinComplete,
  currentWin,
  totalBet,
  messageText,
  bets,
  balance,
  jackpotPool,
}) => {
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [activeHitSlots, setActiveHitSlots] = useState<number[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Spin Animation Physics Variables
  const spinStateRef = useRef<{
    currentPos: number;
    speed: number;
    targetSlot: number;
    extraTargetSlots: number[];
    isStopping: boolean;
    lapsRemaining: number;
    lastTickSlot: number;
  }>({
    currentPos: 0,
    speed: 0,
    targetSlot: 0,
    extraTargetSlots: [],
    isStopping: false,
    lapsRemaining: 0,
    lastTickSlot: -1,
  });

  useEffect(() => {
    if (isSpinning && spinResult) {
      const targetMainSlot = spinResult.hitSlots[0] ?? 0;
      const extraSlots = spinResult.hitSlots.slice(1);

      spinStateRef.current = {
        currentPos: activeSlotIndex,
        speed: 0.8,
        targetSlot: targetMainSlot,
        extraTargetSlots: extraSlots,
        isStopping: false,
        lapsRemaining: 4,
        lastTickSlot: activeSlotIndex,
      };

      setActiveHitSlots([]);

      let lastTime = performance.now();

      const animateSpin = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        const state = spinStateRef.current;
        state.currentPos = (state.currentPos + state.speed) % 24;
        const currentDiscreteSlot = Math.floor(state.currentPos);

        if (currentDiscreteSlot !== state.lastTickSlot) {
          state.lastTickSlot = currentDiscreteSlot;
          const pitch = 0.8 + Math.min(state.speed, 0.6);
          soundEngine.playTick(pitch);
          setActiveSlotIndex(currentDiscreteSlot);
        }

        if (!state.isStopping) {
          if (state.speed < 1.3) {
            state.speed += 0.05;
          }

          if (state.currentPos < state.speed && state.speed > 0.5) {
            state.lapsRemaining -= 1;
            if (state.lapsRemaining <= 0) {
              state.isStopping = true;
            }
          }
        } else {
          let dist = (state.targetSlot - state.currentPos + 24) % 24;
          if (dist < 0.1 && state.speed <= 0.08) {
            setActiveSlotIndex(state.targetSlot);
            setActiveHitSlots(spinResult.hitSlots);

            if (spinResult.isMultiShoot) {
              soundEngine.playBonusShoot();
            } else if (spinResult.totalWin > 0) {
              if (spinResult.jackpotWon > 0) {
                soundEngine.playJackpot();
              } else {
                soundEngine.playWin();
              }
            }

            onSpinComplete();
            return;
          }

          state.speed = Math.max(0.04, dist * 0.08);
        }

        animFrameRef.current = requestAnimationFrame(animateSpin);
      };

      animFrameRef.current = requestAnimationFrame(animateSpin);

      return () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    }
  }, [isSpinning, spinResult]);

  const getSlotGridPosition = (index: number) => {
    // Casillas 1 to 7: Right column down (col 7, rows 1..7)
    if (index >= 0 && index <= 6) {
      return { col: 7, row: index + 1 };
    }
    // Casillas 8 to 13: Bottom row left (cols 6..1, row 7)
    if (index >= 7 && index <= 12) {
      return { col: 7 - (index - 6), row: 7 };
    }
    // Casillas 14 to 19: Left column up (col 1, rows 6..1)
    if (index >= 13 && index <= 18) {
      return { col: 1, row: 7 - (index - 12) };
    }
    // Casillas 20 to 24: Top row right (cols 2..6, row 1)
    if (index >= 19 && index <= 23) {
      return { col: (index - 18) + 1, row: 1 };
    }
    return { col: 7, row: 1 };
  };

  // All 8 bet display categories
  const betDisplayCategories = BET_CATEGORIES_INFO;

  return (
    <div className="relative w-full max-w-md mx-auto select-none my-0.5 shrink-0">
      {/* Physical Arcade Cabinet Shell */}
      <div className="relative bg-gradient-to-b from-slate-900 via-zinc-900 to-black border border-amber-600/80 rounded-2xl p-1 sm:p-2 shadow-xl overflow-hidden">
        
        {/* Cabinet Marquee Glass Top Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-950 to-amber-950 border border-amber-500/40 rounded-xl p-1 mb-1 flex items-center justify-between gap-1 shadow-inner">
          <SevenSegmentDisplay label="PREMIOS" value={currentWin} color="red" size="sm" digits={4} />
          
          <div className="text-center px-1">
            <span className="text-[8px] sm:text-[9px] font-black text-amber-400 tracking-wider block font-mono">FRUIT KING 3</span>
            <div className="px-1 py-0.5 bg-slate-950 border border-amber-400/40 rounded inline-block">
              <span className="text-[9px] font-bold font-mono text-amber-300">
                POZO: {jackpotPool.toLocaleString()}
              </span>
            </div>
          </div>

          <SevenSegmentDisplay label="CRÉDITOS" value={balance} color="red" size="sm" digits={4} />
        </div>

        {/* 7x7 Square Slot Matrix Track Grid */}
        <div className="relative grid grid-cols-7 grid-rows-7 gap-0.5 bg-slate-950 border border-amber-500/40 rounded-xl p-0.5 shadow-inner overflow-hidden">
          
          {/* Inner Artwork Graphic Center Box */}
          <div className="col-start-2 col-end-7 row-start-2 row-end-7 bg-gradient-to-br from-slate-900 via-amber-950/60 to-slate-950 border border-amber-500/30 rounded-lg p-1 flex flex-col items-center justify-between relative overflow-hidden">
            
            {/* Fruit King 3 Bezel FRUTILLA EXPLOSIÓN Lights (2, 3, 4, 5 Multi-Aciertos) */}
            <div className="flex items-center justify-center gap-1.5 z-10 my-0.5">
              {[2, 3, 4, 5].map(num => {
                const isActiveShoot = spinResult?.isMultiShoot && spinResult?.shootCount === num && activeHitSlots.length > 0;
                return (
                  <div
                    key={num}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black font-mono shadow-md transition-all ${
                      isActiveShoot
                        ? 'bg-gradient-to-r from-rose-500 to-yellow-400 border-yellow-200 text-slate-950 scale-125 shadow-[0_0_12px_#f43f5e] animate-bounce'
                        : 'bg-gradient-to-b from-slate-900 to-slate-950 border-rose-500/50 text-rose-400'
                    }`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>

            {/* Center Status Display Message */}
            <div className="z-10 text-center my-0.5 w-full">
              {activeHitSlots.length > 0 ? (
                <div className="animate-fade-in">
                  <span className="text-[8px] uppercase font-mono tracking-wider text-rose-300 bg-rose-500/30 px-1.5 py-0.5 rounded-full border border-rose-400/60 font-bold block mb-0.5">
                    {activeHitSlots.length > 1 ? `¡FRUTILLA ${activeHitSlots.length} EXPLOSIONES!` : '¡PREMIO GANADO!'}
                  </span>
                  <div className="text-sm sm:text-base font-black font-mono text-yellow-300 drop-shadow">
                    +{currentWin.toLocaleString()} <span className="text-[9px] text-amber-400">PTS</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider text-amber-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-amber-500/30 animate-pulse text-center truncate font-bold">
                    {messageText}
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono mt-0.5">
                    APUESTA: <strong className="text-amber-400">{totalBet} PTS</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Lower Center Logo */}
            <div className="z-10 border-t border-amber-500/30 pt-0.5 w-full text-center">
              <span className="text-[8px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 font-mono">
                FRUIT KING 3
              </span>
            </div>
          </div>

          {/* Render the 24 Rectangular Perimeter Track Slots */}
          {RING_SLOTS.map((slot, index) => {
            const pos = getSlotGridPosition(index);
            const isActiveLight = activeSlotIndex === index;
            const isHitSlot = activeHitSlots.includes(index);

            let slotStyleClasses = 'border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-200';
            let activeGlow = {};

            if (isHitSlot) {
              slotStyleClasses = 'border-yellow-200 bg-gradient-to-b from-yellow-300 to-amber-500 text-slate-950 scale-105 shadow-[0_0_15px_#facc15] z-30 animate-bounce font-black';
            } else if (isActiveLight) {
              slotStyleClasses = 'border-amber-300 bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 text-slate-950 scale-105 shadow-[0_0_15px_#f59e0b] z-20';
              activeGlow = { borderColor: slot.glowColor };
            } else if (slot.isBonus) {
              slotStyleClasses = 'border-purple-500/90 bg-gradient-to-b from-purple-900 via-purple-950 to-slate-950 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.6)]';
            }

            return (
              <div
                key={slot.id}
                style={{
                  gridColumnStart: pos.col,
                  gridRowStart: pos.row,
                  ...activeGlow,
                }}
                className={`flex flex-col items-center justify-between p-0.5 rounded border transition-all duration-75 text-center h-8 sm:h-10 ${slotStyleClasses}`}
              >
                <div className="flex-1 flex items-center justify-center">
                  <FruitIcon symbol={slot.symbol} size="sm" />
                </div>
                <span className={`text-[7px] sm:text-[8px] font-black font-mono leading-none py-0.5 px-0.5 rounded ${
                  isHitSlot || isActiveLight ? 'bg-slate-950/80 text-amber-300' : 'bg-slate-950/90 text-amber-400 border border-amber-500/30'
                }`}>
                  {slot.symbol === 'bar_large' ? '100K BAR' :
                   slot.symbol === 'bar_small' ? '50K BAR' :
                   slot.symbol === 'cactus' ? 'CACTUS' :
                   slot.isBonus && slot.shootCount ? `x${slot.shootCount} DISPAROS` :
                   slot.multiplier === 2 ? 'x2' :
                   `x${slot.multiplier}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Integrated Bottom Backglass Bet Counters */}
        <div className="mt-1 bg-slate-950 border border-amber-500/40 rounded-xl p-0.5 shadow-inner">
          <div className="grid grid-cols-8 gap-0.5">
            {betDisplayCategories.map(cat => {
              const currentBet = bets[cat.key] || 0;
              return (
                <div key={cat.key} className="flex flex-col items-center justify-between bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 h-11">
                  <span className="text-[7px] font-black text-amber-300 font-mono truncate w-full text-center leading-none">
                    {cat.maxMultiplier === 100 ? 'x100' : cat.maxMultiplier === 40 ? 'x40' : `x${cat.maxMultiplier}`}
                  </span>
                  
                  {/* 7-Segment Digit Counter for Bet Amount */}
                  <div className="my-0.5">
                    <SevenSegmentDisplay value={currentBet} color="red" size="sm" digits={2} />
                  </div>

                  <div>
                    <FruitIcon symbol={cat.key} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

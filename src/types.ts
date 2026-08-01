/**
 * Fruit King 3 Arcade - Global Type Definitions
 * 100% Virtual Entertainment Slot Machine
 */

export type SymbolType = 
  | 'bar_large'
  | 'bar_small'
  | 'watermelon_large'
  | 'watermelon_small'
  | 'star_large'
  | 'star_small'
  | 'pear_large'
  | 'pear_small'
  | 'apple_large'
  | 'apple_small'
  | 'lemon_large'
  | 'lemon_small'
  | 'peach_large'
  | 'peach_small'
  | 'cherry_large'
  | 'cherry_small'
  | 'cactus'
  | 'bonus_strawberry_2'
  | 'bonus_strawberry_3'
  | 'bonus_strawberry_4'
  | 'bonus_strawberry_5'
  | 'bonus_strawberry_6';

export interface RingSlot {
  id: number; // 0 to 23
  symbol: SymbolType;
  name: string;
  multiplier: number;
  betCategory: string; // matches betting key e.g. 'apple', 'lemon', etc.
  color: string;
  glowColor: string;
  isBonus?: boolean;
  isCactus?: boolean;
  shootCount?: number;
}

export type BetKey = 
  | 'bar'
  | 'watermelon'
  | 'star'
  | 'pear'
  | 'apple'
  | 'lemon'
  | 'peach'
  | 'cherry';

export interface BetState {
  bar: number;
  watermelon: number;
  star: number;
  pear: number;
  apple: number;
  lemon: number;
  peach: number;
  cherry: number;
}

export interface SpinRequest {
  bets: BetState;
  userId?: string;
}

export interface HitDetail {
  slotId: number;
  symbol: SymbolType;
  name: string;
  betCategory: string;
  multiplier: number;
  betAmount: number;
  winAmount: number;
}

export interface SpinResult {
  spinId: string;
  hitSlots: number[]; // main slot + any multi-shoot bonus slots
  hits: HitDetail[];
  totalBet: number;
  totalWin: number;
  jackpotWon: number;
  isMultiShoot: boolean;
  shootCount: number;
  isCactusHit?: boolean;
  nextSpinMultiplier?: number;
  newBalance: number;
  jackpotPool: number;
  provablyFair: {
    hash: string;
    serverSeedHash: string;
    nonce: number;
  };
  timestamp: string;
}

export interface DoubleUpResult {
  won: boolean;
  chosenCard: number;
  targetCard: number;
  prediction: 'high' | 'low';
  prevAmount: number;
  newAmount: number;
  newBalance: number;
}

export interface GameStats {
  totalSpins: number;
  totalPointsBet: number;
  totalPointsWon: number;
  jackpotsHit: number;
  currentBalance: number;
  jackpotPool: number;
  rtpSetting: number;
}

export interface RTPConfig {
  rtpTarget: number; // e.g. 95
  jackpotProbability: number; // e.g. 0.005
  multiShootProbability: number; // e.g. 0.08
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { HeaderBar } from './components/HeaderBar';
import { FruitRing } from './components/FruitRing';
import { BettingBoard } from './components/BettingBoard';
import { StatsRulesModal } from './components/StatsRulesModal';
import { FooterDisclaimer } from './components/FooterDisclaimer';
import { LoginScreen } from './components/LoginScreen';
import { GameLobby } from './components/GameLobby';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ScratchCardGame } from './components/ScratchCardGame';
import { OlympusSlotGame } from './components/OlympusSlotGame';
import { RouletteGame } from './components/RouletteGame';
import { BlackjackGame } from './components/BlackjackGame';
import { CrazyWheelGame } from './components/CrazyWheelGame';
import { ChickenRoadGame } from './components/ChickenRoadGame';
import { Classic777Game } from './components/Classic777Game';
import { BalloonGame } from './components/BalloonGame';
import { BetState, BetKey, SpinResult, GameStats } from './types';
import { soundEngine } from './audio';

const INITIAL_BETS: BetState = {
  bar: 0,
  watermelon: 0,
  star: 0,
  pear: 0,
  apple: 0,
  lemon: 0,
  peach: 0,
  cherry: 0,
};

interface UserSessionState {
  id: string;
  role: 'admin' | 'client';
  balance: number;
}

export default function App() {
  // Auth & View State
  const [currentUser, setCurrentUser] = useState<UserSessionState | null>(() => {
    try {
      const saved = localStorage.getItem('casino_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeView, setActiveView] = useState<'login' | 'lobby' | 'slots' | 'scratch' | 'olympus' | 'roulette' | 'blackjack' | 'crazy' | 'chicken' | 'classic777' | 'balloon'>(() => {
    return localStorage.getItem('casino_user') ? 'lobby' : 'login';
  });

  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [isRefreshingLobby, setIsRefreshingLobby] = useState<boolean>(false);

  // Game State
  const [balance, setBalance] = useState<number>(1000);
  const [jackpotPool, setJackpotPool] = useState<number>(25000);
  const [bets, setBets] = useState<BetState>(INITIAL_BETS);
  const [lastBets, setLastBets] = useState<BetState>(INITIAL_BETS);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [currentWin, setCurrentWin] = useState<number>(0);
  const [lastWinAmount, setLastWinAmount] = useState<number>(0);
  const [messageText, setMessageText] = useState<string>('¡ELIJA APUESTA Y GIRA!');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAutoSpin, setIsAutoSpin] = useState<boolean>(false);

  // Modals State
  const [showRules, setShowRules] = useState<boolean>(false);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);

  // Sync user balance & stats from backend
  const fetchPointsAndStats = useCallback(async () => {
    if (!currentUser) return;
    setIsRefreshingLobby(true);
    try {
      const res = await fetch(`/api/points?userId=${encodeURIComponent(currentUser.id)}`);
      const data = await res.json();
      if (data.balance !== undefined) {
        setBalance(data.balance);
        setCurrentUser(prev => prev ? { ...prev, balance: data.balance } : null);
      }
      if (data.stats) {
        setGameStats(data.stats);
        if (data.stats.jackpotPool) {
          setJackpotPool(data.stats.jackpotPool);
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setIsRefreshingLobby(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      fetchPointsAndStats();
    }
  }, [currentUser?.id, fetchPointsAndStats]);

  // Auth Handlers
  const handleLoginSuccess = (user: UserSessionState) => {
    setCurrentUser(user);
    setBalance(user.balance);
    localStorage.setItem('casino_user', JSON.stringify(user));
    setActiveView('lobby');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('casino_user');
    setActiveView('login');
    setShowAdminModal(false);
  };

  // Calculate total bet placed
  const totalBet: number = (Object.keys(bets) as BetKey[]).reduce((sum, key) => sum + (bets[key] || 0), 0);

  // Bet Manipulation Handlers with Immediate Credit Deduction
  const handleSetBet = (key: BetKey, targetAmount: number) => {
    if (isSpinning) return;
    const currentBetOnKey = bets[key] || 0;
    const target = Math.max(0, Math.floor(targetAmount));
    const delta = target - currentBetOnKey;

    if (delta > 0) {
      if (balance < delta) {
        setMessageText('¡PUNTOS INSUFICIENTES!');
        return;
      }
      setBalance(prev => prev - delta);
      setBets(prev => ({ ...prev, [key]: target }));
    } else if (delta < 0) {
      const refund = -delta;
      setBalance(prev => prev + refund);
      setBets(prev => ({ ...prev, [key]: target }));
    }
  };

  // Trigger Spin Action
  const handleSpin = async () => {
    if (isSpinning || !currentUser) return;
    if (totalBet <= 0) {
      setMessageText('¡COLOCA APUESTA PARA GIRAR!');
      return;
    }

    setIsSpinning(true);
    setCurrentWin(0);
    setMessageText('¡GIRANDO EL ANILLO DE LUCES!');
    setLastBets(bets);

    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bets,
          currentBalance: balance,
          userId: currentUser.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessageText(err.error || 'Error al procesar el giro');
        setIsSpinning(false);
        setIsAutoSpin(false);
        return;
      }

      const result: SpinResult = await res.json();
      setSpinResult(result);
      setJackpotPool(result.jackpotPool);
    } catch {
      setMessageText('Error de conexión con el servidor');
      setIsSpinning(false);
      setIsAutoSpin(false);
    }
  };

  // Called when ring physics animation stops on target slot
  const handleSpinComplete = () => {
    setIsSpinning(false);
    setBets(INITIAL_BETS);

    if (!spinResult) return;

    // Automatically transfer won prize to balance
    setBalance(spinResult.newBalance);
    setCurrentWin(spinResult.totalWin);
    setLastWinAmount(spinResult.totalWin);

    if (spinResult.totalWin > 0) {
      soundEngine.playCoinCollect();
    }

    if (spinResult.jackpotWon > 0) {
      setMessageText(`🎉 ¡JACKPOT! +${spinResult.jackpotWon.toLocaleString()} PTS A CRÉDITO 🎉`);
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    } else if (spinResult.isCactusHit) {
      setMessageText('🌵 ¡CACTUS ESPECIAL! EL PRÓXIMO TIRO MULTIPLICARÁ x2 TUS GANANCIAS 🌵');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } else if (spinResult.isMultiShoot) {
      setMessageText(`🍓 ¡FRUTILLA (${spinResult.shootCount} EXPLOSIONES)! +${spinResult.totalWin.toLocaleString()} PTS A CRÉDITO 🍓`);
      if (spinResult.totalWin > 0) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      }
    } else if (spinResult.totalWin > 0) {
      setMessageText(`✨ ¡GANASTE +${spinResult.totalWin.toLocaleString()} PTS EN CRÉDITOS! ✨`);
      if (spinResult.totalWin >= totalBet * 10) {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      setMessageText('SELECCIONA APUESTA Y GIRA DE NUEVO');
    }

    fetchPointsAndStats();
  };

  // Auto Spin Trigger Loop
  const autoSpinTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isAutoSpin && !isSpinning) {
      if (totalBet > 0 && balance >= totalBet) {
        autoSpinTimerRef.current = setTimeout(() => {
          handleSpin();
        }, 1200);
      } else {
        setIsAutoSpin(false);
        if (balance < totalBet) {
          setMessageText('AUTO-SPIN DETENIDO: RECARGA PUNTOS');
        }
      }
    }
    return () => {
      if (autoSpinTimerRef.current) clearTimeout(autoSpinTimerRef.current);
    };
  }, [isAutoSpin, isSpinning, balance, totalBet]);

  // View 1: Login Screen
  if (!currentUser || activeView === 'login') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // View 2: Casino Virtual Lobby
  if (activeView === 'lobby') {
    return (
      <>
        <GameLobby
          user={{ ...currentUser, balance }}
          onSelectGame={(gameId) => setActiveView(gameId)}
          onOpenAdminPanel={() => setShowAdminModal(true)}
          onLogout={handleLogout}
          onRefreshBalance={fetchPointsAndStats}
          isRefreshing={isRefreshingLobby}
        />

        {showAdminModal && currentUser.role === 'admin' && (
          <AdminPanelModal
            adminId={currentUser.id}
            onClose={() => setShowAdminModal(false)}
            onUserBalanceUpdated={fetchPointsAndStats}
          />
        )}
      </>
    );
  }

  // View 3: Raspa y Gana Game
  if (activeView === 'scratch') {
    return (
      <ScratchCardGame
        user={{ ...currentUser, balance }}
        onReturnToLobby={() => {
          setActiveView('lobby');
          fetchPointsAndStats();
        }}
        onBalanceUpdated={fetchPointsAndStats}
      />
    );
  }

  // View 4: Gates of Olympus Game
  if (activeView === 'olympus') {
    return (
      <OlympusSlotGame
        user={{ ...currentUser, balance }}
        onReturnToLobby={() => {
          setActiveView('lobby');
          fetchPointsAndStats();
        }}
        onBalanceUpdated={fetchPointsAndStats}
      />
    );
  }

  // View 5: Lightning Roulette Game
  if (activeView === 'roulette') {
    return (
      <RouletteGame
        user={{ ...currentUser, balance }}
        onReturnToLobby={() => {
          setActiveView('lobby');
          fetchPointsAndStats();
        }}
        onBalanceUpdated={fetchPointsAndStats}
      />
    );
  }

  // View 6: Spanish Blackjack Game
  if (activeView === 'blackjack') {
    return (
      <BlackjackGame
        user={{ ...currentUser, balance }}
        onReturnToLobby={() => {
          setActiveView('lobby');
          fetchPointsAndStats();
        }}
        onBalanceUpdated={fetchPointsAndStats}
      />
    );
  }

  // View 7: Crazy Time Wheel Game
  if (activeView === 'crazy') {
    return (
      <CrazyWheelGame
        user={{ ...currentUser, balance }}
        onReturnToLobby={() => {
          setActiveView('lobby');
          fetchPointsAndStats();
        }}
        onBalanceUpdated={fetchPointsAndStats}
      />
    );
  }

  // View 8: Chicken Road Game
  if (activeView === 'chicken') {
    return (
      <ChickenRoadGame
        user={{ ...currentUser, balance }}
        onReturnToLobby={() => {
          setActiveView('lobby');
          fetchPointsAndStats();
        }}
        onBalanceUpdated={fetchPointsAndStats}
      />
    );
  }

  // View 9: Cyber 777 Classic Slot Game
  if (activeView === 'classic777') {
    return (
      <Classic777Game
        user={{ ...currentUser, balance }}
        onReturnToLobby={() => {
          setActiveView('lobby');
          fetchPointsAndStats();
        }}
        onBalanceUpdated={fetchPointsAndStats}
      />
    );
  }

  // View 10: Balloon Inflation Game (Globo Millonario VIP)
  if (activeView === 'balloon') {
    return (
      <BalloonGame
        user={{ ...currentUser, balance }}
        onReturnToLobby={() => {
          setActiveView('lobby');
          fetchPointsAndStats();
        }}
        onBalanceUpdated={fetchPointsAndStats}
      />
    );
  }

  // View 4: Slot Machine Game (Fruit King 3)
  return (
    <div className="h-dvh max-h-dvh w-full overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-slate-950 p-0 sm:p-1">
      {/* Top Arcade Header */}
      <HeaderBar
        user={currentUser}
        balance={balance}
        jackpotPool={jackpotPool}
        isMuted={isMuted}
        onToggleMute={() => {
          const next = !isMuted;
          setIsMuted(next);
          soundEngine.playButtonClick();
        }}
        onOpenRules={() => setShowRules(true)}
        onReturnToLobby={() => setActiveView('lobby')}
        onOpenAdmin={() => setShowAdminModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Mobile Arcade Screen Content Center */}
      <main className="flex-1 w-full max-w-md mx-auto px-1 py-0.5 flex flex-col justify-between items-center overflow-hidden">
        {/* Ring of Fruits 24 LED Slots */}
        <FruitRing
          isSpinning={isSpinning}
          spinResult={spinResult}
          onSpinComplete={handleSpinComplete}
          currentWin={currentWin}
          totalBet={totalBet}
          messageText={messageText}
          bets={bets}
          balance={balance}
          jackpotPool={jackpotPool}
        />

        {/* Betting Control Console */}
        <BettingBoard
          bets={bets}
          onSetBet={handleSetBet}
          onSpin={handleSpin}
          isSpinning={isSpinning}
          totalBet={totalBet}
          lastWinAmount={lastWinAmount}
        />
      </main>

      {/* Modals */}
      {showRules && (
        <StatsRulesModal
          onClose={() => setShowRules(false)}
          stats={gameStats}
        />
      )}

      {showAdminModal && currentUser.role === 'admin' && (
        <AdminPanelModal
          adminId={currentUser.id}
          onClose={() => setShowAdminModal(false)}
          onUserBalanceUpdated={fetchPointsAndStats}
        />
      )}

      {/* Footer Legal Marquee */}
      <FooterDisclaimer />
    </div>
  );
}

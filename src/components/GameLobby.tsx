import React from 'react';
import { Play, Shield, LogOut, RefreshCw, Sparkles, Trophy, Lock } from 'lucide-react';
import logoImg from '../assets/logo.png';

interface GameLobbyProps {
  user: { id: string; role: 'admin' | 'client'; balance: number };
  onSelectGame: (gameId: 'slots' | 'scratch' | 'olympus' | 'roulette' | 'blackjack' | 'crazy' | 'chicken' | 'classic777' | 'balloon') => void;
  onOpenAdminPanel: () => void;
  onLogout: () => void;
  onRefreshBalance: () => void;
  isRefreshing?: boolean;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  user,
  onSelectGame,
  onOpenAdminPanel,
  onLogout,
  onRefreshBalance,
  isRefreshing = false,
}) => {
  return (
    <div className="min-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Full-screen Casino Background Wallpaper */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img 
          src={logoImg} 
          alt="Royal Nexus Casino Background" 
          className="w-full h-full object-cover opacity-15 filter blur-[3px] scale-105" 
        />
        <div className="absolute inset-0 bg-slate-950/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-slate-950/95" />
      </div>

      {/* Top Lobby Bar */}
      <header className="w-full bg-slate-900 border-b border-amber-500/20 px-4 py-3 sticky top-0 z-40 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img 
              src={logoImg} 
              alt="Royal Nexus Casino Logo" 
              className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.4)] rounded-lg" 
            />
            <div>
              <h1 className="font-black text-amber-300 font-mono tracking-wider text-sm sm:text-base leading-none">
                ROYAL NEXUS CASINO
              </h1>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mt-0.5">
                Plataforma VIP
              </span>
            </div>
          </div>

          {/* User Info & Balance Counter */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Badge */}
            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 font-mono">
              <span className="text-xs font-bold text-slate-200">🆔 {user.id}</span>
              {user.role === 'admin' ? (
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded font-black">
                  ADMIN
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-black">
                  CLIENTE
                </span>
              )}
            </div>

            {/* Virtual Points Balance */}
            <div className="px-3.5 py-1.5 bg-gradient-to-r from-amber-950/80 to-slate-950 border border-amber-500/40 rounded-xl flex items-center gap-2 font-mono shadow-inner">
              <span className="text-xs text-amber-400/80 font-bold">PUNTOS:</span>
              <span className="text-base font-black text-amber-300 tracking-wider">
                {user.balance.toLocaleString()}
              </span>
              <button
                onClick={onRefreshBalance}
                disabled={isRefreshing}
                title="Actualizar Saldo"
                className="p-1 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors ml-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Admin Panel Button */}
            {user.role === 'admin' && (
              <button
                onClick={onOpenAdminPanel}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs font-mono uppercase flex items-center gap-1.5 transition-all shadow-md shadow-purple-900/30"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Panel Admin</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/40 rounded-xl transition-all"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Lobby Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-8">
        {/* Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-950 via-slate-900 to-purple-950 border border-amber-500/30 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-mono uppercase font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Casino Virtual de Apuestas & Entretenimiento
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 font-mono">
              SALA DE JUEGOS PRINCIPAL
            </h2>
            <p className="text-sm text-slate-300 font-sans leading-relaxed">
              Bienvenido <strong className="text-amber-300">{user.id}</strong>. Selecciona un juego para ingresar con tu saldo de puntos virtuales.
            </p>
          </div>
        </div>

        {/* Game Catalog Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-lg font-black text-amber-300 font-mono uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> JUEGOS DISPONIBLES
            </h3>
            <span className="text-xs text-slate-400 font-mono">9 Juegos Activos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Game NEW: Balloon Inflation (Globo Millonario) */}
            <div className="bg-slate-900 border border-amber-500/80 hover:border-amber-400 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/20 group relative overflow-hidden ring-2 ring-amber-500/40">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-500/50 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> MEGA JACKPOT 💰
                </span>
                <span className="text-xs text-amber-300 font-mono font-black">HASTA 1.000.000 PTS</span>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-red-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
                  🎈
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-100 font-mono uppercase group-hover:text-amber-400 transition-colors">
                    GLOBO MILLONARIO
                  </h4>
                  <p className="text-xs text-slate-400">
                    ¡Infla el globo a ciegas! Descubre si el globo contiene hasta 1.000.000 PTS o estalla vacío.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2 text-center">
                  <span className="text-[11px] font-mono font-black text-amber-300 uppercase tracking-wide">
                    🔥 ¡GANANCIAS HASTA 1 MILLÓN DE PUNTOS!
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Apuesta Mín: 200 PTS</span>
                  <span>Misterio: MÁXIMO</span>
                </div>

                <button
                  onClick={() => onSelectGame('balloon')}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 hover:from-amber-300 hover:to-red-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 font-mono uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-current" /> JUGAR AL GLOBO
                </button>
              </div>
            </div>
            {/* Game NEW: Cyber 777 Classic Slot */}
            <div className="bg-slate-900 border border-blue-500/80 hover:border-blue-400 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 group relative overflow-hidden ring-2 ring-blue-500/40">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-blue-950 text-cyan-300 border border-blue-500/50 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> CLÁSICO 3 REELES
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">MULTIPLICADOR HASTA 500x</span>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                  🎰
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-100 font-mono uppercase group-hover:text-cyan-300 transition-colors">
                    CYBER 777 CLASSIC
                  </h4>
                  <p className="text-xs text-slate-400">
                    Tragamoneda física de 3 carretes 3D con línea central, 777, BARS y giro desde 200 PTS.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Apuesta Mín: 200 PTS</span>
                  <span>Giro Automático: SÍ</span>
                </div>

                <button
                  onClick={() => onSelectGame('classic777')}
                  className="w-full py-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black rounded-xl shadow-lg shadow-blue-500/20 font-mono uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-current" /> JUGAR CYBER 777
                </button>
              </div>
            </div>
            {/* Game 0: Chicken Road */}
            <div className="bg-slate-900 border border-amber-500/50 hover:border-amber-400 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 group relative overflow-hidden ring-2 ring-amber-500/30">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-red-950 text-red-300 border border-red-500/50 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> NUEVO & TENDENCIA
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">MULTIPLICADOR HASTA 1500x</span>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-500 via-amber-400 to-amber-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  🐔
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-100 font-mono uppercase group-hover:text-amber-300 transition-colors">
                    CHICKEN ROAD
                  </h4>
                  <p className="text-xs text-slate-400">
                    Cruza el camino con la gallina sin caer en las trampas. ¡Retírate a tiempo!
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Apuesta Mín: 200 PTS</span>
                  <span>4 Dificultades: SÍ</span>
                </div>

                <button
                  onClick={() => onSelectGame('chicken')}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 font-mono uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-current" /> JUGAR CHICKEN
                </button>
              </div>
            </div>
            {/* Game 0: Crazy Time / Crazy Wheel */}
            <div className="bg-slate-900 border border-amber-500/50 hover:border-amber-400 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 group relative overflow-hidden ring-2 ring-amber-500/30">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/50 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> POPULAR
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">MULTIPLICADOR HASTA 2000x</span>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  🎡
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-100 font-mono uppercase group-hover:text-amber-300 transition-colors">
                    CRAZY TIME WHEEL
                  </h4>
                  <p className="text-xs text-slate-400">
                    Gran Rueda de 54 sectores con Top Slot y 4 Minijuegos Bonus.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Ficha Mínima: 200 PTS</span>
                  <span>4 Juegos Bonus: SÍ</span>
                </div>

                <button
                  onClick={() => onSelectGame('crazy')}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 font-mono uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-current" /> JUGAR AHORA
                </button>
              </div>
            </div>
            {/* Game 1: Fruit Slot */}
            <div className="bg-slate-900 border border-amber-500/50 hover:border-amber-400 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 group relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/50 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> DISPONIBLE
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">DISPARO MÚLTIPLE x2</span>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  🍉
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-100 font-mono uppercase group-hover:text-amber-300 transition-colors">
                    TRAGAMONEDAS FRUTAS
                  </h4>
                  <p className="text-xs text-slate-400">
                    Anillo de 24 luces LED con multiplicadores de hasta x100 en BAR.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Apuesta Mínima: 1 PT</span>
                  <span>Minijuego Duplicar: SÍ</span>
                </div>

                <button
                  onClick={() => onSelectGame('slots')}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 font-mono uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-current" /> JUGAR AHORA
                </button>
              </div>
            </div>

            {/* Game 2: Puertas del Olimpo (Gates of Olympus) */}
            <div className="bg-slate-900 border border-amber-500/50 hover:border-amber-400 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 group relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/50 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> DISPONIBLE
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">MULTIPLICADOR x500</span>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  ⚡
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-100 font-mono uppercase group-hover:text-amber-300 transition-colors">
                    PUERTAS DEL OLIMPO
                  </h4>
                  <p className="text-xs text-slate-400">
                    Slot 6x5 con sistema Scatter Pays, cascada y orbes de Zeus.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Costo Mínimo: 200 PTS</span>
                  <span>Comprar Bonus: SÍ</span>
                </div>

                <button
                  onClick={() => onSelectGame('olympus')}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 font-mono uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-current" /> JUGAR AHORA
                </button>
              </div>
            </div>

            {/* Game 3: Ruleta Relámpago VIP */}
            <div className="bg-slate-900 border border-amber-500/50 hover:border-amber-400 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 group relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/50 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> DISPONIBLE
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">RAYOS HASTA 500x</span>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  🎡
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-100 font-mono uppercase group-hover:text-amber-300 transition-colors">
                    RULETA RELÁMPAGO VIP
                  </h4>
                  <p className="text-xs text-slate-400">
                    Ruleta Europea de 37 casillas con números relámpago afortunados.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Ficha Mínima: 200 PTS</span>
                  <span>Mesa Interactiva: SÍ</span>
                </div>

                <button
                  onClick={() => onSelectGame('roulette')}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 font-mono uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-current" /> JUGAR AHORA
                </button>
              </div>
            </div>

            {/* Game 4: Blackjack Royale 21 */}
            <div className="bg-slate-900 border border-amber-500/50 hover:border-amber-400 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 group relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/50 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> DISPONIBLE
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">PAGO 3:2 EN 21</span>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  🃏
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-100 font-mono uppercase group-hover:text-amber-300 transition-colors">
                    BLACKJACK ROYALE 21
                  </h4>
                  <p className="text-xs text-slate-400">
                    Mesa de juego VIP contra la banca en español. Pedir, Plantarse y Doblar.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Apuesta Mínima: 200 PTS</span>
                  <span>Mazo: 6 Barajas</span>
                </div>

                <button
                  onClick={() => onSelectGame('blackjack')}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 font-mono uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-current" /> JUGAR AHORA
                </button>
              </div>
            </div>

            {/* Game 5: Raspa y Gana Royale */}
            <div className="bg-slate-900 border border-amber-500/50 hover:border-amber-400 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 group relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/50 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> DISPONIBLE
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">HASTA 1.000.000 PTS</span>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  🎟️
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-100 font-mono uppercase group-hover:text-amber-300 transition-colors">
                    RASPA Y GANA ROYALE
                  </h4>
                  <p className="text-xs text-slate-400">
                    Raspa la tarjeta táctil con tu dedo y acierta 3 premios iguales.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Costo Boleto: 5.000 PTS</span>
                  <span>Control de Lote: SÍ</span>
                </div>

                <button
                  onClick={() => onSelectGame('scratch')}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 font-mono uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-current" /> JUGAR AHORA
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

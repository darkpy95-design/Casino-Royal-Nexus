import React, { useState } from 'react';
import { X, ShieldCheck, BarChart2, BookOpen } from 'lucide-react';
import { BET_CATEGORIES_INFO } from '../data/slotsData';
import { GameStats } from '../types';
import { soundEngine } from '../audio';
import { FruitIcon } from './FruitIcon';
import { logoImg } from '../assets/logoData';

interface StatsRulesModalProps {
  onClose: () => void;
  stats: GameStats | null;
}

export const StatsRulesModal: React.FC<StatsRulesModalProps> = ({ onClose, stats }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'stats' | 'provably'>('rules');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-amber-500/10 relative overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <img 
              src={logoImg} 
              alt="Royal Nexus Logo" 
              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
              className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] rounded" 
            />
            <h2 className="text-base sm:text-lg font-black text-amber-300 font-mono uppercase tracking-wider">
              ROYAL NEXUS CASINO — TRANSPARENCIA Y REGLAS
            </h2>
          </div>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'rules'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Reglas y Pagos</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Estadísticas de Juego</span>
          </button>

          <button
            onClick={() => setActiveTab('provably')}
            className={`pb-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'provably'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Provably Fair</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-300">
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <h3 className="font-bold text-amber-300 uppercase mb-1 font-mono">¿Cómo se juega a Fruit King 3?</h3>
                <p className="leading-relaxed text-slate-300">
                  Coloca tus apuestas virtuales en uno o varios símbolos de frutas. Al presionar <strong>GIRAR</strong>, el anillo luminoso de 24 casillas comenzará a rodar y desacelerará hasta detenerse en la casilla ganadora calculada de forma segura por el servidor.
                </p>
              </div>

              <h4 className="font-bold text-slate-200 uppercase font-mono text-xs">Tabla de Multiplicadores de Símbolos</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BET_CATEGORIES_INFO.map(cat => (
                  <div key={cat.key} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
                    <FruitIcon symbol={cat.key} size="md" />
                    <div>
                      <span className="font-bold text-slate-200 block">{cat.name}</span>
                      <span className="text-amber-400 font-mono font-bold text-xs">{cat.multiplierText}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-2">
                <h4 className="font-bold text-purple-300 uppercase font-mono">Bonus Especiales de Fruit King 3:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>FRUTILLA EXPLOSIONES (2, 3, 4, 5, 6 Disparos):</strong> Cuando la luz aterriza en una casilla de Frutilla, dispara múltiples luces al azar (de 2 a 6 disparos), pagando todas las casillas acertadas en esa misma ronda.</li>
                  <li><strong>CACTUS ESPECIAL:</strong> La casilla de Cactus otorga un premio especial que duplica x2 las ganancias conseguidas en la siguiente jugada.</li>
                  <li><strong>JACKPOT VIRTUAL ACUMULADO:</strong> Un pozo de puntos ficticios que aumenta progresivamente con cada jugada y puede salir de forma aleatoria en giros de apuesta principal.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                  <span className="text-slate-400 uppercase block font-mono">Total Giros</span>
                  <span className="text-xl font-bold font-mono text-slate-100">{stats?.totalSpins ?? 0}</span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                  <span className="text-slate-400 uppercase block font-mono">Puntos Apostados</span>
                  <span className="text-xl font-bold font-mono text-amber-400">{(stats?.totalPointsBet ?? 0).toLocaleString()}</span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                  <span className="text-slate-400 uppercase block font-mono">Puntos Ganados</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">{(stats?.totalPointsWon ?? 0).toLocaleString()}</span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                  <span className="text-slate-400 uppercase block font-mono">Jackpots Ganados</span>
                  <span className="text-xl font-bold font-mono text-yellow-300">{stats?.jackpotsHit ?? 0}</span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                  <span className="text-slate-400 uppercase block font-mono">RTP Modo Casino</span>
                  <span className="text-xl font-bold font-mono text-purple-300">82%</span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                  <span className="text-slate-400 uppercase block font-mono">Balance Puntos</span>
                  <span className="text-xl font-bold font-mono text-emerald-300">{(stats?.currentBalance ?? 1000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'provably' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <h4 className="font-bold text-emerald-300 uppercase font-mono mb-1">Garantía Provably Fair (Criptográficamente Seguro)</h4>
                <p className="text-slate-300 leading-relaxed">
                  Toda la lógica de resultados de giros se genera en el servidor utilizando <code>crypto.randomBytes()</code> con semilla secreta del servidor e HMAC SHA-256. El cliente no influye en el resultado y no se modifican probabilidades de forma oculta.
                </p>
              </div>

              <p className="text-slate-400 font-mono uppercase text-[11px]">Auditabilidad Transparente del Servidor Backend</p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2">
                <div>
                  <span className="text-slate-500 block">HMAC Algoritmo:</span>
                  <span className="text-amber-300 font-bold">SHA-256 (Server Authoritative RNG)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Aislamiento de Cliente:</span>
                  <span className="text-emerald-400">Backend validation strictly applied</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 uppercase font-mono">
            ⚠️ MODO CASINO COMERCIAL — LÓGICA DE TRAGAMONEDAS REAL DE FRUTAS.
          </p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, Sparkles, Trophy, Target, ShieldCheck, Zap } from 'lucide-react';

export type GameId =
  | 'classic777'
  | 'slots'
  | 'scratch'
  | 'olympus'
  | 'roulette'
  | 'blackjack'
  | 'crazy'
  | 'chicken'
  | 'balloon';

interface GameInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: GameId;
  gameTitle?: string;
}

interface GameDetails {
  title: string;
  subtitle: string;
  description: string;
  howToPlay: string[];
  rulesAndMultipliers: { label: string; detail: string }[];
  tips?: string;
}

const GAME_INFO_DATA: Record<GameId, GameDetails> = {
  classic777: {
    title: 'CYBER 777 CLASSIC',
    subtitle: 'Tragamoneda física 3D con línea de pago central y multiplicadores retro',
    description:
      'Cyber 777 Classic es una traganíquel tradicional de 3 carretes mecánicos 3D con una única línea de pago horizontal central ("Pay Line"). Combina la nostalgia de las tragamonedas reales de casino físico con efectos neón cibernéticos.',
    howToPlay: [
      '1. Selecciona el monto de tu apuesta usando las fichas o botones rápidos (mínimo 200 PTS).',
      '2. Presiona el botón rojo "GIRAR" para poner en marcha los 3 carretes 3D.',
      '3. Los carretes se detendrán en secuencia sobre la línea central roja.',
      '4. Si los 3 símbolos en la línea central coinciden con una combinación ganadora, cobrarás inmediatamente los puntos asignados.'
    ],
    rulesAndMultipliers: [
      { label: 'WILD 777 (3x)', detail: '500x la apuesta (Gran Jackpot)' },
      { label: 'RED 7 (3x)', detail: '100x la apuesta' },
      { label: 'DIAMANTE (3x)', detail: '50x la apuesta' },
      { label: '3x BAR (3x)', detail: '25x la apuesta' },
      { label: '2x BAR (3x)', detail: '15x la apuesta' },
      { label: '1x BAR (3x)', detail: '10x la apuesta' },
      { label: 'CUALQUIER MEZCLA BAR', detail: '5x la apuesta' },
      { label: 'CAMPANAS (3x)', detail: '12x la apuesta' },
      { label: 'CEREZAS (3x)', detail: '10x la apuesta (Requiere al menos 1 Cereza real)' },
      { label: 'CEREZAS (2x / 1x)', detail: '3x (para 2 Cerezas) / 1.5x (para 1 Cereza)' }
    ],
    tips: 'El símbolo 777 WILD sustituye a cualquier otro símbolo para completar combinaciones ganadoras.'
  },

  slots: {
    title: 'FRUIT RING 24 CASILLAS',
    subtitle: 'Anillo de 24 casillas luminosas con multiplicadores de frutas',
    description:
      'Fruit Ring es el clásico juego arcade de feria y casino de 24 casillas dispuestas en anillo. Las luces recorren el tablero y se detienen en una casilla afortunada.',
    howToPlay: [
      '1. Elige las fichas con tu valor deseado y colócalas en una o varias frutas en el tapete de apuestas.',
      '2. Puedes apostar a múltiples símbolos al mismo tiempo para diversificar tu juego.',
      '3. Presiona el botón "GIRAR". La casilla luminosa comenzará a rodar alrededor del anillo.',
      '4. Si la luz se detiene en un símbolo al que apostaste, multiplicarás la apuesta asignada a ese símbolo.'
    ],
    rulesAndMultipliers: [
      { label: 'BAR SUPERIOR', detail: 'Paga 100x el monto apostado en BAR' },
      { label: '777 FORTUNA', detail: 'Paga 50x el monto apostado en 777' },
      { label: 'ESTRELLA / SANDÍA', detail: 'Paga 20x el monto apostado' },
      { label: 'CAMPANA / CIRUELA', detail: 'Paga 20x (Campana) / 10x (Ciruela)' },
      { label: 'NARANJA / MANZANA', detail: 'Paga 10x (Naranja) / 5x (Manzana)' },
      { label: 'POZO JACKPOT ACUMULADO', detail: 'Premio acumulado aleatorio que puede salir en cualquier giro' }
    ],
    tips: 'Puedes usar los botones "REPETIR APUESTA" o "BORRAR" para gestionar tus fichas de forma ágil.'
  },

  scratch: {
    title: 'RASPA & GANA (SCRATCH CARDS)',
    subtitle: 'Tarjetas de raspado instantáneo con múltiples temáticas y grandes premios',
    description:
      'Disfruta la emoción de raspar boletos de lotería virtual instantánea. Selecciona entre tarjetas de Diamantes, Neón o Fortuna Real.',
    howToPlay: [
      '1. Elige la tarjeta que prefieras y selecciona tu monto de compra (mínimo 200 PTS).',
      '2. Presiona "COMPRAR TARJETA".',
      '3. Usa tu cursor o dedo para raspar la superficie plateada de la tarjeta, o presiona "REVELAR TODO" para un resultado automático.',
      '4. Si encuentras 3 símbolos o números coincidentes, ganas el premio indicado en la tarjeta.'
    ],
    rulesAndMultipliers: [
      { label: 'COINCIDENCIA DE 3 SÍMBOLOS', detail: 'Ganas desde 2x hasta 500x el valor de la tarjeta' },
      { label: 'REVELADO RÁPIDO', detail: 'Opción de raspado automático instantáneo' },
      { label: 'BOLETOS MULTIPLE', detail: 'Puedes jugar tarjetas consecutivas sin salir del juego' }
    ]
  },

  olympus: {
    title: 'GATES OF OLYMPUS',
    subtitle: 'Slot de cascada 6x5 con pago Scatter Pay, Orbes Multiplicadores y Giros Gratis',
    description:
      'Ingresa al reino del Dios Zeus. Los símbolos no necesitan estar en líneas fijas; basta con reunir 8 o más símbolos iguales en cualquier posición de la pantalla de 6x5.',
    howToPlay: [
      '1. Ajusta tu apuesta base (mínimo 200 PTS).',
      '2. Presiona "GIRAR" o activa los giros automáticos ("AUTO-SPIN").',
      '3. Si obtienes 8 o más símbolos iguales, ganarás puntos y los símbolos desaparecerán en CASCADA (Tumble), permitiendo que caigan nuevos símbolos y ganar múltiples veces en un mismo giro.',
      '4. Zeus puede lanzar orbes mágicos con multiplicadores aleatorios (desde 2x hasta 500x) que multiplican la ganancia total del giro.'
    ],
    rulesAndMultipliers: [
      { label: 'CASCADA (TUMBLE)', detail: 'Símbolos ganadores explotan y caen nuevos símbolos gratis en la misma ronda' },
      { label: 'ORBES DE ZEUS', detail: 'Multiplicadores de 2x, 3x, 5x, 10x, 25x, 50x, 100x y 500x' },
      { label: 'FREE SPINS (BONUS)', detail: '4 o más Scatters de Zeus otorgan 15 Giros Gratis con multiplicador acumulativo' },
      { label: 'COMPRAR BONUS', detail: 'Opción directa para ingresar inmediatamente a la ronda de Giros Gratis' }
    ]
  },

  roulette: {
    title: 'RULETA EUROPEA CLASSIC',
    subtitle: 'La experiencia auténtica de la ruleta de casino con paño interactivo',
    description:
      'La clásica ruleta de 37 casillas (números del 0 al 36) con gráficos en vivo, animación de bola física y amplia mesa de apuestas.',
    howToPlay: [
      '1. Selecciona el valor de tus fichas (mínimo 200 PTS).',
      '2. Haz clic sobre el paño de apuestas para colocar tus fichas en números individuales, colores, decenas o columnas.',
      '3. Presiona el botón "GIRAR RULETA".',
      '4. La bola rodará en la ruleta y caerá en una casilla numerada. Si tu apuesta cubre esa casilla, recibirás tu pago.'
    ],
    rulesAndMultipliers: [
      { label: 'PLENO (Número Único)', detail: 'Paga 36x la apuesta (35 a 1)' },
      { label: 'ROJO / NEGRO', detail: 'Paga 2x la apuesta (1 a 1)' },
      { label: 'PAR / IMPAR', detail: 'Paga 2x la apuesta (1 a 1)' },
      { label: '1-18 / 19-36', detail: 'Paga 2x la apuesta (1 a 1)' },
      { label: 'DOCENAS (1ª, 2ª, 3ª)', detail: 'Paga 3x la apuesta (2 a 1)' },
      { label: 'COLUMNAS (12 Números)', detail: 'Paga 3x la apuesta (2 a 1)' }
    ]
  },

  blackjack: {
    title: 'BLACKJACK 21 CLASSIC',
    subtitle: 'Juego de cartas estratégico contra el Crupier virtual',
    description:
      'El icónico juego de cartas 21. Tu objetivo es obtener una mano con un valor total mayor que la mano del crupier sin superar los 21 puntos.',
    howToPlay: [
      '1. Elige tu apuesta (mínimo 200 PTS) y presiona "REPARTIR CARAS".',
      '2. Recibirás 2 cartas boca arriba. El crupier recibe 1 carta boca arriba y 1 boca abajo.',
      '3. Selecciona tu jugada: "PEDIR CARTA" (añade una carta), "PLANTARSE" (mantener tu mano), "DOBLAR" (duplica tu apuesta y recibes solo 1 carta más) o "DIVIDIR" (si tienes un par).',
      '4. Si sumas más de 21 te pasas (Bust) y pierdes la ronda. El crupier está obligado a pedir carta hasta sumar 17 o más.'
    ],
    rulesAndMultipliers: [
      { label: 'BLACKJACK NATURAL (As + 10/J/Q/K)', detail: 'Paga 2.5x la apuesta (3 a 2)' },
      { label: 'VICTORIA ESTÁNDAR', detail: 'Paga 2x la apuesta (1 a 1)' },
      { label: 'EMPATE (PUSH)', detail: 'Se reembolsa tu apuesta original' },
      { label: 'VALOR DE CARTAS', detail: 'As vale 1 u 11 puntos; J, Q, K valen 10 puntos; 2-10 valen su número' }
    ]
  },

  crazy: {
    title: 'CRAZY WHEEL MULTIPLIER',
    subtitle: 'Rueda gigante de la fortuna con multiplicadores y 4 Minijuegos Bonus',
    description:
      'Una emocionante rueda dividida en sectores numéricos y sectores de Bonus especiales interactivos (Coin Flip, Cash Hunt, Pachinko y Crazy Time).',
    howToPlay: [
      '1. Coloca tus apuestas en las casillas numéricas (1, 2, 5, 10) o en las casillas de Bonus.',
      '2. Presiona "GIRAR RUEDA".',
      '3. La rueda girará y el puntero indicará el segmento ganador.',
      '4. Si la rueda cae en un número que apostaste, cobras tu multiplicador. Si cae en un Bonus en el que tenías apuesta, ¡inicias la ronda especial interactiva de grandes premios!'
    ],
    rulesAndMultipliers: [
      { label: 'SECTOR 1 / 2 / 5 / 10', detail: 'Paga 2x, 3x, 6x o 11x respectivamente' },
      { label: 'COIN FLIP BONUS', detail: 'Lanzamiento de moneda con dos multiplicadores sorpresa' },
      { label: 'CASH HUNT BONUS', detail: 'Galería de tiro con 108 multiplicadores ocultos' },
      { label: 'PACHINKO BONUS', detail: 'Pared de clavijas donde cae una bola de luz hacia multiplicadores' },
      { label: 'CRAZY TIME BONUS', detail: 'Rueda gigante de premios masivos con casillas de DOUBLE / TRIPLE' }
    ]
  },

  chicken: {
    title: 'CHICKEN ROAD (EL CAMINO DE LA GALLINA)',
    subtitle: 'Juego de sobrevivencia paso a paso con multiplicador creciente y retiro voluntario',
    description:
      'Ayuda a la gallina a cruzar la autopista/alcantarillado tramo a tramo. Con cada paso seguro, tu multiplicador se eleva, pero ten cuidado con las alcantarillas y trampas.',
    howToPlay: [
      '1. Elige tu apuesta (mínimo 200 PTS) y selecciona la dificultad: Fácil, Medio, Duro o Hardcore.',
      '2. Presiona "INICIAR CAMINO".',
      '3. En cada fila, haz clic en una de las casillas para dar un paso con la gallina.',
      '4. Si la casilla está despejada, avanzas y tu multiplicador aumenta. Puedes presionar "RETIRAR / COBRAR" en cualquier instante para asegurar tus ganancias. ¡Si caes en una trampa, pierdes la apuesta!'
    ],
    rulesAndMultipliers: [
      { label: 'DIFICULTAD FÁCIL', detail: 'Menos trampas, incremento de multiplicador gradual' },
      { label: 'DIFICULTAD HARDCORE', detail: 'Más trampas, multiplicadores enormes desde el primer paso' },
      { label: 'RETIRO EN CUALQUIER MOMENTO', detail: 'Tú decides cuándo cobrar tus ganancias acumuladas' }
    ]
  },

  balloon: {
    title: 'GLOBO (BALLOON CASHOUT)',
    subtitle: 'Juego de ritmo y aceleración de multiplicador en tiempo real',
    description:
      'Manten la calma y pon a prueba tus reflejos. Infla el globo mientras el multiplicador sube por segundo. ¡Cobra antes de que explote!',
    howToPlay: [
      '1. Selecciona el monto de tu apuesta (mínimo 200 PTS).',
      '2. Presiona "INICIAR GLOBO".',
      '3. El globo comenzará a inflarse continuamente y la cifra de ganancias subirá de forma exponencial (1.1x, 2.0x, 5.0x, 20.0x...).',
      '4. Presiona el botón verde "RETIRAR / COBRAR" para ganar tu apuesta multiplicada. Si el globo estalla antes de retirarte, la ronda termina sin premio.'
    ],
    rulesAndMultipliers: [
      { label: 'CRECIMIENTO EXPONENCIAL', detail: 'El multiplicador puede alcanzar cotas de más de 100x' },
      { label: 'COBRO INSTANTÁNEO', detail: 'El premio se acredita automáticamente al presionar el botón de retiro' }
    ]
  }
};

export const GameInfoModal: React.FC<GameInfoModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameTitle
}) => {
  if (!isOpen) return null;

  const info = GAME_INFO_DATA[gameId] || {
    title: gameTitle || 'INFORMACIÓN DEL JUEGO',
    subtitle: 'Reglas e instrucciones de juego',
    description: 'Aprende cómo jugar y maximizar tus oportunidades de ganar.',
    howToPlay: ['Coloca tu apuesta y presiona el botón para iniciar el juego.'],
    rulesAndMultipliers: []
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md font-sans text-slate-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-2xl max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden relative"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg tracking-wide text-amber-400 uppercase font-mono">
                  {info.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium">GUÍA DE JUEGO E INFORMACIÓN</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all border border-slate-700/50"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 relative z-10">
            {/* Game Subtitle & Description */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
                <Sparkles className="w-4 h-4" />
                <span>¿EN QUÉ CONSISTE EL JUEGO?</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {info.description}
              </p>
            </div>

            {/* How to Play Steps */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase">
                <Target className="w-4 h-4" />
                <span>¿CÓMO JUGAR? (PASO A PASO)</span>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
                {info.howToPlay.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <p className="leading-snug">{step.replace(/^\d+\.\s*/, '')}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules and Multipliers */}
            {info.rulesAndMultipliers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase">
                  <Trophy className="w-4 h-4" />
                  <span>PREMIOS, REGLAS Y MULTIPLICADORES</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {info.rulesAndMultipliers.map((rule, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/70 border border-purple-500/20 rounded-xl p-3 flex flex-col justify-between"
                    >
                      <span className="text-[11px] font-mono font-bold text-purple-300 uppercase">
                        {rule.label}
                      </span>
                      <span className="text-xs font-medium text-slate-300 mt-1">
                        {rule.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips / Notes */}
            {info.tips && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-amber-200">
                <ShieldCheck className="w-5 h-5 shrink-0 text-amber-400" />
                <span>{info.tips}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
            >
              ENTENDIDO / JUGAR
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

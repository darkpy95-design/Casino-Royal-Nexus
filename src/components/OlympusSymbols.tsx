import React from 'react';
import { OlympusSymbol } from './OlympusSlotGame';

interface SymbolProps {
  symbol: OlympusSymbol;
  className?: string;
}

export const OlympusSymbolSVG: React.FC<SymbolProps> = ({ symbol, className = "w-full h-full" }) => {
  switch (symbol) {
    case 'crown':
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.8))">
          <defs>
            <linearGradient id="goldCrownUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2A1" />
              <stop offset="25%" stopColor="#FFD700" />
              <stop offset="60%" stopColor="#B8860B" />
              <stop offset="85%" stopColor="#DAA520" />
              <stop offset="100%" stopColor="#684A07" />
            </linearGradient>
            <linearGradient id="rubyGradUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFAABC" />
              <stop offset="35%" stopColor="#FF0044" />
              <stop offset="70%" stopColor="#B9002D" />
              <stop offset="100%" stopColor="#550012" />
            </linearGradient>
            <radialGradient id="goldShine" cx="30%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Golden Shield Base Pedestal */}
          <path d="M12 76 L88 76 L82 85 L18 85 Z" fill="url(#goldCrownUltra)" stroke="#3E2602" strokeWidth="2" />
          <rect x="20" y="70" width="60" height="7" rx="3" fill="url(#goldCrownUltra)" stroke="#FFF2A1" strokeWidth="1" />

          {/* Red Velvet Inner Cushion */}
          <path d="M18 68 Q50 32 82 68 Q50 60 18 68 Z" fill="url(#rubyGradUltra)" />

          {/* Main 5-Point Crown Structure */}
          <path
            d="M16 68 L8 28 L30 48 L50 14 L70 48 L92 28 L84 68 Z"
            fill="url(#goldCrownUltra)"
            stroke="#4A3203"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Golden Arches & filigree */}
          <path d="M8 28 Q50 6 92 28" fill="none" stroke="url(#goldCrownUltra)" strokeWidth="3.5" />
          <path d="M30 48 Q50 12 70 48" fill="none" stroke="#FFF2A1" strokeWidth="2" />

          {/* Ruby Jewels on Crown Tips */}
          <circle cx="8" cy="26" r="5" fill="url(#rubyGradUltra)" stroke="#FFD700" strokeWidth="1.2" />
          <circle cx="50" cy="12" r="7" fill="url(#rubyGradUltra)" stroke="#FFF2A1" strokeWidth="1.5" />
          <circle cx="92" cy="26" r="5" fill="url(#rubyGradUltra)" stroke="#FFD700" strokeWidth="1.2" />

          {/* Large Center Faceted Ruby Gem */}
          <polygon points="50,38 60,48 50,58 40,48" fill="url(#rubyGradUltra)" stroke="#FFD700" strokeWidth="1.5" />
          <polygon points="50,38 60,48 50,48" fill="rgba(255,255,255,0.4)" />

          {/* Golden Specular Highlights */}
          <ellipse cx="32" cy="36" rx="8" ry="4" fill="url(#goldShine)" transform="rotate(-30 32 36)" />
          <ellipse cx="68" cy="36" rx="8" ry="4" fill="url(#goldShine)" transform="rotate(30 68 36)" />
        </svg>
      );

    case 'hourglass':
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.8))">
          <defs>
            <linearGradient id="goldFrameHg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2A1" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="80%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
            <linearGradient id="emeraldSandUltra" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#022C22" />
            </linearGradient>
            <radialGradient id="emeraldGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Divine Gold Wings */}
          <path d="M18 50 C2 32 6 10 24 20 C12 32 20 44 32 48 Z" fill="url(#goldFrameHg)" stroke="#78350F" strokeWidth="1" />
          <path d="M82 50 C98 32 94 10 76 20 C88 32 80 44 68 48 Z" fill="url(#goldFrameHg)" stroke="#78350F" strokeWidth="1" />

          {/* Outer Ring & Pillar Supports */}
          <circle cx="50" cy="50" r="41" fill="none" stroke="url(#goldFrameHg)" strokeWidth="4.5" />
          <line x1="28" y1="18" x2="28" y2="82" stroke="url(#goldFrameHg)" strokeWidth="3" />
          <line x1="72" y1="18" x2="72" y2="82" stroke="url(#goldFrameHg)" strokeWidth="3" />

          {/* Top and Bottom Caps */}
          <rect x="24" y="14" width="52" height="7" rx="3" fill="url(#goldFrameHg)" stroke="#FFF2A1" strokeWidth="1" />
          <rect x="24" y="79" width="52" height="7" rx="3" fill="url(#goldFrameHg)" stroke="#FFF2A1" strokeWidth="1" />

          {/* Glass Bulbs */}
          <path
            d="M32 21 L68 21 C68 38 56 46 51 50 C56 54 68 62 68 79 L32 79 C32 62 44 54 49 50 C44 46 32 38 32 21 Z"
            fill="rgba(255,255,255,0.18)"
            stroke="url(#goldFrameHg)"
            strokeWidth="2.5"
          />

          {/* Top Sand Pile */}
          <path d="M35 26 L65 26 C62 38 54 44 50 48 C46 44 38 38 35 26 Z" fill="url(#emeraldSandUltra)" />
          {/* Falling Stream */}
          <line x1="50" y1="48" x2="50" y2="66" stroke="#6EE7B7" strokeWidth="2.5" strokeDasharray="3 2" />
          {/* Bottom Sand Pile */}
          <path d="M34 77 L66 77 C62 66 56 62 50 62 C44 62 38 66 34 77 Z" fill="url(#emeraldSandUltra)" />

          {/* Glass Highlight Shine */}
          <path d="M35 23 Q42 30 38 42" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
        </svg>
      );

    case 'ring':
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.8))">
          <defs>
            <linearGradient id="goldBandUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF5B8" />
              <stop offset="40%" stopColor="#EAB308" />
              <stop offset="80%" stopColor="#A16207" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
            <linearGradient id="rubyRingGem" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF99B3" />
              <stop offset="40%" stopColor="#EF4444" />
              <stop offset="80%" stopColor="#991B1B" />
              <stop offset="100%" stopColor="#450A0A" />
            </linearGradient>
          </defs>

          {/* Golden Ring Band Body */}
          <ellipse cx="50" cy="62" rx="30" ry="24" fill="none" stroke="url(#goldBandUltra)" strokeWidth="11" />
          <ellipse cx="50" cy="62" rx="30" ry="24" fill="none" stroke="#281A04" strokeWidth="1.5" />

          {/* Bezel Setting Pedestal */}
          <polygon points="34,42 66,42 58,30 42,30" fill="url(#goldBandUltra)" stroke="#FFF2A1" strokeWidth="1" />

          {/* Giant Faceted Ruby Crystal */}
          <polygon points="50,12 70,28 62,44 38,44 30,28" fill="url(#rubyRingGem)" stroke="#FFD700" strokeWidth="2" />
          {/* Facets */}
          <polygon points="50,12 70,28 50,32" fill="rgba(255,255,255,0.45)" />
          <polygon points="50,12 30,28 50,32" fill="rgba(255,255,255,0.25)" />
          <polygon points="30,28 38,44 50,32" fill="rgba(0,0,0,0.15)" />
          <polygon points="70,28 62,44 50,32" fill="rgba(0,0,0,0.25)" />
        </svg>
      );

    case 'goblet':
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.8))">
          <defs>
            <linearGradient id="goldGobletUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2A1" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="80%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
            <radialGradient id="nectarLiquid" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F0ABFC" />
              <stop offset="60%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#581C87" />
            </radialGradient>
          </defs>

          {/* Base */}
          <ellipse cx="50" cy="82" rx="24" ry="8" fill="url(#goldGobletUltra)" stroke="#451A03" strokeWidth="1.5" />

          {/* Stem & Knop */}
          <rect x="46" y="54" width="8" height="28" fill="url(#goldGobletUltra)" stroke="#451A03" strokeWidth="1" />
          <circle cx="50" cy="62" r="7" fill="url(#goldGobletUltra)" stroke="#FFF2A1" strokeWidth="1" />

          {/* Cup Bowl */}
          <path d="M20 22 C20 54 38 60 50 60 C62 60 80 54 80 22 Z" fill="url(#goldGobletUltra)" stroke="#451A03" strokeWidth="2" />

          {/* Liquid Nectar Inside Rim */}
          <ellipse cx="50" cy="22" rx="28" ry="8" fill="url(#nectarLiquid)" stroke="#F59E0B" strokeWidth="2" />

          {/* Sapphire Jewel Inset on Bowl */}
          <circle cx="50" cy="40" r="6" fill="#2563EB" stroke="#FFD700" strokeWidth="1.5" />
          <circle cx="48" cy="38" r="2" fill="#FFFFFF" opacity="0.8" />
        </svg>
      );

    case 'red_gem':
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0px 5px 10px rgba(239,68,68,0.6))">
          <defs>
            <linearGradient id="redGemUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FECDD3" />
              <stop offset="30%" stopColor="#F43F5E" />
              <stop offset="70%" stopColor="#BE123C" />
              <stop offset="100%" stopColor="#4C0519" />
            </linearGradient>
            <linearGradient id="goldBezelUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2A1" />
              <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
          </defs>
          <polygon points="50,8 88,36 74,88 26,88 12,36" fill="none" stroke="url(#goldBezelUltra)" strokeWidth="5.5" strokeLinejoin="round" />
          <polygon points="50,11 85,37 72,85 28,85 15,37" fill="url(#redGemUltra)" />
          {/* Shading Facets */}
          <polygon points="50,11 36,40 64,40" fill="rgba(255,255,255,0.45)" />
          <polygon points="50,11 64,40 85,37" fill="rgba(255,255,255,0.2)" />
          <polygon points="36,40 64,40 50,85" fill="rgba(0,0,0,0.2)" />
          <polygon points="15,37 36,40 28,85" fill="rgba(0,0,0,0.35)" />
          <polygon points="85,37 64,40 72,85" fill="rgba(0,0,0,0.15)" />
        </svg>
      );

    case 'purple_gem':
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0px 5px 10px rgba(168,85,247,0.6))">
          <defs>
            <linearGradient id="purpleGemUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5D0FE" />
              <stop offset="30%" stopColor="#C084FC" />
              <stop offset="70%" stopColor="#7E22CE" />
              <stop offset="100%" stopColor="#3B0764" />
            </linearGradient>
            <linearGradient id="goldBezelUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2A1" />
              <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
          </defs>
          <polygon points="50,90 10,20 90,20" fill="none" stroke="url(#goldBezelUltra)" strokeWidth="5.5" strokeLinejoin="round" />
          <polygon points="50,86 13,22 87,22" fill="url(#purpleGemUltra)" />
          <polygon points="50,86 50,44 13,22" fill="rgba(255,255,255,0.4)" />
          <polygon points="50,86 87,22 50,44" fill="rgba(0,0,0,0.2)" />
          <polygon points="13,22 87,22 50,44" fill="rgba(255,255,255,0.5)" />
        </svg>
      );

    case 'yellow_gem':
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0px 5px 10px rgba(234,179,8,0.6))">
          <defs>
            <linearGradient id="yellowGemUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="30%" stopColor="#EAB308" />
              <stop offset="70%" stopColor="#CA8A04" />
              <stop offset="100%" stopColor="#713F12" />
            </linearGradient>
            <linearGradient id="goldBezelUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2A1" />
              <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
          </defs>
          <polygon points="50,10 86,30 86,70 50,90 14,70 14,30" fill="none" stroke="url(#goldBezelUltra)" strokeWidth="5.5" strokeLinejoin="round" />
          <polygon points="50,13 83,32 83,68 50,87 17,68 17,32" fill="url(#yellowGemUltra)" />
          <polygon points="50,13 50,50 17,32" fill="rgba(255,255,255,0.45)" />
          <polygon points="50,13 83,32 50,50" fill="rgba(255,255,255,0.2)" />
          <polygon points="83,32 83,68 50,50" fill="rgba(0,0,0,0.1)" />
          <polygon points="50,87 83,68 50,50" fill="rgba(0,0,0,0.25)" />
          <polygon points="17,68 50,87 50,50" fill="rgba(0,0,0,0.2)" />
        </svg>
      );

    case 'green_gem':
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0px 5px 10px rgba(16,185,129,0.6))">
          <defs>
            <linearGradient id="greenGemUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="30%" stopColor="#10B981" />
              <stop offset="70%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>
            <linearGradient id="goldBezelUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2A1" />
              <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
          </defs>
          <polygon points="50,8 90,50 50,92 10,50" fill="none" stroke="url(#goldBezelUltra)" strokeWidth="5.5" strokeLinejoin="round" />
          <polygon points="50,11 87,50 50,89 13,50" fill="url(#greenGemUltra)" />
          <polygon points="50,11 50,50 13,50" fill="rgba(255,255,255,0.45)" />
          <polygon points="50,11 87,50 50,50" fill="rgba(255,255,255,0.2)" />
          <polygon points="87,50 50,89 50,50" fill="rgba(0,0,0,0.2)" />
          <polygon points="13,50 50,89 50,50" fill="rgba(0,0,0,0.3)" />
        </svg>
      );

    case 'blue_gem':
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0px 5px 10px rgba(14,165,233,0.6))">
          <defs>
            <linearGradient id="blueGemUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="30%" stopColor="#0284C7" />
              <stop offset="70%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#0C4A6E" />
            </linearGradient>
            <linearGradient id="goldBezelUltra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2A1" />
              <stop offset="100%" stopColor="#854D0E" />
            </linearGradient>
          </defs>
          <polygon points="50,12 88,50 50,88 12,50" fill="none" stroke="url(#goldBezelUltra)" strokeWidth="5.5" strokeLinejoin="round" />
          <polygon points="50,15 85,50 50,85 15,50" fill="url(#blueGemUltra)" />
          <polygon points="50,15 50,50 15,50" fill="rgba(255,255,255,0.5)" />
          <polygon points="50,15 85,50 50,50" fill="rgba(255,255,255,0.25)" />
          <polygon points="85,50 50,85 50,50" fill="rgba(0,0,0,0.15)" />
          <polygon points="15,50 50,85 50,50" fill="rgba(0,0,0,0.25)" />
        </svg>
      );

    case 'scatter_zeus':
      return (
        <svg viewBox="0 0 100 100" className={className} filter="drop-shadow(0px 0px 14px rgba(250,204,21,0.9))">
          <defs>
            <linearGradient id="zeusGoldWreath" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2A1" />
              <stop offset="50%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#713F12" />
            </linearGradient>
            <radialGradient id="zeusSkyBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="60%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#0B132B" />
            </radialGradient>
          </defs>

          {/* Golden Oval Laurels */}
          <ellipse cx="50" cy="50" rx="44" ry="47" fill="url(#zeusSkyBg)" stroke="url(#zeusGoldWreath)" strokeWidth="5.5" />

          {/* Electric Lightning bolt background streak */}
          <path d="M52 6 L36 46 L50 46 L42 90 L68 40 L52 40 Z" fill="#FDE047" opacity="0.5" />

          {/* Zeus Bust / Portrait */}
          <path d="M26 48 C18 54 18 78 34 82 C40 88 60 88 66 82 C82 78 82 54 74 48 C68 32 32 32 26 48 Z" fill="#F8FAFC" />
          <ellipse cx="50" cy="48" rx="15" ry="17" fill="#FDBA74" />
          {/* Glowing Electric Eyes */}
          <circle cx="44" cy="46" r="3" fill="#00F0FF" />
          <circle cx="56" cy="46" r="3" fill="#00F0FF" />
          {/* Mustache & Beard */}
          <path d="M38 56 Q50 50 62 56 Q50 84 38 56 Z" fill="#FFFFFF" />

          {/* Banner: SCATTER / FREE SPINS */}
          <rect x="8" y="78" width="84" height="16" rx="5" fill="url(#zeusGoldWreath)" stroke="#FFFFFF" strokeWidth="1.2" />
          <text x="50" y="90" textAnchor="middle" fill="#0F172A" fontSize="9" fontWeight="900" fontFamily="monospace" letterSpacing="0.5">
            FREE SPINS
          </text>
        </svg>
      );

    default:
      return null;
  }
};

interface MultiplierOrbProps {
  value: number;
}

export const ZeusMultiplierOrb: React.FC<MultiplierOrbProps> = ({ value }) => {
  let colorFrom = '#EF4444';
  let colorTo = '#991B1B';
  let shadowGlow = 'rgba(239,68,68,0.9)';

  if (value >= 100) {
    colorFrom = '#EC4899';
    colorTo = '#831843';
    shadowGlow = 'rgba(236,72,153,0.9)';
  } else if (value >= 25) {
    colorFrom = '#C084FC';
    colorTo = '#581C87';
    shadowGlow = 'rgba(192,132,252,0.9)';
  } else if (value >= 10) {
    colorFrom = '#38BDF8';
    colorTo = '#1E3A8A';
    shadowGlow = 'rgba(56,189,248,0.9)';
  } else if (value >= 2) {
    colorFrom = '#34D399';
    colorTo = '#064E3B';
    shadowGlow = 'rgba(52,211,153,0.9)';
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center animate-bounce">
      <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: `drop-shadow(0 0 14px ${shadowGlow})` }}>
        <defs>
          <radialGradient id={`orbCore_${value}`} cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor={colorFrom} />
            <stop offset="100%" stopColor={colorTo} />
          </radialGradient>
          <linearGradient id="goldWingUltra" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2A1" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#713F12" />
          </linearGradient>
        </defs>

        {/* Shimmering Golden Wings */}
        <path d="M26 50 Q4 28 8 12 Q32 22 36 44 Z" fill="url(#goldWingUltra)" stroke="#FFFFFF" strokeWidth="0.8" />
        <path d="M74 50 Q96 28 92 12 Q68 22 64 44 Z" fill="url(#goldWingUltra)" stroke="#FFFFFF" strokeWidth="0.8" />

        {/* Glowing Orb Body */}
        <circle cx="50" cy="50" r="29" fill={`url(#orbCore_${value})`} stroke="#FFD700" strokeWidth="3" />
        <circle cx="50" cy="50" r="33" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="5 3" />

        {/* Text Multiplier */}
        <text
          x="50"
          y="57"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="20"
          fontWeight="900"
          fontFamily="monospace"
          filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.95))"
        >
          {value}x
        </text>
      </svg>
    </div>
  );
};

export const ZeusCharacter: React.FC<{ isStriking: boolean }> = ({ isStriking }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none pointer-events-none">
      {/* Background Lightning Aura */}
      <div
        className={`absolute inset-0 bg-cyan-400/30 rounded-full blur-3xl transition-all duration-300 ${
          isStriking ? 'opacity-100 scale-150 animate-pulse' : 'opacity-40'
        }`}
      />

      <svg
        viewBox="0 0 200 300"
        className={`w-full h-auto max-h-[380px] transition-all duration-300 ${
          isStriking
            ? 'scale-110 -rotate-2 drop-shadow-[0_0_35px_rgba(56,189,248,1)]'
            : 'hover:scale-105 drop-shadow-[0_0_20px_rgba(234,179,8,0.7)]'
        }`}
      >
        <defs>
          <linearGradient id="zeusArmorGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2A1" />
            <stop offset="40%" stopColor="#EAB308" />
            <stop offset="80%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#713F12" />
          </linearGradient>
          <linearGradient id="zeusCape" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
          <radialGradient id="electricGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Divine Clouds */}
        <ellipse cx="100" cy="275" rx="85" ry="22" fill="rgba(255,255,255,0.25)" filter="blur(6px)" />

        {/* Regal Blue Cape */}
        <path d="M40 140 L20 260 L180 260 L160 140 Z" fill="url(#zeusCape)" opacity="0.8" />

        {/* Toga Body */}
        <path d="M55 135 L145 135 L155 260 L45 260 Z" fill="#F8FAFC" />

        {/* Gold Shoulder Cuirass */}
        <path d="M40 125 Q100 105 160 125 L150 160 Q100 138 50 160 Z" fill="url(#zeusArmorGold)" stroke="#FFFFFF" strokeWidth="1" />

        {/* Chest Medallion */}
        <circle cx="100" cy="150" r="14" fill="url(#zeusArmorGold)" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M100 142 L95 158 L108 148 L92 148 L105 158 Z" fill="#38BDF8" />

        {/* Head */}
        <ellipse cx="100" cy="92" rx="22" ry="26" fill="#FDBA74" />

        {/* Majestic Hair & Beard */}
        <path
          d="M62 82 C46 88 46 128 72 138 C82 144 118 144 128 138 C154 128 154 88 138 82 C128 55 72 55 62 82 Z"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />

        {/* Electric Eyes */}
        <circle cx="90" cy="88" r="4" fill={isStriking ? '#FFFFFF' : '#00F0FF'} />
        <circle cx="110" cy="88" r="4" fill={isStriking ? '#FFFFFF' : '#00F0FF'} />

        {/* Wreath */}
        <path d="M68 74 Q100 62 132 74" fill="none" stroke="url(#zeusArmorGold)" strokeWidth="4.5" />

        {/* Raised Arm holding Thunderbolt Staff */}
        <path d="M145 130 Q180 90 170 60" fill="none" stroke="#FDBA74" strokeWidth="16" strokeLinecap="round" />
        <path d="M145 130 Q180 90 170 60" fill="none" stroke="url(#zeusArmorGold)" strokeWidth="8" strokeLinecap="round" />

        {/* Lightning Bolt Staff */}
        <g transform="translate(150, 10) rotate(-10)">
          <path
            d="M32 -10 L10 35 L26 35 L0 95 L38 30 L22 30 Z"
            fill="#FDE047"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            filter="drop-shadow(0 0 12px #38BDF8)"
          />
          <circle cx="16" cy="40" r="40" fill="url(#electricGlow)" />
        </g>
      </svg>
    </div>
  );
};

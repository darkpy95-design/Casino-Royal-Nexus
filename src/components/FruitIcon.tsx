import React from 'react';
import { SymbolType } from '../types';

interface FruitIconProps {
  symbol: SymbolType | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const FruitIcon: React.FC<FruitIconProps> = ({ symbol, className = '', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8 sm:w-10 sm:h-10',
    lg: 'w-10 h-10 sm:w-14 sm:h-14',
    xl: 'w-14 h-14 sm:w-18 sm:h-18',
  };

  const finalSize = sizeMap[size] || sizeMap.md;

  switch (symbol) {
    case 'bar_large':
    case 'bar':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_8px_rgba(245,158,11,0.8)]`} viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="crownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
          <rect x="4" y="22" width="56" height="34" rx="6" fill="url(#barGrad)" stroke="#78350f" strokeWidth="2.5" />
          <rect x="8" y="26" width="48" height="26" rx="4" fill="none" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M16 22 L24 10 L32 18 L40 10 L48 22 Z" fill="url(#crownGrad)" stroke="#78350f" strokeWidth="2" />
          <circle cx="24" cy="8" r="3" fill="#ef4444" />
          <circle cx="32" cy="16" r="2.5" fill="#3b82f6" />
          <circle cx="40" cy="8" r="3" fill="#ef4444" />
          <text x="32" y="38" textAnchor="middle" fill="#451a03" fontSize="13" fontWeight="900" fontFamily="sans-serif">
            BAR
          </text>
          <text x="32" y="49" textAnchor="middle" fill="#78350f" fontSize="10" fontWeight="900" fontFamily="sans-serif">
            100.000
          </text>
        </svg>
      );

    case 'bar_small':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_6px_rgba(234,179,8,0.7)]`} viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="barSmallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <rect x="6" y="16" width="52" height="32" rx="6" fill="url(#barSmallGrad)" stroke="#78350f" strokeWidth="2" />
          <text x="32" y="32" textAnchor="middle" fill="#451a03" fontSize="12" fontWeight="900" fontFamily="sans-serif">
            MINI BAR
          </text>
          <text x="32" y="43" textAnchor="middle" fill="#78350f" fontSize="10" fontWeight="900" fontFamily="sans-serif">
            50.000
          </text>
        </svg>
      );

    case 'star_large':
    case 'star':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_10px_rgba(234,179,8,0.9)]`} viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          <path
            d="M32 4 L40 22 L60 24 L45 38 L50 58 L32 48 L14 58 L19 38 L4 24 L24 22 Z"
            fill="url(#starGrad)"
            stroke="#78350f"
            strokeWidth="2.5"
          />
          <path d="M32 10 L37 23 L50 25 L40 35 L43 48 L32 41 Z" fill="#ffffff" opacity="0.5" />
        </svg>
      );

    case 'star_small':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_6px_rgba(234,179,8,0.7)]`} viewBox="0 0 64 64" fill="none">
          <path d="M32 10 L37 23 L50 25 L40 35 L43 48 L32 41 L21 48 L24 35 L14 25 L27 23 Z" fill="#facc15" stroke="#78350f" strokeWidth="1.5" />
          <rect x="14" y="44" width="36" height="14" rx="4" fill="#a16207" stroke="#fef08a" strokeWidth="1" />
          <text x="32" y="54" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="sans-serif">
            x2
          </text>
        </svg>
      );

    case 'watermelon_large':
    case 'watermelon':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_8px_rgba(16,185,129,0.8)]`} viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="wmRind" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <linearGradient id="wmFlesh" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <path d="M6 20 C14 56, 50 56, 58 20 Z" fill="url(#wmRind)" stroke="#14532d" strokeWidth="2.5" />
          <path d="M10 22 C17 50, 47 50, 54 22 Z" fill="url(#wmFlesh)" />
          <circle cx="22" cy="32" r="2" fill="#1e1b4b" />
          <circle cx="32" cy="38" r="2" fill="#1e1b4b" />
          <circle cx="42" cy="32" r="2" fill="#1e1b4b" />
        </svg>
      );

    case 'watermelon_small':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_6px_rgba(16,185,129,0.7)]`} viewBox="0 0 64 64" fill="none">
          <path d="M12 24 C18 48, 46 48, 52 24 Z" fill="#22c55e" stroke="#14532d" strokeWidth="2" />
          <path d="M16 26 C21 44, 43 44, 48 26 Z" fill="#ef4444" />
          <rect x="14" y="44" width="36" height="14" rx="4" fill="#15803d" stroke="#86efac" strokeWidth="1" />
          <text x="32" y="54" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="sans-serif">
            x2
          </text>
        </svg>
      );

    case 'pear_large':
    case 'pear':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_8px_rgba(132,204,22,0.8)]`} viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="pearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d9f99d" />
              <stop offset="50%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#4d7c0f" />
            </linearGradient>
          </defs>
          <path d="M32 10 C24 10, 22 22, 14 36 C8 46, 16 58, 32 58 C48 58, 56 46, 50 36 C42 22, 40 10, 32 10 Z" fill="url(#pearGrad)" stroke="#365314" strokeWidth="2.5" />
          <path d="M32 10 Q34 4 38 2" stroke="#365314" strokeWidth="2.5" fill="none" />
          <path d="M32 8 Q40 4 40 10 Q32 10 32 8" fill="#15803d" stroke="#14532d" strokeWidth="1" />
        </svg>
      );

    case 'pear_small':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_6px_rgba(132,204,22,0.7)]`} viewBox="0 0 64 64" fill="none">
          <path d="M32 12 C26 12, 24 20, 18 32 C12 40, 18 50, 32 50 C46 50, 52 40, 46 32 C40 20, 38 12, 32 12 Z" fill="#84cc16" stroke="#365314" strokeWidth="1.5" />
          <rect x="14" y="44" width="36" height="14" rx="4" fill="#4d7c0f" stroke="#d9f99d" strokeWidth="1" />
          <text x="32" y="54" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="sans-serif">
            x2
          </text>
        </svg>
      );

    case 'apple_large':
    case 'apple':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_8px_rgba(220,38,38,0.8)]`} viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fca5a5" />
              <stop offset="40%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>
          <path
            d="M32 16 C26 12, 10 14, 10 32 C10 48, 22 56, 32 54 C42 56, 54 48, 54 32 C54 14, 38 12, 32 16 Z"
            fill="url(#appleGrad)"
            stroke="#450a0a"
            strokeWidth="2.5"
          />
          <path d="M32 16 Q34 8 38 6" stroke="#450a0a" strokeWidth="3" fill="none" />
          <path d="M32 12 Q42 10 40 16 Q32 16 32 12" fill="#22c55e" stroke="#14532d" strokeWidth="1.5" />
        </svg>
      );

    case 'apple_small':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_6px_rgba(220,38,38,0.7)]`} viewBox="0 0 64 64" fill="none">
          <path d="M32 14 C28 10, 16 12, 16 28 C16 40, 24 44, 32 42 C40 44, 48 40, 48 28 C48 12, 36 10, 32 14 Z" fill="#ef4444" stroke="#7f1d1d" strokeWidth="1.5" />
          <rect x="14" y="44" width="36" height="14" rx="4" fill="#991b1b" stroke="#fca5a5" strokeWidth="1" />
          <text x="32" y="54" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="sans-serif">
            x2
          </text>
        </svg>
      );

    case 'lemon_large':
    case 'lemon':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_8px_rgba(250,204,21,0.8)]`} viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="lemonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          <path d="M12 32 C12 18, 22 12, 36 12 C50 12, 54 22, 54 32 C54 44, 44 52, 30 52 C16 52, 12 44, 12 32 Z" fill="url(#lemonGrad)" stroke="#713f12" strokeWidth="2.5" />
          <ellipse cx="10" cy="32" rx="3" ry="5" fill="#ca8a04" />
          <ellipse cx="56" cy="32" rx="3" ry="5" fill="#ca8a04" />
          <path d="M32 12 Q36 6 42 4" stroke="#713f12" strokeWidth="2" fill="none" />
          <path d="M34 10 Q42 6 40 12 Z" fill="#22c55e" stroke="#14532d" strokeWidth="1" />
        </svg>
      );

    case 'lemon_small':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_6px_rgba(250,204,21,0.7)]`} viewBox="0 0 64 64" fill="none">
          <ellipse cx="32" cy="28" rx="18" ry="14" fill="#facc15" stroke="#713f12" strokeWidth="1.5" />
          <rect x="14" y="44" width="36" height="14" rx="4" fill="#854d0e" stroke="#fef08a" strokeWidth="1" />
          <text x="32" y="54" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="sans-serif">
            x2
          </text>
        </svg>
      );

    case 'peach_large':
    case 'peach':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_8px_rgba(251,146,60,0.8)]`} viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="peachGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fed7aa" />
              <stop offset="50%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          <path d="M32 14 C18 10, 8 22, 10 38 C12 52, 26 56, 32 54 C38 56, 52 52, 54 38 C56 22, 46 10, 32 14 Z" fill="url(#peachGrad)" stroke="#7c2d12" strokeWidth="2.5" />
          <path d="M32 14 Q30 34 32 54" stroke="#c2410c" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M32 14 Q36 6 42 4" stroke="#7c2d12" strokeWidth="2" fill="none" />
          <path d="M34 12 Q42 8 40 14 Z" fill="#22c55e" stroke="#14532d" strokeWidth="1" />
        </svg>
      );

    case 'peach_small':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_6px_rgba(251,146,60,0.7)]`} viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="28" r="16" fill="#fb923c" stroke="#7c2d12" strokeWidth="1.5" />
          <rect x="14" y="44" width="36" height="14" rx="4" fill="#9a3412" stroke="#ffedd5" strokeWidth="1" />
          <text x="32" y="54" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="sans-serif">
            x2
          </text>
        </svg>
      );

    case 'cherry_large':
    case 'cherry':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_8px_rgba(236,72,153,0.8)]`} viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="cherryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="50%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
          </defs>
          <path d="M20 40 Q28 20 38 8" stroke="#15803d" strokeWidth="3" fill="none" />
          <path d="M44 42 Q36 22 38 8" stroke="#15803d" strokeWidth="3" fill="none" />
          <path d="M38 8 Q48 4 48 12 Q38 12 38 8" fill="#22c55e" stroke="#14532d" strokeWidth="1.5" />
          <circle cx="20" cy="44" r="13" fill="url(#cherryGrad)" stroke="#4c0519" strokeWidth="2" />
          <circle cx="44" cy="46" r="13" fill="url(#cherryGrad)" stroke="#4c0519" strokeWidth="2" />
        </svg>
      );

    case 'cherry_small':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_6px_rgba(236,72,153,0.7)]`} viewBox="0 0 64 64" fill="none">
          <circle cx="24" cy="28" r="9" fill="#ec4899" stroke="#881337" strokeWidth="1.5" />
          <circle cx="40" cy="30" r="9" fill="#ec4899" stroke="#881337" strokeWidth="1.5" />
          <rect x="14" y="44" width="36" height="14" rx="4" fill="#be185d" stroke="#fbcfe8" strokeWidth="1" />
          <text x="32" y="54" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="sans-serif">
            x2
          </text>
        </svg>
      );

    case 'cactus':
      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_10px_rgba(34,197,94,0.9)] animate-pulse`} viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="cactusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
          </defs>
          {/* Main Stem */}
          <rect x="24" y="14" width="16" height="42" rx="8" fill="url(#cactusGrad)" stroke="#14532d" strokeWidth="2" />
          {/* Left Arm */}
          <path d="M24 28 H14 V38 H24" fill="none" stroke="url(#cactusGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {/* Right Arm */}
          <path d="M40 22 H50 V34 H40" fill="none" stroke="url(#cactusGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {/* Flower on Top */}
          <circle cx="32" cy="10" r="4" fill="#ec4899" stroke="#be185d" strokeWidth="1" />
          <rect x="6" y="46" width="52" height="14" rx="4" fill="#15803d" stroke="#bbf7d0" strokeWidth="1.5" />
          <text x="32" y="56" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="sans-serif">
            CACTUS x2
          </text>
        </svg>
      );

    case 'bonus_strawberry_2':
    case 'bonus_strawberry_3':
    case 'bonus_strawberry_4':
    case 'bonus_strawberry_5':
    case 'bonus_strawberry_6':
    case 'bonus_triple':
    case 'bonus_quad':
    case 'bonus': {
      let count = 2;
      if (symbol === 'bonus_strawberry_3' || symbol === 'bonus_triple') count = 3;
      if (symbol === 'bonus_strawberry_4' || symbol === 'bonus_quad') count = 4;
      if (symbol === 'bonus_strawberry_5') count = 5;
      if (symbol === 'bonus_strawberry_6') count = 6;

      return (
        <svg className={`${finalSize} ${className} drop-shadow-[0_2px_12px_rgba(244,63,94,0.9)] animate-pulse`} viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="frutillaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
          </defs>
          <path d="M32 14 C18 12, 10 24, 14 42 C18 54, 32 58, 32 58 C32 58, 46 54, 50 42 C54 24, 46 12, 32 14 Z" fill="url(#frutillaGrad)" stroke="#4c0519" strokeWidth="2" />
          <ellipse cx="22" cy="28" rx="1.5" ry="2.5" fill="#fef08a" />
          <ellipse cx="42" cy="28" rx="1.5" ry="2.5" fill="#fef08a" />
          <circle cx="25" cy="25" r="3.5" fill="#ffffff" />
          <circle cx="26" cy="25" r="1.5" fill="#000000" />
          <circle cx="39" cy="25" r="3.5" fill="#ffffff" />
          <circle cx="38" cy="25" r="1.5" fill="#000000" />
          <path d="M27 34 Q32 39 37 34" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
          <path d="M32 14 Q20 8 16 14 Q26 18 32 16 Q38 18 48 14 Q44 8 32 14" fill="#22c55e" stroke="#14532d" strokeWidth="1.5" />
          <rect x="6" y="46" width="52" height="14" rx="4" fill="#be123c" stroke="#fecdd3" strokeWidth="1.5" />
          <text x="32" y="56" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="sans-serif">
            {count} DISPAROS
          </text>
        </svg>
      );
    }

    default:
      return (
        <span className="text-2xl">{symbol}</span>
      );
  }
};

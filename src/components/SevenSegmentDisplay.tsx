import React from 'react';

interface SevenSegmentDisplayProps {
  value: number | string;
  digits?: number;
  color?: 'red' | 'green' | 'blue' | 'yellow' | 'cyan';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
}

export const SevenSegmentDisplay: React.FC<SevenSegmentDisplayProps> = ({
  value,
  digits = 4,
  color = 'red',
  size = 'md',
  label,
}) => {
  const formattedValue = String(value).padStart(digits, ' ');

  const colorClasses = {
    red: 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] bg-red-950/40 border-red-900/50',
    green: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.9)] bg-emerald-950/40 border-emerald-900/50',
    blue: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)] bg-cyan-950/40 border-cyan-900/50',
    yellow: 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)] bg-yellow-950/40 border-yellow-900/50',
    cyan: 'text-sky-300 drop-shadow-[0_0_8px_rgba(125,211,252,0.9)] bg-slate-950 border-sky-900/50',
  }[color];

  const sizeClasses = {
    sm: 'text-sm px-1.5 py-0.5 tracking-widest min-w-[50px]',
    md: 'text-xl md:text-2xl px-2.5 py-1 tracking-widest min-w-[80px]',
    lg: 'text-3xl md:text-4xl px-3 py-1.5 tracking-widest min-w-[120px]',
    xl: 'text-4xl md:text-5xl px-4 py-2 tracking-widest min-w-[150px]',
  }[size];

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300/90 mb-1 drop-shadow-sm font-mono">
          {label}
        </span>
      )}
      <div
        className={`font-mono font-bold rounded-lg border-2 shadow-inner text-center select-none ${colorClasses} ${sizeClasses}`}
        style={{ fontFamily: '"Courier New", Courier, monospace, monospace' }}
      >
        {formattedValue}
      </div>
    </div>
  );
};

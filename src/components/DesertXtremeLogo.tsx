import React from 'react';

interface DesertXtremeLogoProps {
  customLogo?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const DesertXtremeLogo: React.FC<DesertXtremeLogoProps> = ({
  customLogo,
  size = 'md',
  showText = false,
  className = ''
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  };

  const iconSizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64
  };

  const dimension = iconSizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-xl bg-gradient-to-br from-[#FF6B35] via-[#FF7A00] to-[#F7931E] flex items-center justify-center shadow-md overflow-hidden shrink-0 border border-white/25 p-1 relative`}
      >
        {customLogo ? (
          <img
            src={customLogo}
            alt="Desert Xtreme Adventure"
            className="w-full h-full object-contain rounded-lg"
            referrerPolicy="no-referrer"
          />
        ) : (
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
          >
            {/* Desert Sun / Radiant Horizon */}
            <circle cx="24" cy="18" r="10" fill="#FFE57F" opacity="0.95" />
            <path
              d="M24 4V7M24 29V32M10 18H13M35 18H38M14 8L16.5 10.5M31.5 25.5L34 28M14 28L16.5 25.5M31.5 10.5L34 8"
              stroke="#FFF"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Desert Dunes Gradient Silhouette */}
            <path
              d="M2 38C9 30 18 28 26 33C34 38 41 33 46 36V44H2V38Z"
              fill="#D35400"
            />
            <path
              d="M0 42C10 35 22 36 30 40C38 44 44 41 48 43V48H0V42Z"
              fill="#A04000"
            />
            {/* Dynamic DXA "X" / Buggy Flag Accent */}
            <path
              d="M18 16L30 30M30 16L18 30"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {showText && (
        <div className="leading-tight">
          <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5 uppercase">
            <span>Desert Xtreme</span>
            <span className="text-[#FF8A00] font-bold">POS</span>
          </div>
          <div className="text-[10px] text-amber-300 font-medium tracking-wide">
            Adventure Safe & Cashier
          </div>
        </div>
      )}
    </div>
  );
};

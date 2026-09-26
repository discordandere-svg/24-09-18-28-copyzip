import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'white';
  size?: 'sm' | 'md' | 'lg';
}

export const SolarFastLogo: React.FC<LogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
}) => {
  const isWhite = variant === 'white';
  const sizeClass = size === 'sm' ? 'scale-90' : size === 'lg' ? 'scale-110' : '';

  return (
    <div className={`flex items-center gap-2.5 select-none ${sizeClass} ${className}`}>
      <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#0c2417] to-[#143725] p-2 flex items-center justify-center shrink-0 border border-emerald-800/40 shadow-xs">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-emerald-400"
        >
          <circle cx="16" cy="16" r="13" stroke="#2e7d32" strokeWidth="1.2" strokeDasharray="2 3" opacity="0.4" />
          <path
            d="M16 4L26 14L16 24L6 14L16 4Z"
            fill="url(#solarFastGrad)"
            stroke="#4ade80"
            strokeWidth="1.2"
          />
          <path
            d="M17 9L11.5 17H16L14.5 23L21 14.5H16.5L17 9Z"
            fill="#ffffff"
          />
          <defs>
            <linearGradient id="solarFastGrad" x1="6" y1="4" x2="26" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#15803d" />
              <stop offset="1" stopColor="#22c55e" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {variant !== 'icon' && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center tracking-tight font-black text-base sm:text-lg">
            <span className={isWhite ? 'text-white' : 'text-[#0c2417]'}>SOLAR</span>
            <span className="text-emerald-700 font-extrabold ml-0.5">FAST</span>
          </div>
          <span
            className={`text-[9px] tracking-widest uppercase font-bold ${
              isWhite ? 'text-emerald-300/80' : 'text-slate-500'
            }`}
          >
            Tafeladvies Rekenmodel
          </span>
        </div>
      )}
    </div>
  );
};

export const VaillantLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  size = 'md',
}) => {
  const height = size === 'sm' ? 'h-6' : size === 'lg' ? 'h-9' : 'h-7';
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#004f38] text-white border border-[#00684a] select-none ${height} ${className}`}
    >
      <svg
        viewBox="0 0 24 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto text-white shrink-0 py-0.5"
      >
        <path
          d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12V26H2V12Z"
          fill="#006b4d"
          stroke="#34d399"
          strokeWidth="0.8"
        />
        <path
          d="M10 6C10 6 9 10 10.5 12C10.5 12 11.5 8 13.5 8C15.5 8 14.5 12 14.5 12C16 10 15 6 15 6C15 6 17 9 16.5 13C16.5 16 14.5 19 12 19C9.5 19 7.5 16 7.5 13C7 9 10 6 10 6Z"
          fill="#ffffff"
        />
        <circle cx="10.5" cy="13" r="0.7" fill="#004f38" />
        <circle cx="13.5" cy="13" r="0.7" fill="#004f38" />
      </svg>
      <span className="font-black tracking-wider text-xs sm:text-sm uppercase font-sans text-white">
        Vaillant
      </span>
    </div>
  );
};

export const HyxiPowerLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  className = '',
  size = 'md',
}) => {
  const height = size === 'sm' ? 'h-6' : size === 'lg' ? 'h-9' : 'h-7';
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#062817] text-white border border-[#0d4a2b] select-none ${height} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto shrink-0 py-0.5"
      >
        <path
          d="M12 2L20 6.5V17.5L12 22L4 17.5V6.5L12 2Z"
          stroke="#34d399"
          strokeWidth="1.5"
          fill="#0b3820"
        />
        <path d="M13 7L9 13H13L11 18L16 12H12L13 7Z" fill="#34d399" />
      </svg>
      <div className="flex items-center font-black tracking-tight text-xs sm:text-sm">
        <span className="text-white">HYXI</span>
        <span className="text-[#34d399] font-bold ml-0.5">POWER</span>
      </div>
    </div>
  );
};


import React from 'react';
import { Lifelines as LifelinesType } from '../types';

interface Props {
  lifelines: LifelinesType;
  onUse: (type: keyof LifelinesType) => void;
  disabled: boolean;
}

const Lifelines: React.FC<Props> = ({ lifelines, onUse, disabled }) => {
  const items = [
    { key: 'fiftyFifty' as keyof LifelinesType, label: '50:50', icon: 'fa-adjust' },
    { key: 'audiencePoll' as keyof LifelinesType, label: 'Audience Poll', icon: 'fa-users' },
    { key: 'doubleDip' as keyof LifelinesType, label: 'Double Dip', icon: 'fa-repeat' },
    { key: 'flipQuestion' as keyof LifelinesType, label: 'Flip', icon: 'fa-shuffle' },
  ];

  return (
    <div className="flex justify-center items-center gap-2 md:gap-4 w-full max-w-2xl mx-auto py-2 px-4 bg-gradient-to-r from-transparent via-blue-900/40 to-transparent rounded-full border-y border-[#d4af37]/20 backdrop-blur-md">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onUse(item.key)}
          disabled={disabled || !lifelines[item.key]}
          className={`group relative flex items-center justify-center w-12 h-12 md:w-20 md:h-20 rounded-full border-2 transition-all duration-300 ${
            !lifelines[item.key] 
              ? 'opacity-20 bg-gray-950 border-gray-800 cursor-not-allowed' 
              : 'bg-black/60 border-[#d4af37]/60 hover:border-white hover:scale-110 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
          }`}
          title={item.label}
        >
          {lifelines[item.key] && (
            <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse"></div>
          )}
          <i className={`fas ${item.icon} text-sm md:text-2xl ${!lifelines[item.key] ? 'text-gray-600' : 'gold-text group-hover:text-white'}`}></i>
          
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-[#d4af37] px-2 py-0.5 rounded text-[8px] gold-text font-black whitespace-nowrap pointer-events-none z-50">
            {item.label}
          </div>
        </button>
      ))}
    </div>
  );
};

export default Lifelines;

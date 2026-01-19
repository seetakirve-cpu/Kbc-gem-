
import React from 'react';
import { MONEY_TREE } from '../constants';

interface Props {
  currentLevel: number;
}

const Sidebar: React.FC<Props> = ({ currentLevel }) => {
  return (
    <div className="bg-[#000d1a]/95 w-full h-full p-6 flex flex-col border-l border-[#d4af37]/30 shadow-2xl overflow-y-auto">
      <div className="mb-6 text-center">
        <h3 className="gold-text font-black text-xl tracking-[0.2em] uppercase italic">
          MONEY TREE
        </h3>
        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto mt-2"></div>
      </div>

      <div className="flex flex-col space-y-1 justify-center">
        {MONEY_TREE.map((level) => {
          const isActive = level.id === currentLevel;
          const isCompleted = level.id < currentLevel;
          const isSafeZone = level.isSafeZone;
          
          return (
            <div 
              key={level.id}
              className={`relative flex items-center h-9 px-4 transition-all duration-300 rounded-lg overflow-hidden ${
                isActive 
                  ? 'bg-gradient-to-r from-orange-600 to-orange-400 scale-105 z-10 shadow-[0_0_20px_rgba(234,88,12,0.5)]' 
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center w-10 mr-2">
                <span className={`text-[10px] font-black ${
                  isActive ? 'text-white' : isCompleted ? 'text-green-400' : isSafeZone ? 'text-white' : 'text-[#d4af37]/40'
                }`}>
                  {level.id < 10 ? `0${level.id}` : level.id}
                </span>
                <div className={`w-1.5 h-1.5 rotate-45 ml-2 ${
                  isActive ? 'bg-white' : isSafeZone ? 'bg-white/80' : 'bg-[#d4af37]/30'
                }`}></div>
              </div>

              <div className={`flex-grow text-right font-bold tracking-tighter ${
                isActive 
                  ? 'text-white text-base' 
                  : isCompleted 
                    ? 'text-green-500/50 line-through' 
                    : isSafeZone 
                      ? 'text-white text-sm' 
                      : 'text-orange-200/40'
              }`}>
                {level.amount}
              </div>

              {isSafeZone && (
                <div className={`absolute right-0 top-0 bottom-0 w-1 ${isActive ? 'bg-white' : 'bg-white/20'}`}></div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-4 text-center">
        <p className="text-[10px] gold-text opacity-40 font-bold uppercase tracking-widest">
          The Grand Prize: ₹7 Crore
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
